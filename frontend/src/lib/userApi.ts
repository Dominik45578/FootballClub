import { authHeader } from './auth'
// Centralny klient API z trybem OFFLINE (mocki)
const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'
const GATEWAY = import.meta.env.VITE_GATEWAY_URL || ''

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
async function fetchJson(url: string, opts: RequestInit = {}) {
  const headers = { ...(opts.headers || {}), ...authHeader(), 'Content-Type': 'application/json' }
  const res = await fetch(url, { ...opts, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}

export async function getMyProfile(): Promise<MemberProfile> {
  if (OFFLINE) return Promise.resolve(mockMyProfile)
  return fetchJson(`${GATEWAY}/user/members/me`, { headers: { 'Content-Type': 'application/json' } })
}

export async function updateMyProfile(payload: { height?: number; weight?: number; phoneNumber?: string }): Promise<MemberProfile> {
  if (OFFLINE) {
    // apply to mock
    Object.assign(mockMyProfile, payload)
    return Promise.resolve(mockMyProfile)
  }
  return fetchJson(`${GATEWAY}/user/members/me`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function getTeams(params?: { mode?: string; teamId?: number; name?: string; page?: number; size?: number }): Promise<{ items: TeamSummary[]; total?: number }>{
  if (OFFLINE) return Promise.resolve({ items: mockTeams, total: mockTeams.length })
  const qs = new URLSearchParams()
  if (params?.mode) qs.set('mode', params.mode)
  if (params?.teamId) qs.set('teamId', String(params.teamId))
  if (params?.name) qs.set('name', params.name)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.size) qs.set('size', String(params.size))
  return fetchJson(`${GATEWAY}/user/teams?${qs.toString()}`)
}

export async function getTeamDetails(teamId: number): Promise<TeamDetails> {
  if (OFFLINE) return Promise.resolve(teamId === mockTeamDetails.id ? mockTeamDetails : { ...mockTeamDetails, id: teamId, name: `Drużyna ${teamId}` })
  return fetchJson(`${GATEWAY}/user/teams/${teamId}`)
}

export async function joinTeam(teamCode: string): Promise<void> {
  if (OFFLINE) {
    if (!teamCode || teamCode.length < 10) throw new Error('Kod zespołu musi mieć od 10 do 16 znaków (mock)')
    return Promise.resolve()
  }
  const res = await fetch(`${GATEWAY}/user/team-management/join`, { method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ teamCode }) })
  if (!res.ok) throw new Error('Join failed')
}

export async function searchMembers(query: string, page = 0, size = 10) {
  if (OFFLINE) return Promise.resolve({ items: [{ id: 11, firstName: 'Jan', lastName: 'Kowalski', age: 36 }], total: 1 })
  const qs = new URLSearchParams({ query, page: String(page), size: String(size) })
  return fetchJson(`${GATEWAY}/user/members/search?${qs.toString()}`)
}

export async function getMemberProfile(id: number) {
  if (OFFLINE) return Promise.resolve({ id, firstName: 'Jan', lastName: 'Kowalski', age: 36 })
  return fetchJson(`${GATEWAY}/user/members?id=${id}`)
}

// Aktywacja konta - do testów UI
export async function activateAccount(code: string): Promise<{ success: boolean }> {
  if (OFFLINE) {
    // wymóg: dokładnie 8 znaków alfanumerycznych
    const ok = typeof code === 'string' && /^[A-Za-z0-9]{8}$/.test(code)
    if (!ok) throw new Error('Nieprawidłowy kod aktywacyjny (8 znaków alfanumerycznych)')
    return Promise.resolve({ success: true })
  }
  return fetchJson(`${GATEWAY}/api/auth/activate`, { method: 'POST', body: JSON.stringify({ code }) })
}

// Wyślij ponownie kod aktywacyjny na email (mock) — w produkcji backend wyśle mail
export async function resendActivation(email?: string): Promise<{ sent: boolean }> {
  if (OFFLINE) {
    // symuluj opóźnienie i sukces
    await new Promise((r) => setTimeout(r, 500))
    return Promise.resolve({ sent: true })
  }
  // w trybie online wysyłamy żądanie do endpointu resend (przykładowo)
  return fetchJson(`${GATEWAY}/api/auth/resend-activation`, { method: 'POST', body: JSON.stringify({ email }) })
}
