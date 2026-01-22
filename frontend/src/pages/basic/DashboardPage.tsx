import { Button } from '@/components/ui/button.tsx'
import { Users, Search, CalendarClock, Settings2, LogOut, Eye, ShieldAlert, User, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { OFFLINE, getUserRoles } from '@/lib/auth.ts'
import { apiLogout, getMemberStatus, getMyAccount, type MemberStatus, type UserAccount } from '@/lib/userApi.ts'
import { useEffect, useState } from 'react'

export function DashboardPage() {
    // Ustaw tytuł strony
    useEffect(() => {
        const prev = document.title
        document.title = 'Dashboard'
        return () => { document.title = prev }
    }, [])

    const navigate = useNavigate()

    // --- STAŁA: DANE UŻYTKOWNIKA (UserAccount) ---
    const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)

    // --- POBIERANIE DANYCH PRZY ŁADOWANIU ---
    useEffect(() => {
        let mounted = true;
        const fetchUserData = async () => {
            try {
                // Pobieramy UserAccount (zgodnie z Twoim typem)
                const accountData = await getMyAccount({ allowUnauth: true });
                if (mounted && accountData) {
                    setCurrentUser(accountData);
                }
            } catch (e) {
                console.error("Nie udało się pobrać danych użytkownika", e);
            }
        };
        fetchUserData();
        return () => { mounted = false; };
    }, []);

    const handleLogout = async () => {
        try {
            await apiLogout()
        } finally {
            toast.success('Wylogowano pomyślnie')
            navigate('/')
        }
    }

    // --- LOGIKA UPRAWNIEŃ NA PODSTAWIE POBRANEGO OBIEKTU ---
    // Pobieramy role z obiektu currentUser, a jeśli jeszcze się nie załadował, bierzemy z tokena (fallback)
    const currentRoles = currentUser?.userRole?.map(r => r.role) || getUserRoles();

    // 1. Czy jest Memberem?
    const status: MemberStatus = getMemberStatus()
    const isMember = status === 'member' || currentRoles.includes('ROLE_MEMBER') || currentRoles.includes('ROLE_PLAYER') || currentRoles.includes('ROLE_COACH');

    const showApply = !OFFLINE && status === 'guest' && !isMember
    const showPending = !OFFLINE && status === 'pending'

    // 2. Czy może zarządzać zespołem? (COACH lub ADMIN)
    const userCanManageTeam = () => {
        if (currentRoles.includes('ROLE_ADMIN')) return true
        return currentRoles.some(r => r.toUpperCase().includes('COACH'));
    }
    const canManageTeam = userCanManageTeam()

    // 3. Czy jest Adminem?
    const isAdmin = currentRoles.includes('ROLE_ADMIN') || OFFLINE

    // --- NAVIGACJA ---
    const handleProfile = () => {
        navigate('/member-profile')
    }

    const handleTeamManagement = () => {
        if (!canManageTeam) {
            toast.error('Brak uprawnień do zarządzania zespołem (wymagana rola Trenera)')
            return
        }
        navigate('/team-management')
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-[#091021] sticky top-0 z-50 shadow-sm">
                <div className="container px-4 max-w-7xl mx-auto flex h-16 justify-between items-center">

                    {/* LEWA STRONA: LOGO + TYTUŁ */}
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10">
                            <img
                                src="/favicon.png"
                                alt="Logo"
                                className="h-full w-full object-contain drop-shadow-sm"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">Panel Klubu</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Strona Główna</p>
                        </div>
                    </div>

                    {/* PRAWA STRONA: USER INFO + AKCJE */}
                    <div className="flex items-center gap-4">

                        {/* Dane usera */}
                        {currentUser && (
                            <div className="hidden md:flex flex-col items-end animate-in fade-in">
                                <span className="text-sm font-semibold leading-none">{currentUser.userName}</span>
                                <span className="text-[10px] text-muted-foreground">{currentUser.userEmail}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={handleProfile}
                                    className="hidden sm:flex text-muted-foreground hover:text-foreground">
                                <Eye className="mr-2 h-4 w-4"/>
                                Profil
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleProfile} className="sm:hidden">
                                <User className="h-5 w-5"/>
                            </Button>

                            <Button variant="ghost" size="sm" onClick={handleLogout}
                                    className="hidden sm:flex text-muted-foreground hover:text-destructive">
                                <LogOut className="mr-2 h-4 w-4"/>
                                Wyloguj
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleLogout}
                                    className="sm:hidden text-muted-foreground hover:text-destructive">
                                <LogOut className="h-5 w-5"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Główny kontener */}
            <main className="container py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden bg-background max-w-5xl mx-auto">

                {/* Informacje o statusie wniosku (Górne Banery) */}
                {showApply && (
                    <div className="mb-6 p-6 rounded-xl border border-primary/20 bg-primary/5 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <h2 className="text-xl font-bold text-primary">Dołącz do nas!</h2>
                            <p className="text-muted-foreground">Jesteś nowym użytkownikiem? Uzupełnij dane, aby zostać zawodnikiem.</p>
                        </div>
                        <Button size="lg" onClick={() => navigate('/member-apply')} className="shadow-md">
                            Złóż wniosek członkowski
                        </Button>
                    </div>
                )}
                {showPending && (
                    <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <CalendarClock className="h-5 w-5" /> Wniosek oczekuje
                            </h2>
                            <p className="text-sm opacity-90">Twój wniosek jest weryfikowany przez trenera.</p>
                        </div>
                        <Button variant="outline" className="border-amber-500/30 hover:bg-amber-500/20" onClick={() => navigate('/member-apply')}>
                            Podgląd wniosku
                        </Button>
                    </div>
                )}

                {/* Główne kafelki nawigacyjne */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-4">
                    <HoverableCTA onClick={() => navigate('/team-search')}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-full">
                                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-lg font-bold">Wyszukiwanie zespołów</h4>
                                <p className="text-sm text-muted-foreground mt-1">Przejrzyj i wyszukaj drużyny w lidze</p>
                            </div>
                        </div>
                    </HoverableCTA>

                    <HoverableCTA onClick={() => navigate('/matches')}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-full">
                                <CalendarClock className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-lg font-bold">Mecze</h4>
                                <p className="text-sm text-muted-foreground mt-1">Harmonogram, wyniki i szczegóły spotkań</p>
                            </div>
                        </div>
                    </HoverableCTA>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-6">
                    {/* Przycisk "Dołącz do zespołu" */}
                    <HoverableCTA
                        onClick={() => navigate('/join-team')}
                        disabled={!isMember}
                        className={`md:col-span-2 ${!isMember ? "opacity-70 grayscale" : ""}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${!isMember ? "bg-gray-500/10" : "bg-purple-500/10"}`}>
                                <Users className={`h-6 w-6 shrink-0 ${!isMember ? "text-gray-500" : "text-purple-600 dark:text-purple-400"}`} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-lg font-bold">Dołącz do zespołu</h4>
                                <p className={`text-sm mt-1 ${!isMember ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                    {!isMember
                                        ? "Najpierw musisz zostać członkiem (wniosek na górze)."
                                        : "Masz kod drużyny? Dołącz tutaj."
                                    }
                                </p>
                            </div>
                        </div>
                    </HoverableCTA>
                </section>

                {/* Sekcja Administracyjna i Zarządzania */}
                {(canManageTeam || isAdmin) && (
                    <div className="mt-9 pt-7 border-t">
                        <h3 className="text-xs font-bold text-muted-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
                            <Settings2 className="h-4 w-4" /> Strefa Zarządzania
                        </h3>
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

                            {/* Zarządzanie Zespołem (Trener/Admin) */}
                            {canManageTeam && (
                                <HoverableCTA onClick={handleTeamManagement} className="bg-gradient-to-br from-background to-blue-50/50 dark:to-blue-950/20 border-blue-200/50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-full">
                                            <Settings2 className="h-6 w-6 text-blue-600 shrink-0" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-lg font-bold">Zarządzanie zespołem</h4>
                                            <p className="text-sm text-muted-foreground mt-1">Edycja składu, taktyki i ustawień</p>
                                        </div>
                                    </div>
                                </HoverableCTA>
                            )}

                            {/* NOWY PRZYCISK: Dane Zewnętrzne (Coach/Admin) */}
                            {canManageTeam && (
                                <HoverableCTA
                                    onClick={() => navigate('/admin/external')}
                                    className="bg-gradient-to-br from-background to-indigo-50/50 dark:to-indigo-950/20 border-indigo-200/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-500/10 rounded-full">
                                            <Globe className="h-6 w-6 text-indigo-600 shrink-0" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-lg font-bold">Dane Zewnętrzne</h4>
                                            <p className="text-sm text-muted-foreground mt-1">Synchronizacja lig i zarządzanie API</p>
                                        </div>
                                    </div>
                                </HoverableCTA>
                            )}

                            {/* Zarządzanie Użytkownikami (Tylko Admin) */}
                            {isAdmin && (
                                <HoverableCTA onClick={() => navigate('/admin/users')} className="bg-gradient-to-br from-background to-red-50/50 dark:to-red-950/20 border-red-200/50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-500/10 rounded-full">
                                            <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-lg font-bold text-red-700 dark:text-red-400">Użytkownicy (Admin)</h4>
                                            <p className="text-sm text-muted-foreground mt-1">Blokady kont, nadawanie uprawnień</p>
                                        </div>
                                    </div>
                                </HoverableCTA>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    )
}

export default DashboardPage

function HoverableCTA({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
    const [hover, setHover] = useState(false)

    const hoverStyle: React.CSSProperties = hover && !disabled
        ? {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderColor: 'hsl(var(--primary) / 0.4)'
        }
        : {}

    return (
        <button
            type="button"
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={() => !disabled && setHover(true)}
            onMouseLeave={() => !disabled && setHover(false)}
            data-hover={hover}
            className={`
                group relative w-full p-6 rounded-2xl border shadow-sm transition-all duration-300 ease-out
                flex flex-col items-start justify-center text-left
                bg-gradient-to-br from-card via-card to-secondary/30
                ${disabled ? 'cursor-not-allowed bg-muted/30 border-dashed' : 'cursor-pointer'}
                ${className ?? ''}
            `}
            style={hoverStyle}
            aria-disabled={disabled}
        >
            {children}
        </button>
    )
}