import { authHeader } from './auth'

export type Player = {
    id: number
    name: string
    position: string
    goals: number
}

export async function fetchPlayers(): Promise<Player[]> {
    const headers = { 'Content-Type': 'application/json', ...authHeader() }
    const res = await fetch('/api/players', { headers })
    if (!res.ok) throw new Error('Nie udało się pobrać danych')
    return res.json()
}

