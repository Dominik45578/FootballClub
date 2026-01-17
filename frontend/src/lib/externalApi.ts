import { authHeader } from './auth'

// Konfiguracja URL na wzór matchesApi.ts / userApi.ts
const GATEWAY = (import.meta.env.VITE_GATEWAY_URL || '').replace(/\/$/, '')
const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? '/api').replace(/\/$/, '')
const BASE_URL = `${GATEWAY}${API_PREFIX}/external`.replace(/\/\/$/, '')

// --- Typy DTO ---

export type TeamSummary = {
    id: number
    name: string
    code: string
    country: string
    founded: number
    national: boolean
    logo: string
}

export type Venue = {
    id: number
    name: string
    address: string
    city: string
    capacity: number
    surface: string
    logoUrl: string
}

export type Player = {
    id: number
    name: string
    age: number
    number: number
    position: string
    photoUrl: string
}

export type TeamDetails = {
    teamInfo: {
        id: number
        name: string
        code: string
        country: string
        founded: number
        national: boolean
        logoUrl: string
    }
    venue: Venue
    squad: Player[]
}

export type Page<T> = {
    content: T[]
    totalPages: number
    totalElements: number
    size: number
    number: number
}

// --- Helper do fetchowania (prostsza wersja, spójna z resztą apki) ---

async function fetchJson<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
    // Pobieramy nagłówki autoryzacyjne z lib/auth.ts (Bearer token)
    const headers: Record<string, string> = {
        ...(opts.headers as any || {}),
        ...authHeader()
    }

    // Domyślnie Content-Type dla metod innych niż GET, jeśli mamy body
    if (opts.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, { ...opts, headers, credentials: 'include' })

    if (!res.ok) {
        const text = await res.text().catch(() => '')
        const err: any = new Error(text || res.statusText)
        err.status = res.status
        throw err
    }

    // Obsługa 204 No Content
    if (res.status === 204) return null as any

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return null as any

    return res.json()
}

// --- Funkcje API (TeamsController) ---

export async function getTeams(params?: { query?: string; page?: number; size?: number }): Promise<Page<TeamSummary>> {
    const queryParams = new URLSearchParams()
    if (params?.query) queryParams.append('query', params.query)
    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `${BASE_URL}/teams?${queryParams.toString()}`
    return fetchJson<Page<TeamSummary>>(url, { method: 'GET' })
}

export async function getTeamDetails(teamId: number): Promise<TeamDetails> {
    const url = `${BASE_URL}/teams/${teamId}`
    return fetchJson<TeamDetails>(url, { method: 'GET' })
}

// --- Funkcje Zarządzające (ManagingController) ---

// UWAGA: X-User-Id jest ustawiany przez Gateway na podstawie tokena. 
// My wysyłamy tylko token w nagłówku Authorization (via authHeader).

export async function refreshTeamsForCountry(country: string): Promise<void> {
    const queryParams = new URLSearchParams({ country })



    const url = `${BASE_URL}/manage/refresh/teams?${queryParams.toString()}`

    await fetchJson(url, { method: 'POST' })
}

export async function refreshSquad(teamId: number): Promise<void> {
    const queryParams = new URLSearchParams({ teamId: teamId.toString() })
    const url = `${BASE_URL}/manage/squads/refresh?${queryParams.toString()}`

    await fetchJson(url, { method: 'POST' })
}

export async function deleteTeam(teamId: number): Promise<void> {
    const url = `${BASE_URL}/manage/teams/${teamId}`
    await fetchJson(url, { method: 'DELETE' })
}

export async function deletePlayer(playerId: number): Promise<void> {
    const url = `${BASE_URL}/manage/players/${playerId}`
    await fetchJson(url, { method: 'DELETE' })
}