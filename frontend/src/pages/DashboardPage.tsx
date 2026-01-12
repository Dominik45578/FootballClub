import { Button } from '@/components/ui/button'
import { User, Search, CalendarClock, Users, Settings2, LogOut, Eye } from 'lucide-react'
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
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => navigate('/member-profile')}>
                            <User className="mr-2 h-4 w-4" />
                            Profil
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
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
                        <Button variant="outline" onClick={() => navigate('/member-apply')}>
                            <Eye className="mr-2 h-4 w-4" />
                            Podgląd wniosku
                        </Button>
                    </div>
                )}

                {/* CTA przyciski pod kartami */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-2">
                    {/* lokalne stany hover aby wymusić efekt rozjaśnienia nawet jeśli CSS jest nadpisany */}
                    {/* Button A */}
                    <HoverableCTA onClick={() => navigate('/team-search')}>
                        <div className="flex items-center gap-4">
                            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Wyszukiwanie zespołów</h4>
                                <p className="text-sm text-muted-foreground mt-1">Przejrzyj i wyszukaj drużyny</p>
                            </div>
                        </div>
                    </HoverableCTA>

                    {/* Button B */}
                    <HoverableCTA onClick={() => navigate('/matches')}>
                        <div className="flex items-center gap-4">
                            <CalendarClock className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Mecze</h4>
                                <p className="text-sm text-muted-foreground mt-1">Zobacz harmonogram i szczegóły</p>
                            </div>
                        </div>
                    </HoverableCTA>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-2">
                    <HoverableCTA onClick={() => navigate('/club/1/squad')}>
                        <div className="flex items-center gap-4">
                            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Skład drużyny</h4>
                                <p className="text-sm text-muted-foreground mt-1">Podgląd listy zawodników (mock)</p>
                            </div>
                        </div>
                    </HoverableCTA>
                    <HoverableCTA onClick={() => navigate('/team-management')}>
                        <div className="flex items-center gap-4">
                            <Settings2 className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Zarządzanie zespołem</h4>
                                <p className="text-sm text-muted-foreground mt-1">Panel trenera/admina</p>
                            </div>
                        </div>
                    </HoverableCTA>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-2">
                    <HoverableCTA onClick={() => navigate('/members')}>
                        <div className="flex items-center gap-4">
                            <Eye className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Członkowie</h4>
                                <p className="text-sm text-muted-foreground mt-1">Wyszukaj i przeglądaj profile</p>
                            </div>
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
    const hoverStyle: React.CSSProperties = hover
        ? {
              transform: 'translateY(-2px) scale(1.01)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              backgroundImage: 'linear-gradient(135deg, rgba(91,33,182,0.08), rgba(59,130,246,0.08))'
          }
        : {}

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            data-hover={hover}
            className="w-full py-6 px-4 rounded-lg shadow-md flex flex-col items-center justify-center text-center text-foreground transition duration-200 my-4 border border-slate-700 cursor-pointer bg-slate-900/70 text-slate-100 hover:ring-2 hover:ring-ring/20 focus:ring-2 focus:ring-ring/20 focus:outline-none"
            style={hoverStyle}
        >
            {children}
        </button>
    )
}
