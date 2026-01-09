import { PlayersTable } from '@/components/PlayersTable'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { logout } from '@/lib/auth'
import { useEffect } from 'react'

const mockPlayers = [
    { id: 1, name: 'Jan Kowalski', position: 'Napastnik', goals: 10 },
    { id: 2, name: 'Adam Nowak', position: 'Obrońca', goals: 2 },
    { id: 3, name: 'Piotr Wiśniewski', position: 'Pomocnik', goals: 5 },
];

export function DashboardPage() {
    // set tab title for Dashboard
    useEffect(() => {
        const prev = document.title
        document.title = 'Dashboard'
        return () => { document.title = prev }
    }, [])
    const navigate = useNavigate()

    // Zamiast fetchPlayers używamy mockowanych danych
    const players = mockPlayers

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
                {/* statystyki jako karty */}
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

                {/* CTA przyciski pod kartami */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Button variant="ghost" size="lg" className="w-full py-10 px-6 bg-card rounded-lg shadow flex flex-col items-center justify-center text-center text-foreground filter transition duration-200 my-6 hover:brightness-150 hover:shadow-lg focus:brightness-150 focus:shadow-lg focus:outline-none" onClick={() => navigate('/team-search')}>
                        <div>
                            <h4 className="text-lg font-semibold">Wyszukiwanie zespołów</h4>
                            <p className="text-sm text-muted-foreground mt-1">Przejrzyj i wyszukaj drużyny</p>
                        </div>
                    </Button>

                    <Button variant="ghost" size="lg" className="w-full py-10 px-6 bg-card rounded-lg shadow flex flex-col items-center justify-center text-center text-foreground filter transition duration-200 my-6 hover:brightness-150 hover:shadow-lg focus:brightness-150 focus:shadow-lg focus:outline-none" onClick={() => navigate('/team-details')}>
                        <div>
                            <h4 className="text-lg font-semibold">Szczegóły zespołu</h4>
                            <p className="text-sm text-muted-foreground mt-1">Zobacz szczegóły wybranej drużyny</p>
                        </div>
                    </Button>

                    <Button variant="ghost" size="lg" className="w-full py-10 px-6 bg-card rounded-lg shadow flex flex-col items-center justify-center text-center text-foreground filter transition duration-200 my-6 hover:brightness-150 hover:shadow-lg focus:brightness-150 focus:shadow-lg focus:outline-none" onClick={() => navigate('/member-profile')}>
                        <div>
                            <h4 className="text-lg font-semibold">Profil użytkownika</h4>
                            <p className="text-sm text-muted-foreground mt-1">Edytuj lub zobacz swój profil</p>
                        </div>
                    </Button>
                </section>

                <PlayersTable />
            </main>
        </div>
    )
}

export default DashboardPage
