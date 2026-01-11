import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { logout } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { getMemberStatus, type MemberStatus } from '@/lib/userApi'

export function DashboardPage() {
    // set tab title for Dashboard
    useEffect(() => {
        const prev = document.title
        document.title = 'Dashboard'
        return () => { document.title = prev }
    }, [])
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        toast.success('Wylogowano pomyślnie')
        navigate('/')
    }

    const status: MemberStatus = getMemberStatus()
    const showApply = status === 'guest'
    const showPending = status === 'pending'

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Panel klubu piłkarskiego</h1>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => navigate('/member-profile')}>Profil</Button>
                        <Button variant="outline" onClick={handleLogout}>
                            Wyloguj się
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden bg-background">
                {showApply && (
                    <div className="mb-6 p-4 rounded-lg border bg-card shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Zostań członkiem</h2>
                            <p className="text-sm text-muted-foreground">Uzupełnij dane wniosku i poczekaj na akceptację trenera/admina. (mock, bez backendu)</p>
                        </div>
                        <Button onClick={() => navigate('/member-apply')}>Złóż wniosek</Button>
                    </div>
                )}
                {showPending && (
                    <div className="mb-6 p-4 rounded-lg border border-slate-700 bg-slate-800/90 text-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Wniosek oczekuje</h2>
                            <p className="text-sm text-slate-200/80">Czekasz na akceptację. Po zatwierdzeniu dostaniesz dostęp do drużyny.</p>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/member-apply')}>Podgląd wniosku</Button>
                    </div>
                )}

                {/* CTA przyciski pod kartami */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-2">
                    {/* lokalne stany hover aby wymusić efekt rozjaśnienia nawet jeśli CSS jest nadpisany */}
                    {/* Button A */}
                    <HoverableCTA onClick={() => navigate('/team-search')}>
                        <div>
                            <h4 className="text-lg font-semibold">Wyszukiwanie zespołów</h4>
                            <p className="text-sm text-muted-foreground mt-1">Przejrzyj i wyszukaj drużyny</p>
                        </div>
                    </HoverableCTA>

                    {/* Button B */}
                    <HoverableCTA onClick={() => navigate('/matches')}>
                        <div>
                            <h4 className="text-lg font-semibold">Mecze</h4>
                            <p className="text-sm text-muted-foreground mt-1">Zobacz harmonogram i szczegóły</p>
                        </div>
                    </HoverableCTA>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-2">
                    <HoverableCTA onClick={() => navigate('/club/1/squad')}>
                        <div>
                            <h4 className="text-lg font-semibold">Skład drużyny</h4>
                            <p className="text-sm text-muted-foreground mt-1">Podgląd listy zawodników (mock)</p>
                        </div>
                    </HoverableCTA>
                    <HoverableCTA onClick={() => navigate('/team-management')}>
                        <div>
                            <h4 className="text-lg font-semibold">Zarządzanie zespołem</h4>
                            <p className="text-sm text-muted-foreground mt-1">Panel trenera/admina</p>
                        </div>
                    </HoverableCTA>
                </section>
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
            className="w-full py-6 px-4 rounded-lg shadow-md flex flex-col items-center justify-center text-center text-foreground filter transition duration-200 my-4 border border-slate-700 cursor-pointer bg-slate-900/60 text-slate-100 hover:bg-primary/10 dark:hover:bg-primary/8 hover:brightness-140 hover:shadow-md hover:scale-105 hover:ring-2 hover:ring-ring/20 focus:brightness-140 focus:shadow-md focus:outline-none"
            style={hoverStyle}
        >
            {children}
        </button>
    )
}
