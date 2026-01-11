import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import { getTeamDetails, type TeamDetails } from '@/lib/userApi'

export function TeamDetailsPage() {
    const { teamId } = useParams();
    const navigate = useNavigate()
    const [team, setTeam] = useState<TeamDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const prev = document.title
        document.title = `Szczegóły zespołu ${teamId ?? ''}`
        return () => { document.title = prev }
    }, [teamId])

    useEffect(() => {
        if (!teamId) return
        let mounted = true
        setLoading(true)
        setError(null)
        getTeamDetails(Number(teamId)).then(t => {
            if (!mounted) return
            setTeam(t)
        }).catch(err => {
            if (!mounted) return
            setError(err?.message || 'Błąd ładowania')
        }).finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [teamId])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center px-4">
                    <h1 className="text-2xl font-bold">Szczegóły zespołu</h1>
                </div>
            </header>
            <main className="container py-8">
                {loading && <div>Ładowanie...</div>}
                {error && <div className="text-red-500">{error}</div>}
                {!teamId && !loading && !error && (
                    <div className="p-4 bg-card rounded-lg shadow text-center">
                        <p>Nie wybrano zespołu. Przejdź do wyszukiwarki, aby wybrać zespół.</p>
                        <div className="mt-3">
                            <Button className="px-6 py-2 rounded-lg shadow-lg hover:brightness-110" onClick={() => navigate('/team-search')}>
                                Wyszukaj zespoły
                            </Button>
                        </div>
                    </div>
                )}
                {team && (
                    <>
                        <div className="flex items-start flex-wrap gap-3 overflow-hidden">
                            <div>
                                <h2 className="text-xl font-bold">{team.name} {teamId ? `(ID: ${teamId})` : ''}</h2>
                                <p>Kod zespołu: {team.code}</p>
                                <p>Kategoria: {team.category}</p>
                                <p>Data utworzenia: {team.createdAt}</p>
                            </div>
                            {teamId && (
                                <Button variant="default" size="lg" className="shrink-0 px-6" onClick={() => navigate(`/club/${teamId}/squad`)}>
                                    Zobacz skład zespołu
                                </Button>
                            )}
                        </div>
                        <h3 className="mt-4 text-lg font-bold">Członkowie:</h3>
                        <ul>
                            {team.members?.map((member, index) => (
                                <li key={index} className="p-2 border-b">
                                    {member.firstName} {member.lastName} - {member.roles?.join(', ') || member.status}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </main>
        </div>
    );
}

export default TeamDetailsPage;
