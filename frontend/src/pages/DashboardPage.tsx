import { PlayersTable } from '@/components/PlayersTable'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { logout } from '@/lib/auth'
import { useEffect, useState } from 'react'

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
            <main className="container py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
                {/* statystyki jako karty */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-card rounded-lg border border-border shadow-sm">
                        <h3 className="text-sm text-muted-foreground">Zawodnicy</h3>
                        <p className="text-xl font-semibold">{totalPlayers}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border shadow-sm">
                        <h3 className="text-sm text-muted-foreground">Suma bramek</h3>
                        <p className="text-xl font-semibold">{totalGoals}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border shadow-sm">
                        <h3 className="text-sm text-muted-foreground">Najlepszy strzelec</h3>
                        <p className="text-xl font-semibold">{topScorer ? `${topScorer.name} (${topScorer.goals})` : '-'}</p>
                    </div>
                </section>

                {/* CTA przyciski pod kartami */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {/* lokalne stany hover aby wymusić efekt rozjaśnienia nawet jeśli CSS jest nadpisany */}
                    {/* Button A */}
                    <HoverableCTA onClick={() => navigate('/team-search')}>
                        <div>
                            <h4 className="text-lg font-semibold">Wyszukiwanie zespołów</h4>
                            <p className="text-sm text-muted-foreground mt-1">Przejrzyj i wyszukaj drużyny</p>
                        </div>
                    </HoverableCTA>

                    {/* Button B */}
                    <HoverableCTA onClick={() => navigate('/team-details')}>
                        <div>
                            <h4 className="text-lg font-semibold">Szczegóły zespołu</h4>
                            <p className="text-sm text-muted-foreground mt-1">Zobacz szczegóły wybranej drużyny</p>
                        </div>
                    </HoverableCTA>

                    {/* Button C */}
                    <HoverableCTA onClick={() => navigate('/member-profile')}>
                        <div>
                            <h4 className="text-lg font-semibold">Profil użytkownika</h4>
                            <p className="text-sm text-muted-foreground mt-1">Edytuj lub zobacz swój profil</p>
                        </div>
                    </HoverableCTA>
                </section>

                <PlayersTable />
            </main>
        </div>
    )
}

export default DashboardPage

// Small helper component: Button with internal hover state that applies inline styles.
function HoverableCTA({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    const [hover, setHover] = useState(false)
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    const hoverStyle: React.CSSProperties = hover
        ? {
              filter: 'brightness(1.4)',
              boxShadow: '0 8px 22px rgba(16,24,40,0.08), 0 1px 0 rgba(16,24,40,0.02)',
              transform: 'scale(1.02)',
              // lekkojsze, półprzezroczyste podświetlenie
              backgroundColor: isDark ? 'rgba(91,33,182,0.08)' : 'rgba(91,33,182,0.05)'
          }
        : {}

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => { console.log('HoverableCTA: enter'); setHover(true) }}
            onMouseLeave={() => { console.log('HoverableCTA: leave'); setHover(false) }}
            data-hover={hover}
            className="w-full py-6 px-4 bg-card rounded-lg shadow-md flex flex-col items-center justify-center text-center text-foreground filter transition duration-200 my-4 border border-border cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/8 hover:brightness-140 hover:shadow-md hover:scale-105 hover:ring-2 hover:ring-ring/20 focus:brightness-140 focus:shadow-md focus:outline-none"
            style={hoverStyle}
        >
            {children}
        </button>
    )
}
