import { useState, useEffect } from 'react';
import { getTeams } from '@/lib/userApi'
import type { TeamSummary } from '@/lib/userApi'

export function TeamSearchPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Wyszukiwarka zespołów'
        return () => { document.title = prev }
    }, [])

    const [searchTerm, setSearchTerm] = useState('');
    const [teams, setTeams] = useState<TeamSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        setError(null)
        getTeams({ name: searchTerm }).then(res => {
            if (!mounted) return
            setTeams(res.items || [])
        }).catch(err => {
            if (!mounted) return
            setError(err?.message || 'Błąd ładowania')
        }).finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [searchTerm])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Wyszukiwarka zespołów</h1>
                </div>
            </header>
            <main className="container py-8">
                <input
                    type="text"
                    placeholder="Szukaj zespołu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                />

                {loading && <div>Ładowanie...</div>}
                {error && <div className="text-red-500">{error}</div>}

                <ul>
                    {teams.map(team => (
                        <li key={team.teamId} className="p-4 border-b">
                            <h2 className="text-lg font-bold">{team.teamName}</h2>
                            <p>Kategoria: {team.category}</p>
                            <p>Liczba członków: {team.numberOfMembers ?? '-'}</p>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}

export default TeamSearchPage;
