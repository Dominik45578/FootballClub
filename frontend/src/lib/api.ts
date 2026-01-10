export type Player = {
    id: number
    name: string
    position: string
    goals: number
}

export async function fetchPlayers(): Promise<Player[]> {
    // Mockowane dane - development: nie łączymy się z backendem teraz
    return [
        { id: 1, name: 'Jan Kowalski', position: 'Napastnik', goals: 10 },
        { id: 2, name: 'Adam Nowak', position: 'Obrońca', goals: 2 },
        { id: 3, name: 'Piotr Wiśniewski', position: 'Pomocnik', goals: 5 },
    ]
}
