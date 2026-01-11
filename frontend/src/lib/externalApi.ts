// Mocked external data client; replace with real football-external-data-service endpoints when available
export type Club = {
  id: number
  teamId?: number
  name: string
  teamName?: string
  code?: string
  country?: string
  founded?: number
  national?: boolean
  logoUrl?: string
  venue?: {
    id?: number
    name?: string
    address?: string
    city?: string
    capacity?: number
    surface?: string
    logoUrl?: string
  }
}

export type Player = {
  id: number
  name: string
  age?: number
  number?: number
  position?: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker'
  photo?: string
}

const mockClubs: Club[] = [
  { id: 1, name: 'FC Mock', code: 'FCM', country: 'Poland', founded: 1920, national: false, logoUrl: '', venue: { name: 'Stadion Mock', city: 'Warszawa', capacity: 15000, surface: 'grass' } },
  { id: 2, name: 'Real Placeholder', code: 'RPH', country: 'Spain', founded: 1902, national: false, logoUrl: '', venue: { name: 'Mock Bernabeu', city: 'Madryt', capacity: 80000, surface: 'grass' } },
]

const mockSquads: Record<number, Player[]> = {
  1: [
    { id: 10, name: 'Jan Bramkarz', age: 28, number: 1, position: 'Goalkeeper' },
    { id: 11, name: 'Adam Obrońca', age: 25, number: 4, position: 'Defender' },
    { id: 12, name: 'Paweł Pomocnik', age: 27, number: 8, position: 'Midfielder' },
    { id: 13, name: 'Marek Napastnik', age: 22, number: 9, position: 'Attacker' },
  ],
  2: [
    { id: 20, name: 'Carlos GK', age: 30, number: 1, position: 'Goalkeeper' },
    { id: 21, name: 'Jose DF', age: 24, number: 3, position: 'Defender' },
  ],
}

const fallbackSquad: Player[] = [
  { id: 9991, name: 'Przykładowy Bramkarz', age: 30, number: 1, position: 'Goalkeeper' },
  { id: 9992, name: 'Przykładowy Obrońca', age: 27, number: 4, position: 'Defender' },
  { id: 9993, name: 'Przykładowy Pomocnik', age: 25, number: 8, position: 'Midfielder' },
  { id: 9994, name: 'Przykładowy Napastnik', age: 23, number: 9, position: 'Attacker' },
]

export async function getClubs(params?: { name?: string; country?: string; page?: number; size?: number }): Promise<{ items: Club[]; total: number }> {
  // TODO: replace with fetch to gateway -> football-external-data-service
  const page = params?.page ?? 0
  const size = params?.size ?? 10
  const nameQ = params?.name?.toLowerCase() || ''
  const countryQ = params?.country?.toLowerCase() || ''
  const filtered = mockClubs.filter((c) => {
    const cName = (c.name || c.teamName || '').toLowerCase()
    const cCountry = (c.country || '').toLowerCase()
    return (!nameQ || cName.includes(nameQ)) && (!countryQ || cCountry.includes(countryQ))
  })
  const start = page * size
  return { items: filtered.slice(start, start + size), total: filtered.length }
}

export async function getClubSquad(teamId: number): Promise<Player[]> {
  // TODO: replace with fetch to gateway -> football-external-data-service
  return mockSquads[teamId] || fallbackSquad
}
