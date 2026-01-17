import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    ArrowLeft,
    LayoutDashboard,
    Trash2,
    Edit,
    CalendarDays,
    Ruler,
    Weight,
    Shirt,
    User,
    Crown,
    Megaphone,
    Briefcase,
    Stethoscope,
    Medal,
    Search,
    AlertTriangle,
    Filter,
    Eye
} from 'lucide-react'
import { getMemberMemberships, type MembershipResponse, type TeamMemberDTO } from '@/lib/userApi'
import { hasRole } from '@/lib/auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- Konfiguracja Ról ---
const ROLE_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
    ROLE_TEAM_CAPTAIN: {
        label: 'Kapitan',
        icon: Crown,
        className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
    },
    ROLE_TEAM_HEAD_COACH: {
        label: 'Trener Główny',
        icon: Megaphone,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
    },
    ROLE_TEAM_ASSISTANT_COACH: {
        label: 'Asystent',
        icon: Megaphone,
        className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
    },
    ROLE_TEAM_MANAGER: {
        label: 'Manager',
        icon: Briefcase,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    },
    ROLE_TEAM_PHYSIO: {
        label: 'Fizjoterapeuta',
        icon: Stethoscope,
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
    },
    ROLE_TEAM_PLAYER: {
        label: 'Zawodnik',
        icon: User,
        className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    },
}

const DEFAULT_ROLE_CONFIG = {
    label: 'Członek',
    icon: User,
    className: 'bg-gray-100 text-gray-700 border-gray-200'
}

// --- Tłumaczenia Pozycji na Boisku ---
const POSITION_TRANSLATIONS: Record<string, string> = {
    GOALKEEPER: 'Bramkarz',
    DEFENDER: 'Obrońca',
    MIDFIELDER: 'Pomocnik',
    ATTACKER: 'Napastnik',
    Striker: 'Napastnik',
    Winger: 'Skrzydłowy',
}

const formatDate = (isoDate?: string) => {
    if (!isoDate) return '—'
    return new Date(isoDate).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

export function MemberPublicProfilePage() {
    const { memberId } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState<MembershipResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorOccurred, setErrorOccurred] = useState<boolean>(false)

    // --- Stan Filtrów ---
    const [searchInput, setSearchInput] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [selectedRole, setSelectedRole] = useState<string>('ALL')
    const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE')

    const isPrivileged = hasRole('ADMIN') || hasRole('COACH') || hasRole('ROLE_ADMIN') || hasRole('ROLE_COACH')

    useEffect(() => {
        if (!memberId) return
        const loadData = async () => {
            setLoading(true)
            try {
                const response = await getMemberMemberships(Number(memberId))
                setData(response)
            } catch (err: any) {
                console.error("Błąd pobierania danych:", err)
                setErrorOccurred(true)
                let msg = "Wystąpił błąd."
                try {
                    const parsed = JSON.parse(err.message || '{}')
                    if (parsed.message) msg = parsed.message
                } catch { if (err.message) msg = err.message }
                toast.error(msg)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [memberId])

    // --- Logika Filtrowania ---
    const filteredContent = useMemo(() => {
        if (!data?.content) return []

        return data.content.filter(item => {
            if (!isPrivileged && item.status !== 'ACTIVE') return false
            if (isPrivileged && selectedStatus !== 'ALL' && item.status !== selectedStatus) return false
            if (selectedRole !== 'ALL' && !item.roles.includes(selectedRole)) return false

            if (appliedSearch) {
                const isIdSearch = !isNaN(Number(appliedSearch)) && appliedSearch.trim() !== ''
                if (isIdSearch) {
                    if (item.teamId !== Number(appliedSearch)) return false
                } else {
                    const query = appliedSearch.toLowerCase()
                    const name = (item.teamName || '').toLowerCase()
                    if (!name.includes(query)) return false
                }
            }
            return true
        })
    }, [data, isPrivileged, selectedStatus, selectedRole, appliedSearch])

    // --- Logika Oczekujących (Banner) ---
    const pendingMemberships = useMemo(() => {
        if (!data?.content || !isPrivileged) return []
        return data.content.filter(item => item.status === 'WAITING_FOR_VERIFICATION' || item.status === 'PENDING')
    }, [data, isPrivileged])

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setAppliedSearch(searchInput)
        }
    }

    const handleDelete = (id: number) => toast.info(`Usuwanie ID: ${id} (API)`)
    const handleEdit = (id: number) => toast.info(`Edycja ID: ${id} (API)`)

    // Nowy handler do podglądu
    const handleView = (teamId: number) => {
        navigate(`/team-details/${teamId}`)
    }

    if (loading) return <LoadingState />
    if (errorOccurred || !data) return <ErrorState navigate={navigate} />

    const { member } = data
    const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase()

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
                        <h1 className="text-xl font-bold tracking-tight">Szczegóły Członkostwa</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Wróć
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">

                {/* BANNER OCZEKUJĄCYCH */}
                {pendingMemberships.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-400">
                                Wymagana weryfikacja
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Użytkownik oczekuje na zatwierdzenie w zespołach:
                                <span className="font-bold ml-1">
                                    {pendingMemberships.map(m => m.teamName || `#${m.teamId}`).join(', ')}
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEWA STRONA: Profil Gracza */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="text-center pb-2 bg-muted/20 border-b">
                                    <div className="mx-auto mb-4 relative">
                                        <Avatar className="h-40 w-40 border-4 border-background shadow-xl">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${initials}`} />
                                            <AvatarFallback className="text-5xl">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-2 right-2 bg-background rounded-full p-1.5 shadow-sm border">
                                            <Medal className="h-6 w-6 text-yellow-500" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl">{member.firstName} {member.lastName}</CardTitle>
                                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
                                        <CalendarDays className="h-4 w-4" />
                                        W klubie od: {formatDate(member.joinDate)}
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-3">
                                        <StatRow icon={User} label="Wiek" value={member.age} unit="" />
                                        <StatRow icon={Ruler} label="Wzrost" value={member.height} unit="cm" />
                                        <StatRow icon={Weight} label="Waga" value={member.weight} unit="kg" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>

                    {/* PRAWA STRONA: Lista Zespołów */}
                    <section className="lg:col-span-2 space-y-6">

                        {/* PASEK FILTRÓW */}
                        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">

                            <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Szukaj (ID lub Nazwa) + Enter..."
                                    className="pl-9"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="w-full sm:w-[160px]">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Filter className="h-3.5 w-3.5" />
                                            <SelectValue placeholder="Rola" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Wszystkie Role</SelectItem>
                                        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {isPrivileged && (
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger className="w-full sm:w-[150px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Wszystkie</SelectItem>
                                            <SelectItem value="ACTIVE">Aktywne</SelectItem>
                                            <SelectItem value="WAITING_FOR_VERIFICATION">Oczekujące</SelectItem>
                                            <SelectItem value="REJECTED">Odrzucone</SelectItem>
                                            <SelectItem value="ARCHIVED">Zarchiwizowane</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Licznik wyników */}
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-semibold tracking-tight">Wyniki wyszukiwania</h2>
                            <Badge variant="secondary" className="px-2">
                                {filteredContent.length}
                            </Badge>
                        </div>

                        {/* Lista Wyników */}
                        {filteredContent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/5">
                                <Shirt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">Brak wyników</h3>
                                <p className="text-muted-foreground">Brak zespołów spełniających kryteria filtrowania.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredContent.map((item) => (
                                    <MembershipCard
                                        key={item.teamMemberId}
                                        item={item}
                                        isPrivileged={isPrivileged}
                                        onDelete={() => handleDelete(item.teamMemberId)}
                                        onEdit={() => handleEdit(item.teamMemberId)}
                                        onView={() => handleView(item.teamId)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

// --- Komponenty Pomocnicze ---

function StatRow({ icon: Icon, label, value, unit }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <span className="text-lg font-bold">{value != null ? `${value} ${unit}` : '—'}</span>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Pobieranie danych członka...</p>
            </div>
        </div>
    )
}

function ErrorState({ navigate }: { navigate: any }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
            <h2 className="text-xl font-bold text-destructive">Nie udało się pobrać danych profilu</h2>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Wróć do Dashboardu
            </Button>
        </div>
    )
}

interface MembershipCardProps {
    item: TeamMemberDTO;
    isPrivileged: boolean;
    onDelete: (id: number) => void;
    onEdit: (id: number) => void;
    onView: () => void;
}

function MembershipCard({ item, isPrivileged, onDelete, onEdit, onView }: MembershipCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-500 shadow-green-200 dark:shadow-green-900/20'
            case 'WAITING_FOR_VERIFICATION':
            case 'PENDING':
                return 'bg-blue-500 shadow-blue-200 dark:shadow-blue-900/20'
            case 'REJECTED':
                return 'bg-red-500 shadow-red-200 dark:shadow-red-900/20'
            case 'ARCHIVED':
            case 'SUSPENDED':
                return 'bg-gray-400 shadow-gray-200 dark:shadow-gray-900/20'
            default:
                return 'bg-gray-400'
        }
    }
    const stripColorClass = getStatusColor(item.status)

    // Helper do tłumaczenia pozycji
    const translatePosition = (pos?: string) => {
        if (!pos) return '—'
        const key = pos.toUpperCase()
        return POSITION_TRANSLATIONS[key] || pos
    }

    return (
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group bg-card">
            <CardContent className="p-0">
                <div className="flex h-full min-h-[140px]">

                    {/* KOLOROWY PASEK BOCZNY */}
                    <div className={cn("w-2.5 shrink-0", stripColorClass)} />

                    <div className="flex flex-1 flex-col sm:flex-row">
                        <div className="flex-1 p-5 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        {item.teamName || `Zespół #${item.teamId}`}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        Dołączył: {formatDate(item.sienceDate)}
                                    </p>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>

                            {/* Dane Techniczne (Jaśniejsze tło: bg-secondary/10) */}
                            <div className="grid grid-cols-2 gap-3 max-w-sm">
                                <div className="bg-secondary/10 rounded-md p-2 flex items-center gap-3 border">
                                    <div className="bg-background p-1.5 rounded-md shadow-sm">
                                        <Shirt className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Numer</p>
                                        <p className="font-mono font-bold text-sm">
                                            {item.number === 0 ? '-' : `#${item.number}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-secondary/10 rounded-md p-2 flex items-center gap-3 border">
                                    <div className="bg-background p-1.5 rounded-md shadow-sm">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Pozycja</p>
                                        <p className="font-medium text-sm truncate">
                                            {translatePosition(item.fieldPosition)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex flex-wrap gap-2">
                                    {item.roles.map(roleKey => {
                                        const config = ROLE_CONFIG[roleKey] || DEFAULT_ROLE_CONFIG
                                        const Icon = config.icon
                                        return (
                                            <Badge
                                                key={roleKey}
                                                variant="outline"
                                                className={cn(
                                                    "pl-1.5 pr-2.5 py-1 gap-1.5 text-xs font-semibold border transition-colors",
                                                    config.className
                                                )}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {config.label}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Pasek Akcji */}
                        <div className="flex flex-row sm:flex-col gap-1 items-center justify-center border-t sm:border-t-0 sm:border-l bg-muted/5 p-2 sm:min-w-[60px]">

                            {/* Oczko (Podgląd) - Zielony Hover */}
                            <button
                                onClick={onView}
                                className="p-2 rounded-md transition-all hover:bg-green-500/10 text-muted-foreground hover:text-green-600 group/btn"
                                title="Zobacz szczegóły"
                            >
                                <Eye className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                            </button>

                            {/* Akcje Admina */}
                            {isPrivileged && (
                                <>
                                    {/* Edycja - Niebieski Hover */}
                                    <button
                                        onClick={() => onEdit(item.teamMemberId)}
                                        className="p-2 rounded-md transition-all hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600 group/btn"
                                        title="Edytuj"
                                    >
                                        <Edit className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                    {/* Kosz - Czerwony Hover */}
                                    <button
                                        onClick={() => onDelete(item.teamMemberId)}
                                        className="p-2 rounded-md transition-all hover:bg-red-500/10 text-muted-foreground hover:text-red-600 group/btn"
                                        title="Usuń"
                                    >
                                        <Trash2 className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        WAITING_FOR_VERIFICATION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        PENDING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        ARCHIVED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
        SUSPENDED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
        REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    }
    const label: Record<string, string> = {
        ACTIVE: 'Aktywny',
        WAITING_FOR_VERIFICATION: 'Oczekuje na zatwierdzenie',
        PENDING: 'Oczekuje na zatwierdzenie',
        ARCHIVED: 'Zarchiwizowany',
        SUSPENDED: 'Zarchiwizowany',
        REJECTED: 'Odrzucony'
    }
    return (
        <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wide shadow-sm", styles[status] || styles.REJECTED)}>
            {label[status] || status}
        </span>
    )
}

export default MemberPublicProfilePage