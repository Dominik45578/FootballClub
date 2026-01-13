import { authHeader, logout, OFFLINE } from './auth'
import { setToken, setUserId } from './auth'
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

// Helper for fetch wrapper
type ApiRequestOptions = RequestInit & { dontRedirectOnAuthError?: boolean; skipAuthHeader?: boolean }

async function fetchJson(url: string, opts: ApiRequestOptions = {}) {
  const { dontRedirectOnAuthError, skipAuthHeader, ...rest } = opts
  const auth = skipAuthHeader ? {} : authHeader()
  const headers = { ...(rest.headers || {}), ...auth, 'Content-Type': 'application/json' }
  const res = await fetch(url, { ...rest, headers, credentials: 'include' })
  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && !dontRedirectOnAuthError) {
      logout()
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    const text = await res.text().catch(() => '')
    const message = text || res.statusText
    const err: any = new Error(message)
    err.status = res.status
    throw err
  }
  return res.status === 204 ? null : res.json()
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

export async function applyForMembership(payload: { firstName?: string; lastName?: string; phone?: string; position?: string; note?: string }) {
  if (OFFLINE) {
    writeMemberStatus('pending')
    return Promise.resolve({ status: 'pending', submitted: payload })
  }
  const res = await fetchJson(`${USER_BASE}/members/apply`, { method: 'POST', body: JSON.stringify(payload) })
  writeMemberStatus('pending')
  return res ?? { status: 'pending' }
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

export async function getTeams(params?: { mode?: string; teamId?: number; name?: string; page?: number; size?: number }, opts?: { allowUnauth?: boolean }): Promise<{ items: TeamSummary[]; total?: number }>{
  if (OFFLINE) return Promise.resolve({ items: mockTeams, total: mockTeams.length })
  const qs = new URLSearchParams()
  if (params?.mode) qs.set('mode', params.mode)
  if (params?.teamId) qs.set('teamId', String(params.teamId))
  if (params?.name) qs.set('name', params.name)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.size) qs.set('size', String(params.size))
  const data = await fetchJson(`${USER_BASE}/teams?${qs.toString()}`, { dontRedirectOnAuthError: opts?.allowUnauth })
  return { items: data?.content ?? data?.items ?? [], total: data?.totalElements ?? data?.total ?? data?.content?.length }
}

export async function getTeamDetails(teamId: number): Promise<TeamDetails> {
  if (OFFLINE) return Promise.resolve(teamId === mockTeamDetails.id ? mockTeamDetails : { ...mockTeamDetails, id: teamId, name: `Drużyna ${teamId}` })
  return fetchJson(`${USER_BASE}/teams/${teamId}`)
}

export async function joinTeam(teamCode: string, opts?: { allowUnauth?: boolean }): Promise<void> {
  if (OFFLINE) {
    if (!teamCode || teamCode.length < 10) throw new Error('Kod zespołu musi mieć od 10 do 16 znaków (mock)')
    return Promise.resolve()
  }
  await fetchJson(`${USER_BASE}/team-management/join`, { method: 'POST', body: JSON.stringify({ teamCode }), dontRedirectOnAuthError: opts?.allowUnauth })
}

export async function searchMembers(query: string, page = 0, size = 10, opts?: { allowUnauth?: boolean }) {
  if (OFFLINE) return Promise.resolve({ items: [{ id: 11, firstName: 'Jan', lastName: 'Kowalski', age: 36 }], total: 1 })
  const qs = new URLSearchParams({ query, page: String(page), size: String(size) })
  const data = await fetchJson(`${USER_BASE}/members/search?${qs.toString()}`, { dontRedirectOnAuthError: opts?.allowUnauth })
  return { items: data?.content ?? data?.items ?? [], total: data?.totalElements ?? data?.total ?? data?.content?.length }
}

export async function getMemberProfile(id: number) {
  if (OFFLINE) return Promise.resolve({ id, firstName: 'Jan', lastName: 'Kowalski', age: 36 })
  return fetchJson(`${USER_BASE}/members?id=${id}`)
}

// Aktywacja konta - do testów UI
export async function activateAccount(code: string, email?: string): Promise<{ success: boolean }> {
  if (OFFLINE) {
    // wymóg: dokładnie 8 znaków alfanumerycznych
    const ok = /^[A-Za-z0-9]{6,10}$/.test(code)
    if (!ok) throw new Error('Nieprawidłowy kod aktywacyjny (8 znaków alfanumerycznych)')
    return Promise.resolve({ success: true })
  }
  return fetchJson(`${AUTH_BASE}/activate`, { method: 'POST', body: JSON.stringify({ code, email }), skipAuthHeader: true })
}

export async function resendActivation(email?: string): Promise<{ sent: boolean }> {
  if (OFFLINE) {
    await new Promise((r) => setTimeout(r, 500))
    return Promise.resolve({ sent: true })
  }

  const qs = email ? `?email=${encodeURIComponent(email)}` : ''
  const res = await fetchJson(`${AUTH_BASE}/activate/resend${qs}`, {
    method: 'GET',
    skipAuthHeader: true,
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
  return fetchJson(`${USER_BASE}/team-management/${teamMemberId}`, { method: 'DELETE' })
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
