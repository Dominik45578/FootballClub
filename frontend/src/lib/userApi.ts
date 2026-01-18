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

// Debug: wypisz skonfigurowane URL-e
if (typeof window !== 'undefined') {
    try {
        console.info('[userApi] resolved endpoints', { AUTH_URL, API_PREFIX, USER_BASE, AUTH_BASE, LOGOUT_URL })
    } catch (e) { }
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
    joinDate?: string
    phoneNumber?: string
    height?: number
    weight?: number
    age?: number
}

export type TeamSummary = {
    teamId: number
    teamName: string
    category?: string
    status?: string
    numberOfMembers?: number
    description?: string
}

export type TeamDetails = {
    id: number
    name: string
    code?: string
    category?: string
    createdAt?: string
    description?: string
    members?: Array<{ teamMemberId: number; memberId: number; firstName: string; lastName: string; roles?: string[]; status?: string ;sienceDate?: string; number?: number}>
}

// --- NOWE DTO DO EDYCJI CZŁONKA ---
export type ManageTeamMemberRequest = {
    teamMemberId: number
    status: string
    newFieldPosition?: string | null
    newRoles?: string[]
    removedRoles?: string[]
    number?: number | null
}

export const TEAM_ROLES = [
    'ROLE_TEAM_PLAYER',
    'ROLE_TEAM_CAPTAIN',
    'ROLE_TEAM_HEAD_COACH',
    'ROLE_TEAM_ASSISTANT_COACH',
    'ROLE_TEAM_PHYSIO',
    'ROLE_TEAM_MANAGER',
] as const


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

// Helper for fetch wrapper
type ApiRequestOptions = RequestInit & { dontRedirectOnAuthError?: boolean; skipAuthHeader?: boolean }

export async function fetchJson(url: string, opts: ApiRequestOptions = {}) {
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

// Sync member status with backend
export async function ensureMemberStatus(): Promise<MemberStatus> {
    if (OFFLINE) return 'member'
    const current = readMemberStatus()
    if (current === 'member') return 'member'
    try {
        await getMyProfile({ allowUnauth: true })
        writeMemberStatus('member')
        return 'member'
    } catch (err: any) {
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
    const body: any = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        pesel: payload.pesel,
        birthDate: payload.birthDate ?? null,
        phoneNumber: payload.phone,
        height: payload.height,
        weight: payload.weight,
    }
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
    return fetchJson(`${USER_BASE}/members/me`, { dontRedirectOnAuthError: opts?.allowUnauth })
}

export async function updateMyProfile(payload: { height?: number; weight?: number; phoneNumber?: string }): Promise<MemberProfile> {
    return fetchJson(`${USER_BASE}/members/me`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function getTeams(params?: { mode?: string; teamId?: number; name?: string; page?: number; size?: number }, opts?: { allowUnauth?: boolean; forceReal?: boolean; skipAuthHeader?: boolean }): Promise<{ items: TeamSummary[]; total?: number }>{
    const qs = new URLSearchParams()
    if (params?.mode) qs.set('mode', params.mode)
    if (params?.teamId !== undefined && params.teamId !== null) qs.set('teamId', String(params.teamId))
    if (params?.name) qs.set('name', params.name)
    if (params?.page !== undefined && params.page !== null) qs.set('page', String(params.page))
    if (params?.size !== undefined && params.size !== null) qs.set('size', String(params.size))

    const relUrl = `${API_PREFIX}/user/teams?${qs.toString()}`
    const fullApiUrl = `${USER_BASE}/teams?${qs.toString()}`
    try {
        const data = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth, skipAuthHeader: !!opts?.skipAuthHeader })
        return { items: data?.content ?? data?.items ?? [], total: data?.totalElements ?? data?.total ?? data?.content?.length }
    } catch (e) {
        try {
            const data2 = await fetchJson(fullApiUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
            return { items: data2?.content ?? data2?.items ?? [], total: data2?.totalElements ?? data2?.total ?? data2?.content?.length }
        } catch (e2) {
            const err: any = new Error('Failed to fetch teams from backend')
            err.original = e2
            throw err
        }
    }
}

export async function getTeamDetails(teamId: number, opts?: { forceReal?: boolean; allowUnauth?: boolean; skipAuthHeader?: boolean }): Promise<TeamDetails> {
    const callerForceReal = !!opts?.forceReal
    const relUrl = `${API_PREFIX}/user/teams/${teamId}`
    const fullUrl = `${USER_BASE}/teams/${teamId}`

    try {
        const data = await fetchJson(relUrl, { skipAuthHeader: !!opts?.skipAuthHeader, dontRedirectOnAuthError: opts?.allowUnauth })
        if (data) {
            const desc = (data as any).description ?? (data as any).teamDescription ?? (data as any).summary ?? (data as any).desc ?? (data as any).about ?? (data as any).details?.description ?? null
            if (desc) (data as any).description = desc
        }
        return data
    } catch (e) { }

    try {
        const dataAuth = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
        if (dataAuth) {
            const desc = (dataAuth as any).description ?? (dataAuth as any).teamDescription ?? (dataAuth as any).summary ?? (dataAuth as any).desc ?? (dataAuth as any).about ?? (dataAuth as any).details?.description ?? null
            if (desc) (dataAuth as any).description = desc
        }
        return dataAuth
    } catch (e) { }

    try {
        const data2 = await fetchJson(fullUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
        if (data2) {
            const desc = (data2 as any).description ?? (data2 as any).teamDescription ?? (data2 as any).summary ?? (data2 as any).desc ?? (data2 as any).about ?? (data2 as any).details?.description ?? null
            if (desc) (data2 as any).description = desc
        }
        return data2
    } catch (e2) {
        if (callerForceReal || FORCE_REAL_API) throw e2
        if (OFFLINE && ENABLE_MOCKS) {
            return teamId === mockTeamDetails.id ? mockTeamDetails : { ...mockTeamDetails, id: teamId, name: `Drużyna ${teamId}` }
        }
        throw e2
    }
}

// Tworzy nowy zespół (PUT /user/teams/new)
export async function createTeam(payload: { name: string; code?: string; status?: string; category?: string; description?: string }) {
    const normalizedStatus = payload.status === undefined || payload.status === null ? undefined : String(payload.status).toUpperCase()
    const mappedStatus = normalizedStatus === 'INACTIVE' ? 'SUSPENDED' : normalizedStatus
    const body: any = { name: payload.name, category: payload.category, code: payload.code, description: payload.description }
    if (mappedStatus !== undefined) body.status = mappedStatus

    const relUrl = `${API_PREFIX}/user/teams/new`
    const fullUrl = `${USER_BASE}/teams/new`

    try {
        await fetchJson(relUrl, { method: 'PUT', body: JSON.stringify(body) })
        return true
    } catch (e) { }

    try {
        await fetchJson(fullUrl, { method: 'PUT', body: JSON.stringify(body) })
        return true
    } catch (e2) { throw e2 }
}

// Aktualizuje zespół (PATCH /user/teams/update)
export async function updateTeam(payload: UpdateTeamRequestDTO): Promise<boolean> {
    const body: any = {
        id: payload.id
    }

    if (payload.name !== undefined) body.name = payload.name
    if (payload.category !== undefined) body.category = payload.category
    if (payload.description !== undefined) body.description = payload.description
    if (payload.status !== undefined) {
        body.status = (payload.status === 'INACTIVE' ? 'SUSPENDED' : payload.status)
    }

    console.log(body)
    await fetchJson(`${USER_BASE}/teams/update`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    })

    return true
}
export type UpdateTeamRequestDTO = {
    id: number;
    name?: string;
    category?: string;
    description?: string;
    status?: string;
}
// --- NOWA FUNKCJA: Aktualizacja członkostwa (PATCH /user/teams/membership/update) ---
export async function updateTeamMember(payload: ManageTeamMemberRequest): Promise<boolean> {
    const res = await fetchJson(`${USER_BASE}/teams/membership/update`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    })
    return !!res
}

export async function joinTeam(teamCode: string, opts?: { allowUnauth?: boolean }): Promise<void> {
    await fetchJson(`${USER_BASE}/team-management/join`, { method: 'POST', body: JSON.stringify({ teamCode }), dontRedirectOnAuthError: opts?.allowUnauth })
    try { await refreshAuth().catch(() => {}) } catch (e) { }
}

export async function addMember(payload: { firstName: string; lastName: string; pesel: string; birthDate: string | null; phoneNumber?: string; height?: number; weight?: number }) {
    let url = `${USER_BASE}/members/join`
    try {
        if (typeof window !== 'undefined' && AUTH_URL) {
            const authOrigin = new URL(AUTH_URL, window.location.href).origin
            const appOrigin = window.location.origin
            if (authOrigin && authOrigin !== appOrigin && (import.meta.env.VITE_DISABLE_PROXY !== 'true')) {
                url = `${API_PREFIX}/user/members/join`
            }
        }
    } catch (e) {

    }

    const init: RequestInit = {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json',  ...authHeader() },
        credentials: 'include',
        redirect: 'manual' as RequestRedirect,

    }
    console.log(init)

    const candidates: string[] = []
    candidates.push(url)
    const rel = `${API_PREFIX}/user/members/join`
    if (!candidates.includes(rel)) candidates.push(rel)
    const userBaseCandidate = `${AUTH_URL}${USE_GATEWAY_PREFIX ? API_PREFIX : ''}/user/members/join`
    if (!candidates.includes(userBaseCandidate)) candidates.push(userBaseCandidate)

    let raw: Response | null = null
    for (const candidate of candidates) {
        try {
            raw = await fetch(candidate, init)
            break
        } catch (fetchErr) { }
    }

    if (!raw) {
        // Diagnostic
        try {
            const initNoCred = { ...init, credentials: 'omit' as RequestCredentials }
            raw = await fetch(rel, initNoCred)
        } catch (diagErr) {
            console.error(diagErr)
            const err: any = new Error('Network or CORS error')
            err.status = 0
            throw err
        }
    }

    if (raw.status === 405) {
        try {
            const initPost = { ...init, method: 'POST' as RequestInit['method'] }
            raw = await fetch(url, initPost)
        } catch (e) { }
    }

    if (raw.status >= 300 && raw.status < 400) {
        const location = raw.headers.get('location') || ''
        const err: any = new Error(location.includes('/auth') || location.includes('/login') ? 'Wymagane zalogowanie' : `Unexpected redirect (${raw.status})`)
        err.status = raw.status
        throw err
    }

    if (!raw.ok) {
        const text = await raw.text().catch(() => '')
        const err: any = new Error(text || raw.statusText)
        err.status = raw.status
        throw err
    }

    const contentType = raw.headers.get('content-type') || ''
    const hasJson = contentType.includes('application/json')
    const res = (raw.status === 204 || !hasJson) ? null : await raw.json()

    if (res === true) writeMemberStatus('member')
    else if (res === false) writeMemberStatus('pending')
    if (res === true) {
        try { await refreshAuth().catch(() => {}) } catch (e) { }
    }
    return res
}

export async function searchMembers(query: string, page = 0, size = 10, opts?: { allowUnauth?: boolean }) {
    const qs = new URLSearchParams({ query, page: String(page), size: String(size) })
    const data = await fetchJson(`${USER_BASE}/members/search?${qs.toString()}`, { dontRedirectOnAuthError: opts?.allowUnauth })
    return { items: data?.content ?? data?.items ?? [], total: data?.totalElements ?? data?.total ?? data?.content?.length }
}

export async function getMemberProfile(id: number, opts?: { allowUnauth?: boolean; skipAuthHeader?: boolean }) {
    const relUrl = `${API_PREFIX}/user/members?id=${id}`
    const fullUrl = `${USER_BASE}/members?id=${id}`

    try {
        return await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth, skipAuthHeader: !!opts?.skipAuthHeader })
    } catch (e) { }

    try {
        return await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
    } catch (e) { }

    try {
        return await fetchJson(fullUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
    } catch (e2) {
        throw e2
    }
}

export async function activateAccount(code: string, email: string): Promise<{ success: boolean }> {
    return fetchJson(`${AUTH_BASE}/activate`, { method: 'POST', body: JSON.stringify({ code, email }), skipAuthHeader: true })
}

export async function resendActivation(email: string): Promise<{ sent: boolean }> {
    const res = await fetchJson(`${AUTH_BASE}/activate/resend`, { method: 'POST', skipAuthHeader: true, body: JSON.stringify({ email }) })
    return { sent: !!(res?.sent ?? res?.success ?? res?.status ?? true) }
}

export async function addMemberManually(teamId: number, payload: { memberId: number; initialRoles?: string[] }) {
    return fetchJson(`${USER_BASE}/team-management/${teamId}/add-member`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function approveTeamMember(teamMemberId: number) {
    return fetchJson(`${USER_BASE}/team-management/${teamMemberId}/approve`, { method: 'POST' })
}

export async function removeTeamMember(teamMemberId: number) {
    const relUrl = `${API_PREFIX}/user/team-management/${teamMemberId}/del`
    const fullUrl = `${USER_BASE}/team-management/${teamMemberId}/del`
    try {
        return await fetchJson(relUrl, { method: 'DELETE' })
    } catch (e) {
        return fetchJson(fullUrl, { method: 'DELETE' })
    }
}

export async function removeTeam(teamId: number): Promise<boolean> {
    const fullUrl = `${USER_BASE}/teams/del/${teamId}`
    await fetchJson(fullUrl, { method: 'DELETE' })
    return true
}

export async function getTeamMembers(status?: string, page?: number, size?: number, opts?: { allowUnauth?: boolean; skipAuthHeader?: boolean }): Promise<{ items: any[]; total?: number }> {
    const qs = new URLSearchParams()
    if (status) qs.set('status', String(status))
    if (page !== undefined) qs.set('page', String(page))
    if (size !== undefined) qs.set('size', String(size))

    const relUrl = `${API_PREFIX}/user/team-management/get${qs.toString() ? '?' + qs.toString() : ''}`
    const fullUrl = `${USER_BASE}/team-management/get${qs.toString() ? '?' + qs.toString() : ''}`

    try {
        const data = await fetchJson(relUrl, { dontRedirectOnAuthError: opts?.allowUnauth, skipAuthHeader: !!opts?.skipAuthHeader })
        const itemsArray = data?.content ?? data?.items ?? data?.members ?? data?.teamMembers ?? (Array.isArray(data) ? data : [])
        const total = data?.totalElements ?? data?.total ?? (Array.isArray(itemsArray) ? itemsArray.length : undefined)
        return { items: itemsArray ?? [], total }
    } catch (e) {
        if (opts?.allowUnauth) return { items: [], total: 0 }
        const data2 = await fetchJson(fullUrl, { dontRedirectOnAuthError: opts?.allowUnauth })
        const itemsArray2 = data2?.content ?? data2?.items ?? data2?.members ?? data2?.teamMembers ?? (Array.isArray(data2) ? data2 : [])
        const total2 = data2?.totalElements ?? data2?.total ?? (Array.isArray(itemsArray2) ? itemsArray2.length : undefined)
        return { items: itemsArray2 ?? [], total: total2 }
    }
}

export async function getTeamMember(teamMemberId: number) {
    const relUrl = `${API_PREFIX}/user/team-management/get/${teamMemberId}`
    const fullUrl = `${USER_BASE}/team-management/get/${teamMemberId}`
    try {
        return await fetchJson(relUrl)
    } catch (e) {
        return fetchJson(fullUrl)
    }
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
    return fetchJson(`${AUTH_BASE}/register`, { method: 'POST', body: JSON.stringify(payload), skipAuthHeader: true }) as Promise<RegisterResponse>
}

export async function login(payload: { email: string; password: string }) {
    const res = await fetchJson(`${AUTH_BASE}/login`, { method: 'POST', body: JSON.stringify(payload) })
    if (res?.token) setToken(res.token)
    if (res?.userId) setUserId(res.userId)
    return res
}

export async function refreshToken(payload: { refreshToken: string }) {
    const res = await fetchJson(`${AUTH_BASE}/refresh`, { method: 'POST', body: JSON.stringify(payload) })
    if (res?.token) setToken(res.token)
    return res
}

export async function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<PasswordResetResponse> {
    return fetchJson(`${PASSWORD_BASE}/reset-request`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<PasswordResetResponse>
}

export async function setNewPassword(payload: NewPasswordPayload): Promise<NewPasswordResponse> {
    return fetchJson(`${PASSWORD_BASE}/new-password`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<NewPasswordResponse>
}

;(function _keepUserApiExportsAlive() {
    // @ts-ignore
    const _refs = [applyForMembership, getMemberProfile, login, refreshToken]
    void _refs
})()

export type UserRoleDTO = {
    role: string
    description?: string | null
}

export type UserAccount = {
    userId: number
    userName: string
    userEmail: string
    createdAt?: string
    updatedAt?: string | null
    userRole?: UserRoleDTO[]
}

export type UpdateUserAccountPayload = {
    username: string;
    email: string;
}

export async function getMyAccount(opts?: { allowUnauth?: boolean }): Promise<UserAccount> {
    return fetchJson(`${AUTH_BASE}/me`, { dontRedirectOnAuthError: opts?.allowUnauth });
}

export async function updateMyAccount(payload: UpdateUserAccountPayload): Promise<boolean> {
    const res = await fetchJson(`${AUTH_BASE}/me`, { method: 'POST', body: JSON.stringify(payload) });
    return !!res;
}

export type AdminUserResponse = {
    userId: number
    userName: string
    userEmail: string
    createdAt?: string
    updatedAt?: string
    userRole?: Array<{ role: string; description?: string }>
    // Nowe pola zgodne z UserResponseDTO
    enabled: boolean
    accountNonLocked: boolean
}

export type AdminRoleRequest = {
    userId: number
    roles: string[]
}

export async function adminGetUser(userId: number): Promise<AdminUserResponse> {
    return await fetchJson(`${AUTH_BASE}/admin/get/${userId}`, { method: 'GET' })
}

export async function adminBlockUser(userId: number): Promise<boolean> {
    const res = await fetchJson(`${AUTH_BASE}/admin/block?userId=${userId}`, { method: 'PATCH' })
    return !!res
}

export async function adminUnblockUser(userId: number): Promise<boolean> {
    const res = await fetchJson(`${AUTH_BASE}/admin/unblock?userId=${userId}`, { method: 'PATCH' })
    return !!res
}

export async function adminGrantRoles(payload: AdminRoleRequest): Promise<boolean> {
    const res = await fetchJson(`${AUTH_BASE}/admin/role/update`, { method: 'PATCH', body: JSON.stringify(payload) })
    return !!res
}

export async function adminRevokeRoles(payload: AdminRoleRequest): Promise<boolean> {
    const res = await fetchJson(`${AUTH_BASE}/admin/role/del`, { method: 'DELETE', body: JSON.stringify(payload) })
    return !!res
}

export type TeamMemberDTO = {
    teamMemberId: number;
    memberId: number;
    teamId: number;
    firstName: string;
    lastName: string;
    sienceDate: string;
    roles: string[];
    status: string;
    fieldPosition: string;
    number: number;
    teamName?: string;
}

export type MemberProfileDTO = {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    joinDate: string;
    weight: number;
    height: number;
    number: number;
}

export type MembershipResponse = {
    content: TeamMemberDTO[];
    member: MemberProfileDTO;
    totalElements: number;
    totalPages: number;
}




export async function getMemberMemberships(memberId: number): Promise<MembershipResponse> {
    return fetchJson(`${USER_BASE}/teams/membership/${memberId}`);
}

export type MemberSummaryResponse = {
    id: number
    firstName: string
    lastName: string
    age: number      // Backend teraz to wylicza
    joinDate: string // Instant przychodzi jako ISO string
    weight: number
    height: number
}


export async function getMemberProfileById(memberId: number): Promise<MemberSummaryResponse> {
    // URL: /user/members?memberId=123
    return fetchJson(`${USER_BASE}/members/get/${memberId}`)
}
