import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import { getTeamDetails, type TeamDetails } from '@/lib/userApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-white text-2xl font-bold">
                                            {String(team.name || '').split(' ').map(s => s.charAt(0)).slice(0,2).join('').toUpperCase() || 'FC'}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{team.name}</CardTitle>
                                            <div className="text-sm text-muted-foreground">{team.category ? `Kategoria: ${team.category}` : ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Button variant="outline" onClick={() => navigate('/teams')}>Powrót</Button>
                                        {teamId && (
                                            <Button onClick={() => navigate(`/club/${teamId}/squad`)}>Skład zespołu</Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-muted-foreground mb-2">Opis</p>
                                        <div className="rounded-md border border-border p-4 bg-background text-sm">
                                            {team.description ?? 'Brak opisu zespołu'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm text-muted-foreground">Informacje</div>
                                        <div className="grid grid-cols-1 gap-1 text-sm">
                                            <div><span className="font-medium">Utworzono:</span> {team.createdAt ?? '—'}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sekcja składów została ukryta zgodnie z prośbą */}
                     </div>
                 )}
             </main>
         </div>
     );
 }

 export default TeamDetailsPage;
