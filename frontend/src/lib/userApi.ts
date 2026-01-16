import { authHeader, logout, OFFLINE, refreshAuth, setToken, setUserId } from './auth'
// Centralny klient API z trybem OFFLINE (mocki)
const GATEWAY = (import.meta.env.VITE_GATEWAY_URL || '').replace(/\/$/, '')
const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? '/api').replace(/\/$/, '')
const AUTH_URL = (import.meta.env.VITE_AUTH_URL || GATEWAY || import.meta.env.VITE_IDENTITY_URL || '').replace(/\/$/, '')
const USE_GATEWAY_PREFIX = !!API_PREFIX;
// Bazowe ścieżki usług
const USER_BASE = `${AUTH_URL}${USE_GATEWAY_PREFIX ? API_PREFIX : ''}/user`
const AUTH_BASE = `${AUTH_URL}${USE_GATEWAY_PREFIX ? API_PREFIX : ''}/auth`
const PASSWORD_BASE = `${AUTH_BASE}/password`
const LOGOUT_URL = `${AUTH_URL}${USE_GATEWAY_PREFIX ? API_PREFIX : ''}/logout`

// Debug: wypisz skonfigurowane URL-e, przy imporcie modułu (pomaga zweryfikować czy frontend używa właściwego API_PREFIX/AUTH_URL)
if (typeof window !== 'undefined') {
  try {
    console.info('[userApi] resolved endpoints', { AUTH_URL, API_PREFIX, USER_BASE, AUTH_BASE, LOGOUT_URL })
  } catch (e) {
    // noop
  }
}

export type RegisterPayload = { username: string; password: string; email: string }
export type RegisterResponse = { success: boolean; message?: string; timestamp?: string }

export type PasswordResetRequestPayload = { email: string }
export type PasswordResetResponse = { status?: boolean; message?: string; timestamp?: string }
export type NewPasswordPayload = { email: string; code: string; password: string; confirmNewPassword: string }
export type NewPasswordResponse = { status?: boolean; message?: string; timestamp?: string }

export type MemberProfile = {
  id: number
  firstName: string
  lastName: string
  maskedPesel?: string
  birthDate?: string
  phoneNumber?: string
  height?: number
  weight?: number
  age?: number
}

export type TeamSummary = {
  teamId: number
  teamName: string
  category?: string
  myStatus?: string
  numberOfMembers?: number
}

export type TeamDetails = {
  id: number
  name: string
  code?: string
  category?: string
  createdAt?: string
  description?: string
  members?: Array<{ teamMemberId: number; memberId: number; firstName: string; lastName: string; roles?: string[]; status?: string }>
}

export const TEAM_ROLES = [
  'ROLE_TEAM_PLAYER',
  'ROLE_TEAM_CAPTAIN',
  'ROLE_TEAM_HEAD_COACH',
  'ROLE_TEAM_ASSISTANT_COACH',
  'ROLE_TEAM_PHYSIO',
  'ROLE_TEAM_MANAGER',
] as const

// Mock data
const mockMyProfile: MemberProfile = {
  id: 1,
  firstName: 'Jan',
  lastName: 'Kowalski',
  maskedPesel: '90********12',
  birthDate: '1990-01-01',
  phoneNumber: '+48123456789',
  height: 180,
  weight: 75,
  age: 36,
}

const mockTeams: TeamSummary[] = [
  { teamId: 1, teamName: 'Drużyna A', category: 'Amatorska', myStatus: 'MEMBER', numberOfMembers: 10 },
  { teamId: 2, teamName: 'Drużyna B', category: 'Profesjonalna', myStatus: 'NONE', numberOfMembers: 15 },
]

const mockTeamDetails: TeamDetails = {
  id: 1,
  name: 'Drużyna A',
  code: 'ABC1234567',
  category: 'Amatorska',
  createdAt: new Date().toISOString(),
  members: [
    { teamMemberId: 1, memberId: 11, firstName: 'Jan', lastName: 'Kowalski', roles: ['PLAYER'], status: 'ACTIVE' },
    { teamMemberId: 2, memberId: 12, firstName: 'Anna', lastName: 'Nowak', roles: ['PLAYER'], status: 'ACTIVE' },
  ],
}

// Flags to control mocking/forcing real API
const FORCE_REAL_API = import.meta.env.VITE_FORCE_REAL_API === 'true'
const ENABLE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === 'true'

if (typeof window !== 'undefined') {
  console.info('[userApi] flags', { OFFLINE, ENABLE_MOCKS, FORCE_REAL_API })
}

// Helper for fetch wrapper
type ApiRequestOptions = RequestInit & { dontRedirectOnAuthError?: boolean; skipAuthHeader?: boolean }

async function fetchJson(url: string, opts: ApiRequestOptions = {}) {
    const { dontRedirectOnAuthError, skipAuthHeader, ...rest } = opts
    const auth = skipAuthHeader ? {} : authHeader()
    const method = (rest.method || 'GET').toString().toUpperCase()
    const requestHasBody = !!rest.body

    const headers: any = { ...(rest.headers as any || {}), ...auth }
    if (requestHasBody || (method !== 'GET' && method !== 'HEAD')) {
        headers['Content-Type'] = 'application/json'
    }
    const res = await fetch(url, { ...rest, headers, credentials: 'include' })


    if (!res.ok) {
        if (res.status === 401 && !dontRedirectOnAuthError) {
            logout()
            if (typeof window !== 'undefined') window.location.href = '/login'
        }

        const text = await res.text().catch(() => '')
        const message = text || res.statusText
        const err: any = new Error(message)
        err.status = res.status
        throw err
    }
  // Bezpieczne parsowanie - jeśli brak treści lub nie-json, zwracamy null
  const contentType = res.headers.get('content-type') || ''
  const contentLength = res.headers.get('content-length')
  const responseHasBody = (contentLength && Number(contentLength) > 0) || contentType.includes('application/json')
  if (res.status === 204 || !responseHasBody) return null
  return res.json()
}

export type MemberStatus = 'guest' | 'pending' | 'member'

const MEMBER_STATUS_KEY = 'memberStatus'

function readMemberStatus(): MemberStatus {
  if (typeof localStorage === 'undefined') return 'guest'
  const val = localStorage.getItem(MEMBER_STATUS_KEY)
  return (val as MemberStatus) || 'guest'
}

function writeMemberStatus(status: MemberStatus) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(MEMBER_STATUS_KEY, status)
}

export function resetMemberStatusMock() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(MEMBER_STATUS_KEY)
}

export function getMemberStatus(): MemberStatus {
  return OFFLINE ? 'member' : readMemberStatus()
}

// Sync member status with backend; if profile is accessible mark as member, otherwise keep guest/pending
export async function ensureMemberStatus(): Promise<MemberStatus> {
  if (OFFLINE) return 'member'
  const current = readMemberStatus()
  if (current === 'member') return 'member'
  try {
    await getMyProfile({ allowUnauth: true })
    writeMemberStatus('member')
    return 'member'
  } catch (err: any) {
    // If still unauthorized/forbidden, keep pending if we were pending, otherwise guest
    if (current === 'pending') {
      writeMemberStatus('pending')
      return 'pending'
    }
    writeMemberStatus('guest')
    return 'guest'
  }
}

export async function applyForMembership(payload: { firstName?: string; lastName?: string; phone?: string; position?: string; note?: string; pesel?: string; birthDate?: string; height?: number; weight?: number }) {
  if (OFFLINE) {
    writeMemberStatus('pending')
    return Promise.resolve({ status: 'pending', submitted: payload })
  }

  // Mapuj pola z prostego formularza do NewMemberRequestDTO oczekiwanego przez backend
  const body: any = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    pesel: payload.pesel,
    birthDate: payload.birthDate ?? null,
    phoneNumber: payload.phone,
    height: payload.height,
    weight: payload.weight,
  }

  // Użyj istniejącej funkcji addMember (która robi PUT /user/members/join)
  const res = await addMember(body)
  if (res === true) writeMemberStatus('member')
  else writeMemberStatus('pending')
  return res
}

export async function apiLogout(): Promise<void> {
  if (OFFLINE) {
    logout()
    resetMemberStatusMock()
    return
  }
  try {
    await fetchJson(LOGOUT_URL, { method: 'POST' })
  } finally {
    logout()
    resetMemberStatusMock()
  }
}

export async function getMyProfile(opts?: { allowUnauth?: boolean }): Promise<MemberProfile> {
  if (OFFLINE) return Promise.resolve(mockMyProfile)
  return fetchJson(`${USER_BASE}/members/me`, { dontRedirectOnAuthError: opts?.allowUnauth })
}

export async function updateMyProfile(payload: { height?: number; weight?: number; phoneNumber?: string }): Promise<MemberProfile> {
  if (OFFLINE) {
    // apply to mock
    Object.assign(mockMyProfile, payload)
    return Promise.resolve(mockMyProfile)
  }
  return fetchJson(`${USER_BASE}/members/me`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function getTeams(params?: { mode?: string; teamId?: number; name?: string; page?: number; size?: number }, opts?: { allowUnauth?: boolean; forceReal?: boolean; skipAuthHeader?: boolean }): Promise<{ items: TeamSummary[]; total?: number }>{
  // Use mock data only when explicitly enabled (VITE_ENABLE_MOCKS=true) and OFFLINE is true,
  // unless VITE_FORCE_REAL_API=true or caller passed opts.forceReal === true.
  const callerForceReal = !!opts?.forceReal
  if (OFFLINE && !FORCE_REAL_API && ENABLE_MOCKS && !callerForceReal) {
    console.debug('[userApi.getTeams] returning mockTeams because OFFLINE && ENABLE_MOCKS && !forceReal')
    return Promise.resolve({ items: mockTeams, total: mockTeams.length })
  }
  const qs = new URLSearchParams()
  if (params?.mode) qs.set('mode', params.mode)
  if (params?.teamId !== undefined && params.teamId !== null) qs.set('teamId', String(params.teamId))
  if (params?.name) qs.set('name', params.name)
  if (params?.page !== undefined && params.page !== null) qs.set('page', String(params.page))
  if (params?.size !== undefined && params.size !== null) qs.set('size', String(params.size))

  // Prefer relative API path so Vite dev server can proxy /api to backend and avoid CORS.
  const relUrl = `${API_PREFIX}/user/teams?${qs.toString()}`
  const fullApiUrl = `${USER_BASE}/teams?${qs.toString()}`
  try {
    const data = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth, skipAuthHeader: !!opts?.skipAuthHeader })
    return { items: data?.content ?? data?.items ?? [], total: data?.totalElements ?? data?.total ?? data?.content?.length }
  } catch (e) {
    console.warn('[userApi.getTeams] relative fetch failed, trying full URL', { relUrl, err: e })
    // If unauthenticated mode is allowed, avoid throwing — return mock data so UI remains usable in dev
    if (opts?.allowUnauth) {
      console.warn('[userApi.getTeams] returning mockTeams because allowUnauth is true and backend fetch failed')
      return { items: mockTeams, total: mockTeams.length }
    }
    // try full URL once
    try {
      const data2 = await fetchJson(fullApiUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
      return { items: data2?.content ?? data2?.items ?? [], total: data2?.totalElements ?? data2?.total ?? data2?.content?.length }
    } catch (e2) {
      console.error('[userApi.getTeams] full URL fetch failed', { fullApiUrl, err: e2 })
      const err: any = new Error('Failed to fetch teams from backend')
      err.original = e2
      throw err
    }
  }
}

export async function getTeamDetails(teamId: number, opts?: { forceReal?: boolean; allowUnauth?: boolean; skipAuthHeader?: boolean }): Promise<TeamDetails> {
  const callerForceReal = !!opts?.forceReal
  if (OFFLINE && !FORCE_REAL_API && ENABLE_MOCKS && !callerForceReal) {
    console.debug('[userApi.getTeamDetails] returning MOCK details', { teamId })
    return Promise.resolve(teamId === mockTeamDetails.id ? mockTeamDetails : { ...mockTeamDetails, id: teamId, name: `Drużyna ${teamId}` })
  }

  const relUrl = `${API_PREFIX}/user/teams/${teamId}`
  const fullUrl = `${USER_BASE}/teams/${teamId}`

  // Try relative (proxy) first to avoid CORS issues in dev
  console.debug('[userApi.getTeamDetails] attempting relative fetch (no auth header) to reduce preflight if requested', { relUrl, skipAuthHeaderRequested: !!opts?.skipAuthHeader })
  try {
    const data = await fetchJson(relUrl, { skipAuthHeader: !!opts?.skipAuthHeader, dontRedirectOnAuthError: opts?.allowUnauth })
    console.debug('[userApi.getTeamDetails] relative fetch (no auth) success', { teamId, relUrl, data })
    // Normalize description from multiple possible fields
    if (data) {
      const desc = (data as any).description ?? (data as any).teamDescription ?? (data as any).summary ?? (data as any).desc ?? (data as any).about ?? (data as any).details?.description ?? null
      if (desc) (data as any).description = desc
    }
    return data
  } catch (e) {
    console.warn('[userApi.getTeamDetails] relative fetch (no auth) failed, trying relative with auth', { relUrl, err: e })
  }

  // try relative with auth header
  try {
    console.debug('[userApi.getTeamDetails] attempting relative fetch (with auth)', { relUrl })
    const dataAuth = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
    console.debug('[userApi.getTeamDetails] relative fetch (with auth) success', { teamId, relUrl, dataAuth })
    if (dataAuth) {
      const desc = (dataAuth as any).description ?? (dataAuth as any).teamDescription ?? (dataAuth as any).summary ?? (dataAuth as any).desc ?? (dataAuth as any).about ?? (dataAuth as any).details?.description ?? null
      if (desc) (dataAuth as any).description = desc
    }
    return dataAuth
  } catch (e) {
    console.warn('[userApi.getTeamDetails] relative fetch with auth failed, trying full URL', { relUrl, err: e })
  }

  // Try full URL (direct to gateway/identity)
  console.debug('[userApi.getTeamDetails] attempting full fetch', { fullUrl })
  try {
    const data2 = await fetchJson(fullUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
    console.debug('[userApi.getTeamDetails] full fetch success', { teamId, fullUrl, data2 })
    if (data2) {
      const desc = (data2 as any).description ?? (data2 as any).teamDescription ?? (data2 as any).summary ?? (data2 as any).desc ?? (data2 as any).about ?? (data2 as any).details?.description ?? null
      if (desc) (data2 as any).description = desc
    }
    return data2
  } catch (e2) {
    console.error('[userApi.getTeamDetails] full fetch failed', { fullUrl, err: e2 })
    // If caller explicitly forced real call, rethrow to let caller handle the error
    if (callerForceReal || FORCE_REAL_API) throw e2
    // otherwise, as a last resort, if mocks are enabled return mock; else rethrow
    if (OFFLINE && ENABLE_MOCKS) {
      console.debug('[userApi.getTeamDetails] returning MOCK details after fetch failures', { teamId })
      return teamId === mockTeamDetails.id ? mockTeamDetails : { ...mockTeamDetails, id: teamId, name: `Drużyna ${teamId}` }
    }
    throw e2
  }
}

// Tworzy nowy zespół (POST /user/teams)
export async function createTeam(payload: { name: string; code?: string; status?: string; category?: string; description?: string }) {
  if (OFFLINE) {
    const nextId = (mockTeams.length ? Math.max(...mockTeams.map(t => t.teamId)) : 0) + 1
    const newTeam: TeamSummary = { teamId: nextId, teamName: payload.name, category: payload.category, myStatus: 'MEMBER', numberOfMembers: 1 }
    // attach description on mock as optional property (not part of TeamSummary type).
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    newTeam.description = payload.description
    mockTeams.push(newTeam)
    return Promise.resolve(newTeam)
  }

  // Normalize status and map legacy values
  const normalizedStatus = payload.status === undefined || payload.status === null ? undefined : String(payload.status).toUpperCase()
  const mappedStatus = normalizedStatus === 'INACTIVE' ? 'SUSPENDED' : normalizedStatus
  const body: any = { name: payload.name, category: payload.category, code: payload.code, description: payload.description }
  if (mappedStatus !== undefined) body.status = mappedStatus

  // Try relative URL first (works with Vite proxy in dev), then fall back to full USER_BASE URL
  const relUrl = `${API_PREFIX}/user/teams/new`
  const fullUrl = `${USER_BASE}/teams/new`

  // attempt relative
  try {
    console.debug('[userApi.createTeam] attempting relative PUT', { url: relUrl, body })
    await fetchJson(relUrl, { method: 'PUT', body: JSON.stringify(body) })
    return true
  } catch (e) {
    console.warn('[userApi.createTeam] relative PUT failed, will try full URL', { relUrl, err: e })
  }

  // attempt full URL
  try {
    console.debug('[userApi.createTeam] attempting full PUT', { url: fullUrl, body })
    await fetchJson(fullUrl, { method: 'PUT', body: JSON.stringify(body) })
    return true
  } catch (e2) {
    console.error('[userApi.createTeam] full PUT failed', { fullUrl, err: e2 })
    throw e2
  }
 }

// Aktualizuje zespół (PUT /user/teams/{id}) — jeśli backend używa PATCH/inna ścieżka, zmień tutaj.
 export async function updateTeam(payload: {id:number ; name?: string; code?: string; status?: string; category?: string; description?: string }) {
   if (OFFLINE) {
     // Aktualizuj mockTeams
     const idx = mockTeams.findIndex(t => t.teamId === payload.id)
     if (idx >= 0) {
       const t = mockTeams[idx]
       const updated = { ...t }
       if (payload.name) updated.teamName = payload.name
       if (payload.category) updated.category = payload.category
       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
       // @ts-ignore
       if (payload.description) updated.description = payload.description
       mockTeams[idx] = updated
     }
     // Aktualizuj mockTeamDetails jeśli pasuje
     if (mockTeamDetails.id === payload.id) {
       if (payload.name) mockTeamDetails.name = payload.name
       if (payload.code) mockTeamDetails.code = payload.code
       if (payload.category) mockTeamDetails.category = payload.category
       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
       // @ts-ignore
       if (payload.description) (mockTeamDetails as any).description = payload.description
     }
     return Promise.resolve(true)
   }

   const body: any = {}
   if (payload.name !== undefined) body.name = payload.name
   if (payload.code !== undefined) body.code = payload.code
   if (payload.status !== undefined) body.status = (payload.status === 'INACTIVE' ? 'SUSPENDED' : payload.status)
   if (payload.category !== undefined) body.category = payload.category
   if (payload.description !== undefined) body.description = payload.description

    body.id = payload.id
  // Wyślij PUT do endpointu aktualizacji — użyj PUT jako domyślnego; jeśli backend wymaga PATCH, zmień metodę.
  await fetchJson(`${USER_BASE}/teams/update`, { method: 'PATCH', body: JSON.stringify(body) })
  return true
 }

export async function joinTeam(teamCode: string, opts?: { allowUnauth?: boolean }): Promise<void> {
  if (OFFLINE) {
    if (!teamCode || teamCode.length < 10) throw new Error('Kod zespołu musi mieć od 10 do 16 znaków (mock)')
    return Promise.resolve()
  }
  await fetchJson(`${USER_BASE}/team-management/join`, { method: 'POST', body: JSON.stringify({ teamCode }), dontRedirectOnAuthError: opts?.allowUnauth })
  // Po dołączeniu do zespołu token może wymagać odświeżenia (np. nowe role/claims) — wywołaj endpoint refresh
  try {
    await refreshAuth().catch(() => {})
  } catch (e) {
    // Nie blokujemy flowu, jeśli odświeżenie nie powiedzie się
    console.warn('Token refresh failed after joinTeam', e)
  }
}

// Dodaje nowego członka/zgłoszenie członka — zgodne z NewMemberRequestDTO na backendzie (PUT /user/members/join)
export async function addMember(payload: { firstName: string; lastName: string; pesel: string; birthDate: string | null; phoneNumber?: string; height?: number; weight?: number }) {
  if (OFFLINE) {
    // w trybie offline ustawiamy status pending i zwracamy symulowany wynik
    writeMemberStatus('pending')
    return Promise.resolve(true)
  }
  // Pozwól nieautoryzowanym użytkownikom wysyłać wniosek o członkostwo (backend przyjmuje również anonimowe zgłoszenia)
  // skipAuthHeader: true - nie dołączamy nagłówka Authorization
  // dontRedirectOnAuthError: true - nie wymuszamy przekierowania przy 401/403
  // Ustaw redirect: 'manual' aby przeglądarka nie podążała za ewentualnym przekierowaniem do /auth/login
  // (które powoduje 405 przy PUT). Pozwoli to frontendowi wykryć konieczność logowania.

  // Wykonaj fetch ręcznie z redirect: 'manual', aby przechwycić ewentualne przekierowania do /auth/login
  // Jeśli AUTH_URL wskazuje inny origin niż bieżący (np. gateway w innym hoście),
  // to fetch będzie cross-origin i może powodować CORS errors podczas developmentu.
  // W takim wypadku użyj relatywnego prefiksu API (API_PREFIX, np. '/api') aby Vite proxy przechwyciło żądanie.
  let url = `${USER_BASE}/members/join`
  try {
    if (typeof window !== 'undefined' && AUTH_URL) {
      const authOrigin = new URL(AUTH_URL, window.location.href).origin
      const appOrigin = window.location.origin
      // jeśli originy różne i proxy nie wyłączone, korzystaj z relatywnego endpointu
      if (authOrigin && authOrigin !== appOrigin && (import.meta.env.VITE_DISABLE_PROXY !== 'true')) {
        url = `${API_PREFIX}/user/members/join`
      }
    }
  } catch (e) {
    // jeśli analiza URL się nie powiedzie, zachowaj domyślny USER_BASE
  }

  const init: RequestInit = {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    redirect: 'manual' as RequestRedirect,
  }

  // Do not attach Authorization header here (skipAuthHeader behavior)
  // Try multiple candidate URLs in case dev proxy isn't active or AUTH_URL differs.
  const candidates: string[] = []
  // push normalized order: current computed url first
  candidates.push(url)
  // ensure relative API path is attempted
  const rel = `${API_PREFIX}/user/members/join`
  if (!candidates.includes(rel)) candidates.push(rel)
  // push explicit USER_BASE path
  const userBaseCandidate = `${AUTH_URL}${USE_GATEWAY_PREFIX ? API_PREFIX : ''}/user/members/join`
  if (!candidates.includes(userBaseCandidate)) candidates.push(userBaseCandidate)
  // also try AUTH_URL + /user/members/join without prefix
  const altAuth = `${AUTH_URL}/user/members/join`
  if (!candidates.includes(altAuth)) candidates.push(altAuth)

  let raw: Response | null = null
  const attemptLogs: Array<{ url: string; ok?: boolean; status?: number; error?: any }> = []
  let lastErr: any = null
  let usedUrl: string | null = null
  for (const candidate of candidates) {
    try {
      // Log request details before sending (method, headers, body)
      try {
        const bodyPreview = typeof init.body === 'string' ? init.body : JSON.stringify(init.body)
        console.log('[userApi.addMember] attempting fetch', { candidate, method: init.method, headers: init.headers, body: bodyPreview })
      } catch (e) {
        console.log('[userApi.addMember] attempting fetch', candidate)
      }

      raw = await fetch(candidate, init)
      usedUrl = candidate
      attemptLogs.push({ url: candidate, ok: raw.ok, status: raw.status })
      // break on any response (we'll handle status below)
      break
    } catch (fetchErr) {
      const ferr: any = fetchErr
      console.warn('[userApi.addMember] fetch attempt failed', { candidate, message: ferr?.message ?? String(ferr) })
      attemptLogs.push({ url: candidate, error: ferr })
      lastErr = ferr
      // try next candidate
    }
  }

  if (!raw) {
    console.error('[userApi.addMember] all fetch attempts failed', attemptLogs)
    // Diagnostic: try one more time without credentials (omit cookies) to see if CORS/credentials cause failure
    try {
      const initNoCred = { ...init, credentials: 'omit' as RequestCredentials }
      console.log('[userApi.addMember] diagnostic retry without credentials to', rel)
      const diagRes = await fetch(rel, initNoCred)
      console.log('[userApi.addMember] diagnostic response', { ok: diagRes.ok, status: diagRes.status })
      // if diagnostic returned something, set raw so we can handle it below
      raw = diagRes
      usedUrl = rel
      attemptLogs.push({ url: rel + ' (no-credentials)', ok: diagRes.ok, status: diagRes.status })
    } catch (diagErr) {
      console.warn('[userApi.addMember] diagnostic retry without credentials failed', diagErr)
      attemptLogs.push({ url: rel + ' (no-credentials)', error: diagErr })
    }
    const err: any = new Error('Network or CORS error (all attempts failed)')
    err.status = 0
    err.attempts = attemptLogs
    err.original = lastErr
    if (!raw) throw err
  }

  // If backend responds with 405 Method Not Allowed, try POST as a fallback (some deployments proxy/expect POST)
  if (raw.status === 405) {
    try {
      console.warn('[userApi.addMember] received 405, retrying with POST')
      const initPost = { ...init, method: 'POST' as RequestInit['method'] }
      try {
        // retry against the same URL that returned 405 (usedUrl) or fall back to original url
        const retryTarget = usedUrl || url
        console.log('[userApi.addMember] retrying POST to', retryTarget, { method: initPost.method, headers: initPost.headers })
        raw = await fetch(retryTarget, initPost)
      } catch (fetchErr) {
        console.error('[userApi.addMember] retry fetch failed', fetchErr)
        const ferr: any = fetchErr
        const err: any = new Error(ferr?.message || 'Network or CORS error on retry')
        err.status = 0
        err.original = ferr
        throw err
      }
    } catch (e) {
      console.warn('[userApi.addMember] retry with POST failed', e)
    }
  }

  // debug logging to help diagnose why server responds unexpectedly
  try {
    const locationHeader = raw.headers.get('location')
    // Use the actual URL we sent the request to (usedUrl) for clearer debug
    const debugUrl = usedUrl || url
    console.log('[userApi.addMember] request', { url: debugUrl, method: init.method, headers: init.headers, body: init.body })
    console.log('[userApi.addMember] response status', raw.status, 'location:', locationHeader)
    // try to read response text safely for logging
    const clone = raw.clone()
    const text = await clone.text().catch(() => '')
    if (text) console.debug('[userApi.addMember] response body:', text)
  } catch (logErr) {
    // ignore logging errors
    console.warn('[userApi.addMember] logging failed', logErr)
  }

  // Jeśli serwer zwróciło redirect (3xx), prawdopodobnie kieruje do /auth/login
  if (raw.status >= 300 && raw.status < 400) {
    const location = raw.headers.get('location') || ''
    const err: any = new Error(location.includes('/auth') || location.includes('/login') ? 'Wymagane zalogowanie' : `Unexpected redirect (${raw.status})`)
    err.status = raw.status
    err.location = location
    throw err
  }

  if (!raw.ok) {
    const text = await raw.text().catch(() => '')
    // log the body text for debugging
    console.error('[userApi.addMember] non-ok response', { status: raw.status, body: text })
    const message = text || raw.statusText
    const err: any = new Error(message)
    err.status = raw.status
    err.responseText = text
    throw err
  }

  // Parsuj odpowiedź (JSON) - jeśli brak body zwróć null
  const contentType = raw.headers.get('content-type') || ''
  const hasJson = contentType.includes('application/json')
  const res = (raw.status === 204 || !hasJson) ? null : await raw.json()

  // jeśli backend zwróciło boolean true i to oznacza, że zostało dodane/poprawnie wysłane
  if (res === true) writeMemberStatus('member')
  else if (res === false) writeMemberStatus('pending')
  // Po zostaniu memberem — odśwież token (może dodać role/claimy)
  if (res === true) {
    try {
      await refreshAuth().catch(() => {})
    } catch (e) {
      console.warn('Token refresh failed after addMember', e)
    }
  }
  return res
}

export async function searchMembers(query: string, page = 0, size = 10, opts?: { allowUnauth?: boolean }) {
  if (OFFLINE) return Promise.resolve({ items: [{ id: 11, firstName: 'Jan', lastName: 'Kowalski', age: 36 }], total: 1 })
  const qs = new URLSearchParams({ query, page: String(page), size: String(size) })
  const data = await fetchJson(`${USER_BASE}/members/search?${qs.toString()}`, { dontRedirectOnAuthError: opts?.allowUnauth })
  return { items: data?.content ?? data?.items ?? [], total: data?.totalElements ?? data?.total ?? data?.content?.length }
}

export async function getMemberProfile(id: number, opts?: { allowUnauth?: boolean; skipAuthHeader?: boolean }) {

  const relUrl = `${API_PREFIX}/user/members?id=${id}`
  const fullUrl = `${USER_BASE}/members?id=${id}`

  // Prefer relative path without auth header to allow public access and avoid CORS in dev
  try {
    const data = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth, skipAuthHeader: !!opts?.skipAuthHeader })
    return data
  } catch (e) {
    console.warn('[userApi.getMemberProfile] relative fetch (no auth) failed, trying relative with auth', { relUrl, err: e })
  }

  try {
    const dataAuth = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
    return dataAuth
  } catch (e) {
    console.warn('[userApi.getMemberProfile] relative fetch with auth failed, trying full URL', { fullUrl, err: e })
  }

  try {
    const data2 = await fetchJson(fullUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
    return data2
  } catch (e2) {
    console.error('[userApi.getMemberProfile] all attempts failed', { fullUrl, err: e2 })
    if (opts?.allowUnauth) {
      console.warn('[userApi.getMemberProfile] returning mock because allowUnauth is true and backend fetch failed')
      return { id, firstName: 'Jan', lastName: 'Kowalski', age: 36 }
    }
    throw e2
  }
}

// Aktywacja konta - do testów UI
export async function activateAccount(code: string, email: string): Promise<{ success: boolean }> {
  if (OFFLINE) {
    // wymóg: dokładnie 8 znaków alfanumerycznych
    const ok = /^[A-Za-z0-9]{6,10}$/.test(code)
    if (!ok) throw new Error('Nieprawidłowy kod aktywacyjny (8 znaków alfanumerycznych)')
    return Promise.resolve({ success: true })
  }
  return fetchJson(`${AUTH_BASE}/activate`, { method: 'POST', body: JSON.stringify({ code, email }), skipAuthHeader: true })
}

export async function resendActivation(email: string): Promise<{ sent: boolean }> {
  if (OFFLINE) {
    await new Promise((r) => setTimeout(r, 500))
    return Promise.resolve({ sent: true })
  }

  const res = await fetchJson(`${AUTH_BASE}/activate/resend`, {
    method: 'POST',
    skipAuthHeader: true,
      body: JSON.stringify({ email }),
  })
  return { sent: !!(res?.sent ?? res?.success ?? res?.status ?? true) }
}

export async function addMemberManually(teamId: number, payload: { memberId: number; initialRoles?: string[] }) {
  if (OFFLINE) {
    if (!teamId || !payload?.memberId) throw new Error('Wymagane ID zespołu i członka')
    return Promise.resolve({ ok: true })
  }
  return fetchJson(`${USER_BASE}/team-management/${teamId}/add-member`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function approveTeamMember(teamMemberId: number) {
  if (OFFLINE) return Promise.resolve({ ok: true })
  return fetchJson(`${USER_BASE}/team-management/${teamMemberId}/approve`, { method: 'POST' })
}

export async function removeTeamMember(teamMemberId: number) {
  if (OFFLINE) return Promise.resolve({ ok: true })
  // Backend maps DELETE to /user/team-management/{teamMemberId}/del
  const relUrl = `${API_PREFIX}/user/team-management/${teamMemberId}/del`
  const fullUrl = `${USER_BASE}/team-management/${teamMemberId}/del`
  try {
    // try relative first to benefit from Vite proxy
    return await fetchJson(relUrl, { method: 'DELETE' })
  } catch (e) {
    // fallback to full URL
    return fetchJson(fullUrl, { method: 'DELETE' })
  }
}

// Usuwa zespół (DELETE /user/teams/del/{teamId})
export async function removeTeam(teamId: number): Promise<boolean> {
    if (OFFLINE) {
        const idx = mockTeams.findIndex(t => t.teamId === teamId)
        if (idx !== -1) {
            mockTeams.splice(idx, 1)
            // Opcjonalnie: usuń też szczegóły z mockTeamDetails jeśli to ten sam zespół
            if (mockTeamDetails.id === teamId) {
                // w mocku resetujemy lub zostawiamy - zależy od strategii, tutaj proste usunięcie z listy
            }
        }
        return Promise.resolve(true)
    }
        const fullUrl = `${USER_BASE}/teams/del/${teamId}`
        await fetchJson(fullUrl, { method: 'DELETE' })
        return true
}

// Pobierz listę członków zespołu (może przyjmować opcjonalny parametr status: ACTIVE | WAITING | ...)
export async function getTeamMembers(status?: string, page?: number, size?: number, opts?: { allowUnauth?: boolean; skipAuthHeader?: boolean }): Promise<{ items: any[]; total?: number }> {
   if (OFFLINE && ENABLE_MOCKS) {
     // jeśli mockTeamDetails ma members, zwróć je, inaczej zwróć wygenerowany mock
     const items = (mockTeamDetails && mockTeamDetails.members) ? mockTeamDetails.members : [{ teamMemberId: 1, memberId: 11, firstName: 'Jan', lastName: 'Kowalski', roles: ['PLAYER'], status: 'ACTIVE' }]
     const filtered = typeof status === 'string' && status !== '' ? items.filter((it: any) => ((it.status || '').toString().toUpperCase() === status.toString().toUpperCase())) : items
     return Promise.resolve({ items: filtered, total: filtered.length })
   }

   const qs = new URLSearchParams()
   if (status !== undefined && status !== null && String(status).trim() !== '') qs.set('status', String(status))
   if (page !== undefined && page !== null) qs.set('page', String(page))
   if (size !== undefined && size !== null) qs.set('size', String(size))

   const relUrl = `${API_PREFIX}/user/team-management/get${qs.toString() ? '?' + qs.toString() : ''}`
   const fullUrl = `${USER_BASE}/team-management/get${qs.toString() ? '?' + qs.toString() : ''}`

   try {
    const data = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth, skipAuthHeader: !!opts?.skipAuthHeader })
    // Normalizuj możliwe kształty odpowiedzi: content, items, members, teamMembers, lub bezpośrednia tablica
    const itemsArray = data?.content ?? data?.items ?? data?.members ?? data?.teamMembers ?? (Array.isArray(data) ? data : [])
    const total = data?.totalElements ?? data?.total ?? (Array.isArray(itemsArray) ? itemsArray.length : undefined)
    return { items: itemsArray ?? [], total }
   } catch (e) {
     console.warn('[userApi.getTeamMembers] relative fetch failed, trying full URL', { relUrl, err: e })
     if (opts?.allowUnauth) {
       // fallback do mock when allowUnauth
       const items = (mockTeamDetails && mockTeamDetails.members) ? mockTeamDetails.members : []
       const filtered = typeof status === 'string' && status !== '' ? items.filter((it: any) => ((it.status || '').toString().toUpperCase() === status.toString().toUpperCase())) : items
       return { items: filtered, total: filtered.length }
     }
    const data2 = await fetchJson(fullUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
    const itemsArray2 = data2?.content ?? data2?.items ?? data2?.members ?? data2?.teamMembers ?? (Array.isArray(data2) ? data2 : [])
    const total2 = data2?.totalElements ?? data2?.total ?? (Array.isArray(itemsArray2) ? itemsArray2.length : undefined)
    return { items: itemsArray2 ?? [], total: total2 }
   }
 }

// Pobierz pojedynczego team membera
export async function getTeamMember(teamMemberId: number) {
  if (OFFLINE && ENABLE_MOCKS) {
    const found = (mockTeamDetails && mockTeamDetails.members) ? mockTeamDetails.members.find((m: any) => (m.teamMemberId === teamMemberId || m.memberId === teamMemberId)) : null
    return Promise.resolve(found)
  }
  const relUrl = `${API_PREFIX}/user/team-management/get/${teamMemberId}`
  const fullUrl = `${USER_BASE}/team-management/get/${teamMemberId}`
  try {
    return await fetchJson(relUrl)
  } catch (e) {
    return fetchJson(fullUrl)
  }
}

// Auth flows (identify service)
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  if (OFFLINE) return Promise.resolve({ success: true, message: 'Zarejestrowano lokalnie (mock)' })
  return fetchJson(`${AUTH_BASE}/register`, { method: 'POST', body: JSON.stringify(payload), skipAuthHeader: true }) as Promise<RegisterResponse>
}

export async function login(payload: { email: string; password: string }) {
  if (OFFLINE) return Promise.resolve({ success: true, token: 'dev-token', message: 'Zalogowano (mock)' })
  const res = await fetchJson(`${AUTH_BASE}/login`, { method: 'POST', body: JSON.stringify(payload) })
  if (res?.token) setToken(res.token)
  if (res?.userId) setUserId(res.userId)
  return res
}

export async function refreshToken(payload: { refreshToken: string }) {
  if (OFFLINE) return Promise.resolve({ token: 'dev-token' })
  const res = await fetchJson(`${AUTH_BASE}/refresh`, { method: 'POST', body: JSON.stringify(payload) })
  if (res?.token) setToken(res.token)
  return res
}

export async function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<PasswordResetResponse> {
  if (OFFLINE) return Promise.resolve({ status: true, message: 'Reset wysłany (mock)' })
  return fetchJson(`${PASSWORD_BASE}/reset-request`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<PasswordResetResponse>
}

export async function setNewPassword(payload: NewPasswordPayload): Promise<NewPasswordResponse> {
  if (OFFLINE) return Promise.resolve({ status: true, message: 'Hasło zmienione (mock)' })
  return fetchJson(`${PASSWORD_BASE}/new-password`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<NewPasswordResponse>
}

// Zapobiegaj ostrzeżeniom TS o nieużywanych eksportach (dev/build), bez efektu ubocznego w runtime
;(function _keepUserApiExportsAlive() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _refs = [applyForMembership, getMemberProfile, login, refreshToken]
  void _refs
})()

export type UserRoleDTO = {
    role: string          // Było 'name', teraz jest 'role' zgodnie z JSON
    description?: string | null
}

export type UserAccount = {
    userId: number
    userName: string
    userEmail: string
    createdAt?: string    // Data utworzenia w formacie ISO
    updatedAt?: string | null
    userRole?: UserRoleDTO[]
}

export type UpdateUserAccountPayload = {
    username: string; // Java: Request body ma pole "username"
    email: string;    // Java: Request body ma pole "email"
}

// --- Metody API ---

/**
 * Pobiera dane konta (tożsamości) z endpointu /auth/me
 */
export async function getMyAccount(opts?: { allowUnauth?: boolean }): Promise<UserAccount> {
    // Używamy AUTH_BASE zdefiniowanego w userApi.ts, który wskazuje na .../auth
    return fetchJson(`${AUTH_BASE}/me`, { dontRedirectOnAuthError: opts?.allowUnauth });
}

/**
 * Aktualizuje dane konta (username, email) przez endpoint POST /auth/me
 */
export async function updateMyAccount(payload: UpdateUserAccountPayload): Promise<boolean> {
    if (OFFLINE) {
        console.log('[Mock] Updating account:', payload);
        return Promise.resolve(true);
    }
    // Backend zwraca ResponseEntity<Boolean> -> true/false
    const res = await fetchJson(`${AUTH_BASE}/me`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return !!res;
}
