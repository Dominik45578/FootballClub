import { PlayersTable } from '@/components/PlayersTable'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { fetchPlayers } from '@/lib/api'
import { logout } from '@/lib/auth'

export function DashboardPage() {
    const navigate = useNavigate()

    const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: fetchPlayers })

    const handleLogout = () => {
        logout()
        toast.success('Wylogowano pomyślnie')
        navigate('/')
    }

    const totalPlayers = players.length
    const totalGoals = players.reduce((s, p) => s + (p.goals || 0), 0)
    const topScorer = players.slice().sort((a, b) => (b.goals || 0) - (a.goals || 0))[0]

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Panel klubu piłkarskiego</h1>
                    <Button variant="outline" onClick={handleLogout}>
                        Wyloguj się
                    </Button>
                </div>
            </header>
            <main className="container py-8">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-card rounded-lg shadow">
                        <h3 className="text-sm text-muted-foreground">Zawodnicy</h3>
                        <p className="text-2xl font-semibold">{totalPlayers}</p>
                    </div>
                    <div className="p-4 bg-card rounded-lg shadow">
                        <h3 className="text-sm text-muted-foreground">Suma bramek</h3>
                        <p className="text-2xl font-semibold">{totalGoals}</p>
                    </div>
                    <div className="p-4 bg-card rounded-lg shadow">
                        <h3 className="text-sm text-muted-foreground">Najlepszy strzelec</h3>
                        <p className="text-2xl font-semibold">{topScorer ? `${topScorer.name} (${topScorer.goals})` : '-'}</p>
                    </div>
                </section>

                <PlayersTable />
            </main>
        </div>
    )
}