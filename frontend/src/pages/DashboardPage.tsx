import { Button } from '@/components/ui/button'
import { UserPlus, Users, Search, CalendarClock, Settings2, LogOut, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { OFFLINE } from '@/lib/auth'
import { apiLogout, getMemberStatus, type MemberStatus, ensureMemberStatus } from '@/lib/userApi'
import { useEffect, useState } from 'react'

export function DashboardPage() {
    // set tab title for Dashboard
    useEffect(() => {
        const prev = document.title
        document.title = 'Dashboard'
        return () => { document.title = prev }
    }, [])
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await apiLogout()
        } finally {
            toast.success('Wylogowano pomyślnie')
            navigate('/')
        }
    }

    const status: MemberStatus = getMemberStatus()
    const showApply = !OFFLINE && status === 'guest'
    const showPending = !OFFLINE && status === 'pending'
    const canManageTeam = OFFLINE

    const handleProfile = async () => {
        try {
            const status = await ensureMemberStatus()
            if (status === 'member') {
                navigate('/member-profile')
                return
            }
            toast.error('Brak uprawnień do profilu członka')
        } catch {
            toast.error('Brak uprawnień do profilu członka')
        }
    }

    const handleTeamManagement = () => {
        if (!canManageTeam) {
            toast.error('Brak uprawnień do zarządzania zespołem')
            return
        }
        navigate('/team-management')
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Panel klubu piłkarskiego</h1>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={handleProfile}>
                            <Eye className="mr-2 h-4 w-4" />
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
                            <Search className="h-7 w-7 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Wyszukiwanie zespołów</h4>
                                <p className="text-sm text-muted-foreground mt-1">Przejrzyj i wyszukaj drużyny</p>
                            </div>
                        </div>
                    </HoverableCTA>

                    {/* Button B */}
                    <HoverableCTA onClick={() => navigate('/matches')}>
                        <div className="flex items-center gap-4">
                            <CalendarClock className="h-7 w-7 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Mecze</h4>
                                <p className="text-sm text-muted-foreground mt-1">Zobacz harmonogram i szczegóły</p>
                            </div>
                        </div>
                    </HoverableCTA>
                </section>

                {/* Sekcja: Zostań członkiem / Dołącz do zespołu (pod wyszukiwaniem i meczami) */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-6">
                    <HoverableCTA onClick={() => navigate('/member-apply')}>
                        <div className="flex items-center gap-4">
                            <UserPlus className="h-7 w-7 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Zostań członkiem</h4>
                                <p className="text-sm text-muted-foreground mt-1">Złóż wniosek o nadanie roli członka w klubie.</p>
                            </div>
                        </div>
                    </HoverableCTA>

                    <HoverableCTA onClick={() => navigate('/join-team')}>
                        <div className="flex items-center gap-4">
                            <Users className="h-7 w-7 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Dołącz do zespołu</h4>
                                <p className="text-sm text-muted-foreground mt-1">Wpisz kod zespołu aby dołączyć do konkretnej drużyny.</p>
                            </div>
                        </div>
                    </HoverableCTA>
                </section>

                {/* Sekcja: Zarządzanie zespołem - przeniesiona niżej */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-6">
                    <HoverableCTA onClick={handleTeamManagement} disabled={!canManageTeam} className="md:col-span-2">
                        <div className="flex items-center gap-4">
                            <Settings2 className="h-7 w-7 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="text-lg font-semibold">Zarządzanie zespołem</h4>
                                <p className="text-sm text-muted-foreground mt-1">Panel trenera/admina</p>
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
function HoverableCTA({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
    const [hover, setHover] = useState(false)
    const hoverStyle: React.CSSProperties = hover && !disabled
        ? {
              transform: 'translateY(-2px) scale(1.01)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              backgroundImage: 'linear-gradient(135deg, rgba(91,33,182,0.08), rgba(59,130,246,0.08))'
          }
        : {}

    return (
        <button
            type="button"
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={() => !disabled && setHover(true)}
            onMouseLeave={() => !disabled && setHover(false)}
            data-hover={hover}
            className={`w-full py-6 px-4 rounded-lg shadow-md flex flex-col items-center justify-center text-center text-foreground transition duration-200 my-4 border border-slate-700 cursor-pointer bg-slate-900/70 text-slate-100 hover:ring-2 hover:ring-ring/20 focus:ring-2 focus:ring-ring/20 focus:outline-none ${disabled ? 'opacity-60 cursor-not-allowed hover:ring-0' : ''} ${className ?? ''}`}
            style={hoverStyle}
            aria-disabled={disabled}
        >
            {children}
        </button>
    )
}
