import { authHeader, OFFLINE } from './auth'

const GATEWAY = (import.meta.env.VITE_GATEWAY_URL || '').replace(/\/$/, '')
const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? '/api').replace(/\/$/, '')
// Backend exposes controller at @RequestMapping("/match")
const BASE = `${GATEWAY}${API_PREFIX}/match`.replace(/\/\/$/, '')
const EXTERNAL_TEAMS_BASE = `${GATEWAY}${API_PREFIX}/external/teams`.replace(/\/\/$/, '')

// Typy zwracane przez backend (zgodne z match-service)
export type MatchMember = {
  teamMemberId: number
  memberId: number
  firstName: string
  lastName: string
  status?: string
  roles?: string[]
  fieldPosition?: string
    number?: number
}

export type MatchTeamData = {
  id: number
  name: string
  isInternal: boolean
  logoUrl?: string | null
  squad?: MatchMember[]
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED'

export type MatchResponse = {
  matchId: number
  matchDate: string // ISO
  homeTeamScore: number
  awayTeamScore: number
  status: MatchStatus
  homeTeam: MatchTeamData
  awayTeam: MatchTeamData
}

export type Page<T> = {
  content: T[]
  totalElements?: number
  totalPages?: number
  number?: number
  size?: number
}

export type CreateMatchRequest = {
  internalTeamId: number
  externalTeamId: number
  matchDate: string // ISO
  isHome?: boolean
}

export type UpdateMatchRequest = {
  matchDate?: string
  isHome?: boolean
  status?: MatchStatus
}

// proste fetch helpery (używamy authHeader z ./auth — gateway powinien ustawić X-User-Id)
async function fetchJson<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const method = (opts.method || 'GET').toString().toUpperCase()
  const hasBody = !!opts.body || (method !== 'GET' && method !== 'HEAD')
  const headers: Record<string, string> = { ...(opts.headers as any || {}), ...authHeader() }
  if (hasBody) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, { ...opts, headers, credentials: 'include' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err: any = new Error(text || res.statusText)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null as any
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null as any
  return res.json()
}

// Mocky (tylko gdy OFFLINE=true)
const MOCK_MATCH: MatchResponse = {
    awayTeamScore:1,
    homeTeamScore:2,
  matchId: 101,
  matchDate: new Date().toISOString(),
  status: 'SCHEDULED',
  homeTeam: { id: 1, name: 'Nasza drużyna', isInternal: true, logoUrl: null, squad: [] },
  awayTeam: { id: 200, name: 'FC Placeholder', isInternal: false, logoUrl: null },
}

// --- API funkcje ---
export async function getMyMatches(page = 0, size = 20): Promise<Page<MatchResponse>> {
  if (OFFLINE) return Promise.resolve({ content: [MOCK_MATCH], totalElements: 1, totalPages: 1, number: 0, size })
  // backend: GET /match/my-matches
  const url = `${BASE}/my-matches?page=${page}&size=${size}`
  try {
    return await fetchJson<Page<MatchResponse>>(url, { method: 'GET' })
  } catch (e: any) {
    // Jeśli serwer nie ma jeszcze endpointu, fallback do mocków by UX nie padał w dewelopmencie
    if (e && (e.status === 404 || String(e).includes('404'))) {
      console.warn('[matchesApi] GET /my-matches returned 404 — falling back to mock data')
      return { content: [MOCK_MATCH], totalElements: 1, totalPages: 1, number: 0, size }
    }
    throw e
  }
}

export async function getMatchById(matchId: number): Promise<MatchResponse> {
  if (OFFLINE) return Promise.resolve({ ...MOCK_MATCH, matchId })
  const url = `${BASE}/${matchId}`
  return fetchJson<MatchResponse>(url, { method: 'GET' })
}

export async function getMatchesByTeamId(teamId: number, page = 0, size = 20): Promise<Page<MatchResponse>> {
  if (OFFLINE) return Promise.resolve({ content: [MOCK_MATCH], totalElements: 1, totalPages: 1, number: 0, size })
  // backend: GET /match/team/{teamId}
  const url = `${BASE}/team/${teamId}?page=${page}&size=${size}`
  return fetchJson<Page<MatchResponse>>(url, { method: 'GET' })
}

export async function createMatch(payload: CreateMatchRequest): Promise<MatchResponse> {
  if (OFFLINE) return Promise.resolve({ ...MOCK_MATCH, matchId: Math.floor(Math.random() * 10000) })
  const url = `${BASE}`
  return fetchJson<MatchResponse>(url, { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateMatch(matchId: number, payload: UpdateMatchRequest): Promise<MatchResponse> {
  if (OFFLINE) return Promise.resolve({ ...MOCK_MATCH, matchId })
  const url = `${BASE}/${matchId}`
  return fetchJson<MatchResponse>(url, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteMatch(matchId: number): Promise<void> {
  if (OFFLINE) return Promise.resolve()
  const url = `${BASE}/${matchId}`
  await fetchJson<void>(url, { method: 'DELETE' })
}

// Proxy do external teams (gateway -> football-external-data-service)
export async function getExternalTeams(): Promise<Array<{ id: number; name: string; code?: string; country?: string; logoUrl?: string | null }>> {
  if (OFFLINE) return Promise.resolve([{ id: 200, name: 'FC Placeholder', code: 'FCPL', country: 'PL', logoUrl: null }])
  return fetchJson(EXTERNAL_TEAMS_BASE, { method: 'GET' })
}

// --- helpery UI / role-based ---
import { hasRole } from './auth'

export function canManageMatches(): boolean {
  // Zgodnie z backendem: role COACH i ADMIN mają uprawnienia do zarządzania meczami
  return hasRole('ADMIN') || hasRole('COACH')
}

export function statusToLabel(status: MatchStatus): string {
  switch (status) {
    case 'SCHEDULED': return 'Zaplanowany'
    case 'LIVE': return 'W trakcie'
    case 'FINISHED': return 'Zakończony'
    case 'CANCELLED': return 'Odwołany'
    case 'POSTPONED': return 'Przełożony'
    default: return String(status)
  }
}

export function isTeamEditable(team: MatchTeamData): boolean {
  // drużyna wewnętrzna jest edytowalna w UI
  return Boolean(team?.isInternal)
}

// Przydatne helpery dla formularzy: zwróć listę drużyn dostępnych dla użytkownika
export async function getMyTeamsForSelect(): Promise<Array<{ value: number; label: string }>> {
  // Pobieramy najpierw zespoły powiązane z użytkownikiem przez endpoint match/my-matches
  try {
    const page = await getMyMatches(0, 50)
    const unique: Record<number, string> = {}
    page.content.forEach(m => {
      if (m.homeTeam?.isInternal) unique[m.homeTeam.id] = m.homeTeam.name
      if (m.awayTeam?.isInternal) unique[m.awayTeam.id] = m.awayTeam.name
    })
    // Gdy brak, fallback do pustej listy
    return Object.keys(unique).map(k => ({ value: Number(k), label: unique[Number(k)] }))
  } catch (e) {
    return []
  }
}
