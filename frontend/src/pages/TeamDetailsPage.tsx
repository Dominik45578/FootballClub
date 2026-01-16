import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
    ArrowLeft, Calendar, Users, Shield, MapPin,
    User, Star, AlertCircle, RotateCw,
    Briefcase, ChevronDown, ChevronUp, Filter, Search,
    LayoutDashboard, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { getTeams, getTeamDetails, type TeamDetails } from '@/lib/userApi'
import { cn } from '@/lib/utils'

// --- KONFIGURACJA KOLORÓW I MAPOWANIA ---

const POSITION_MAP: Record<string, string> = {
    GOALKEEPER: 'Bramkarz',
    DEFENDER: 'Obrońca',
    MIDFIELDER: 'Pomocnik',
    ATTACKER: 'Napastnik',
    UNKNOWN: '—'
}

const POSITION_BG_STYLES: Record<string, string> = {
    GOALKEEPER: 'bg-yellow-50/70 border-yellow-100 hover:border-yellow-300',
    DEFENDER: 'bg-blue-50/70 border-blue-100 hover:border-blue-300',
    MIDFIELDER: 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-300',
    ATTACKER: 'bg-rose-50/70 border-rose-100 hover:border-rose-300',
    UNKNOWN: 'bg-white border-slate-200'
}

const ROLE_LABELS: Record<string, string> = {
    ROLE_TEAM_HEAD_COACH: 'Trener Główny',
    ROLE_TEAM_COACH: 'Trener',
    ROLE_TEAM_ASSISTANT_COACH: 'Asystent',
    ROLE_TEAM_CAPTAIN: 'Kapitan',
    ROLE_TEAM_PLAYER: 'Zawodnik',
    ROLE_TEAM_MANAGER: 'Manager',
    ROLE_TEAM_PHYSIO: 'Fizjoterapeuta'
}

const ROLE_STYLES: Record<string, string> = {
    ROLE_TEAM_HEAD_COACH: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    ROLE_TEAM_COACH: 'bg-blue-100 text-blue-700 border-blue-200',
    ROLE_TEAM_ASSISTANT_COACH: 'bg-sky-100 text-sky-700 border-sky-200',
    ROLE_TEAM_CAPTAIN: 'bg-amber-100 text-amber-700 border-amber-200',
    ROLE_TEAM_MANAGER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ROLE_TEAM_PHYSIO: 'bg-rose-100 text-rose-700 border-rose-200',
    ROLE_TEAM_PLAYER: 'bg-slate-100 text-slate-600 border-slate-200',
}

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    ARCHIVED: 'bg-red-100 text-red-700 border-red-200',
    WAITING: 'bg-blue-100 text-blue-700 border-blue-200',
    SUSPENDED: 'bg-orange-100 text-orange-700 border-orange-200',
}

export function TeamDetailsPage() {
    const { teamId } = useParams()
    const navigate = useNavigate()

    // Stan
    const [teamOverview, setTeamOverview] = useState<any>(null)
    const [loadingOverview, setLoadingOverview] = useState(true)
    const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [detailsError, setDetailsError] = useState(false)

    // UI State
    const [isManagementOpen, setIsManagementOpen] = useState(false)

    // Filtry
    const [positionFilter, setPositionFilter] = useState<string>('ALL')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    // 1. Pobranie Overview + Auto Details
    useEffect(() => {
        const id = Number(teamId)
        if (!id) return

        let mounted = true

        const fetchData = async () => {
            setLoadingOverview(true)
            try {
                // Overview
                const res = await getTeams({ teamId: id, mode: 'SPECIFIC_TEAM' }, { allowUnauth: true })
                const found = res.items.find((t: any) => t.teamId === id || t.id === id)

                if (!mounted) return

                if (found) {
                    setTeamOverview(found)
                    document.title = `Klub: ${found.teamName}`

                    // Auto-load details
                    const count = found.numberOfMembers ?? 0
                    if (count > 0) {
                        setLoadingDetails(true)
                        setDetailsError(false)
                        try {
                            const details = await getTeamDetails(id, { allowUnauth: true })
                            if (mounted) setTeamDetails(details)
                        } catch (err) {
                            console.error("Failed to load squad", err)
                            if (mounted) setDetailsError(true)
                        } finally {
                            if (mounted) setLoadingDetails(false)
                        }
                    }
                } else {
                    toast.error('Nie znaleziono zespołu')
                }
            } catch (e) {
                console.error(e)
            } finally {
                if (mounted) setLoadingOverview(false)
            }
        }

        fetchData()
        return () => { mounted = false }
    }, [teamId])

    const retryLoadSquad = async () => {
        if (!teamId) return
        setLoadingDetails(true)
        setDetailsError(false)
        try {
            const details = await getTeamDetails(Number(teamId), { allowUnauth: true })
            setTeamDetails(details)
        } catch (e) {
            setDetailsError(true)
        } finally {
            setLoadingDetails(false)
        }
    }

    // 3. Grupowanie członków
    const groupedMembers = useMemo(() => {
        if (!teamDetails?.members) return { coaches: [], managers: [], physios: [], captain: [], players: [] }

        let members = [...teamDetails.members]

        // Filtrowanie
        if (statusFilter !== 'ALL') {
            members = members.filter((m: any) => (m.status || '').toUpperCase() === statusFilter)
        }
        if (positionFilter !== 'ALL') {
            members = members.filter((m: any) => (m.fieldPosition || 'UNKNOWN') === positionFilter)
        }
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase()
            members = members.filter((m: any) =>
                (m.firstName?.toLowerCase().includes(lowerQ)) ||
                (m.lastName?.toLowerCase().includes(lowerQ))
            )
        }

        const coaches: any[] = []
        const managers: any[] = []
        const physios: any[] = []
        const captain: any[] = []
        const players: any[] = []

        members.forEach((m: any) => {
            const roles = m.roles || []
            let isStaff = false

            if (roles.some((r: string) => r.includes('COACH'))) {
                coaches.push(m); isStaff = true
            }
            if (roles.includes('ROLE_TEAM_MANAGER')) {
                managers.push(m); isStaff = true
            }
            if (roles.includes('ROLE_TEAM_PHYSIO')) {
                physios.push(m); isStaff = true
            }

            if (roles.includes('ROLE_TEAM_CAPTAIN')) {
                captain.push(m)
            }

            if (roles.includes('ROLE_TEAM_PLAYER') || roles.includes('ROLE_TEAM_CAPTAIN') || !isStaff) {
                players.push(m)
            }
        })

        return { coaches, managers, physios, captain, players }
    }, [teamDetails, positionFilter, statusFilter, searchQuery])

    const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pl-PL') : '—'
    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : 'FC'
    const memberCount = teamOverview?.numberOfMembers ?? teamOverview?.memberCount ?? 0

    const handleMemberClick = (memberId: number) => {
        console.log(`[NAVIGATE] ID: ${memberId}`)
        toast.info(`Profil ID: ${memberId}`)
    }

    const hasManagement = groupedMembers.coaches.length > 0 || groupedMembers.managers.length > 0 || groupedMembers.physios.length > 0

    return (
        <div className="min-h-screen bg-background pb-12">

            {/* Header - Pełne tło, bez przezroczystości */}
            <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
                <div className="container flex h-16 items-center justify-between px-4">

                    {/* LEWA STRONA: LOGO I NAZWA */}
                    <div className="flex items-center gap-3 overflow-hidden">
                        {teamOverview && (
                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-bold text-sm border shrink-0">
                                {getInitials(teamOverview.teamName)}
                            </div>
                        )}
                        <h1 className="text-xl font-bold truncate hidden sm:block">
                            {teamOverview?.teamName || 'Szczegóły Zespołu'}
                        </h1>
                    </div>

                    {/* PRAWA STRONA: PRZYCISKI NAWIGACYJNE */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hidden sm:flex">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/member-profile')} className="hidden sm:flex">
                            <Eye className="mr-2 h-4 w-4" /> Profil
                        </Button>

                        <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

                        <Button variant="outline" onClick={() => navigate('/team-search')} className="border-primary/20 hover:bg-primary/5">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy
                        </Button>
                    </div>
                </div>
            </header>

            {/* GŁÓWNY LAYOUT: GRID 2-KOLUMNOWY (POSZERZONY KONTENER) */}
            <main className="container py-8 px-4 sm:px-6 max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEWA KOLUMNA (3/12 = 25% na szerokich) - TEAM INFO */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                        {loadingOverview ? (
                            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
                        ) : teamOverview ? (
                            <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm bg-card sticky top-24">
                                <div className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className="h-32 w-32 rounded-2xl bg-muted/30 border flex items-center justify-center shrink-0 shadow-inner text-muted-foreground">
                                        <Shield className="h-16 w-16 opacity-50" />
                                    </div>

                                    <div className="space-y-2 w-full">
                                        <h2 className="text-2xl font-bold tracking-tight break-words">
                                            {teamOverview.teamName}
                                        </h2>
                                        <Badge variant="secondary" className="text-xs uppercase px-3 py-1">
                                            {teamOverview.category}
                                        </Badge>
                                    </div>

                                    <Separator className="w-full" />

                                    <div className="w-full space-y-3 text-sm text-muted-foreground">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4"/> Założony:</span>
                                            <span className="font-medium text-foreground">{formatDate(teamOverview.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-2"><Users className="h-4 w-4"/> Członków:</span>
                                            <span className="font-medium text-foreground">{memberCount}</span>
                                        </div>
                                        {teamOverview.code && (
                                            <div className="flex justify-between items-center">
                                                <span className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Kod:</span>
                                                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">{teamOverview.code}</span>
                                            </div>
                                        )}
                                    </div>

                                    {teamOverview.description && (
                                        <>
                                            <Separator className="w-full" />
                                            <div className="text-left w-full">
                                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Opis</p>
                                                <p className="text-sm leading-relaxed text-foreground/80 break-words">
                                                    {teamOverview.description}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">Nie znaleziono danych zespołu.</div>
                        )}
                    </div>

                    {/* PRAWA KOLUMNA (9/12 = 75%) - FILTRY, MANAGMENT, ZAWODNICY */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">

                        {/* KOMPONENT 1: FILTRY + WYSZUKIWARKA */}
                        {teamDetails && (
                            <Card className="shadow-sm">
                                <CardContent className="p-4 flex flex-col sm:flex-row flex-wrap items-center gap-4">

                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Filter className="h-4 w-4" /> Filtry
                                    </div>

                                    {/* Wyszukiwarka */}
                                    <div className="relative flex-1 w-full sm:w-auto min-w-[200px]">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Szukaj po nazwisku..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 h-9 text-sm"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className={cn("w-[130px] h-9 text-xs border-input", statusFilter !== 'ALL' && "bg-primary text-primary-foreground")}>
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Wszyscy</SelectItem>
                                                <SelectItem value="ACTIVE">Aktywni</SelectItem>
                                                <SelectItem value="WAITING">Oczekujący</SelectItem>
                                                <SelectItem value="SUSPENDED">Zawieszeni</SelectItem>
                                                <SelectItem value="ARCHIVED">Archiwalni</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={positionFilter} onValueChange={setPositionFilter}>
                                            <SelectTrigger className={cn("w-[140px] h-9 text-xs border-input", positionFilter !== 'ALL' && "bg-primary text-primary-foreground")}>
                                                <SelectValue placeholder="Pozycja" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">Wszystkie pozycje</SelectItem>
                                                <SelectItem value="GOALKEEPER">Bramkarze</SelectItem>
                                                <SelectItem value="DEFENDER">Obrońcy</SelectItem>
                                                <SelectItem value="MIDFIELDER">Pomocnicy</SelectItem>
                                                <SelectItem value="ATTACKER">Napastnicy</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* LOADERY I BŁĘDY */}
                        {loadingDetails ? (
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-64 w-full" />
                            </div>
                        ) : detailsError ? (
                            <Card className="border-destructive/30 bg-destructive/5">
                                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                                    <p className="text-sm font-medium text-destructive">Błąd pobierania składu</p>
                                    <Button onClick={retryLoadSquad} variant="outline" size="sm" className="mt-2">
                                        <RotateCw className="mr-2 h-3 w-3" /> Spróbuj ponownie
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : memberCount === 0 ? (
                            <div className="p-8 text-center border border-dashed rounded-lg bg-muted/10">
                                <p className="text-sm text-muted-foreground">Ten zespół nie ma jeszcze żadnych członków.</p>
                            </div>
                        ) : teamDetails ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

                                {/* KOMPONENT 2: MANAGEMENT (UKRYWALNY) */}
                                {hasManagement && (
                                    <Card className="border-dashed border-primary/20 bg-primary/5">
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                                            onClick={() => setIsManagementOpen(!isManagementOpen)}
                                        >
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                                <Briefcase className="h-4 w-4" /> Sztab i Zarząd
                                            </h3>
                                            {isManagementOpen ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                                        </div>

                                        {isManagementOpen && (
                                            <CardContent className="p-4 pt-0 grid gap-6 animate-in slide-in-from-top-2">
                                                <Separator className="mb-4 bg-primary/10" />

                                                {/* TRENERZY */}
                                                {groupedMembers.coaches.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 pl-1">TRENERZY</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                                                            {groupedMembers.coaches.map((m: any) => (
                                                                <MemberCard key={m.teamMemberId} member={m} onClick={() => handleMemberClick(m.memberId)} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* MANAGEROWIE I FIZJO */}
                                                {(groupedMembers.managers.length > 0 || groupedMembers.physios.length > 0) && (
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 pl-1">OBSŁUGA</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                                                            {groupedMembers.managers.map((m: any) => (
                                                                <MemberCard key={m.teamMemberId} member={m} onClick={() => handleMemberClick(m.memberId)} />
                                                            ))}
                                                            {groupedMembers.physios.map((m: any) => (
                                                                <MemberCard key={m.teamMemberId} member={m} onClick={() => handleMemberClick(m.memberId)} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        )}
                                    </Card>
                                )}

                                {/* KOMPONENT 3: ZAWODNICY (Z KAPITANEM) */}
                                <Card className="shadow-sm">
                                    <CardContent className="p-6 space-y-8">
                                        {/* KAPITAN WYRÓŻNIONY */}
                                        {groupedMembers.captain.length > 0 && (
                                            <section>
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b pb-2">
                                                    <Star className="h-4 w-4 text-yellow-500" /> Kapitan
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                                    {groupedMembers.captain.map((m: any) => (
                                                        <MemberCard key={`cap-${m.teamMemberId}`} member={m} isCaptain onClick={() => handleMemberClick(m.memberId)} />
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* LISTA ZAWODNIKÓW */}
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b pb-2">
                                                <User className="h-4 w-4" /> Zawodnicy ({groupedMembers.players.length})
                                            </h3>
                                            {groupedMembers.players.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                                    {groupedMembers.players.map((m: any) => (
                                                        <MemberCard key={m.teamMemberId} member={m} onClick={() => handleMemberClick(m.memberId)} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center border border-dashed rounded-lg bg-muted/10">
                                                    <p className="text-sm text-muted-foreground">Brak zawodników spełniających kryteria.</p>
                                                </div>
                                            )}
                                        </section>
                                    </CardContent>
                                </Card>

                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    )
}

// --- KOMPONENT KARTY CZŁONKA ---
function MemberCard({ member, isCaptain, onClick }: { member: any, isCaptain?: boolean, onClick: () => void }) {

    // Klasa tła dla statusu
    const statusClass = STATUS_STYLES[(member.status || '').toUpperCase()] || 'bg-slate-100 text-slate-600 border-slate-200'

    // Klasa tła dla całego kafelka
    const cardBgClass = POSITION_BG_STYLES[(member.fieldPosition || 'UNKNOWN').toUpperCase()] || 'bg-white border-slate-200'

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md",
                cardBgClass, // Aplikowanie koloru tła na podstawie pozycji
                isCaptain ? 'border-l-4 border-l-yellow-500' : ''
            )}
        >
            {/* Avatar / Numer */}
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-white/60 text-slate-800 shadow-sm border border-black/5">
                {member.number > 0 ? member.number : (member.firstName?.[0] || 'U')}
            </div>

            <div className="min-w-0 flex-1">
                {/* Imię i Nazwisko */}
                <p className="font-semibold text-sm truncate flex items-center gap-1 text-slate-900">
                    {member.firstName} {member.lastName}
                    {isCaptain && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                </p>

                {/* Pozycja */}
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {POSITION_MAP[member.fieldPosition] || member.fieldPosition || '—'}
                </div>

                {/* Badges: Rola i Status */}
                <div className="flex flex-wrap gap-1 mt-2">
                    {/* Badge Statusu */}
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", statusClass)}>
                        {member.status}
                    </Badge>

                    {/* Badge Ról */}
                    {member.roles && member.roles.map((r: string) => {
                        const label = ROLE_LABELS[r] || r.replace('ROLE_TEAM_', '')
                        // Ukryj rolę PLAYER jeśli jest więcej ról, żeby nie śmiecić
                        if (r === 'ROLE_TEAM_PLAYER' && member.roles.length > 1) return null

                        const roleClass = ROLE_STYLES[r] || 'bg-slate-100 text-slate-600 border-slate-200'

                        return (
                            <Badge key={r} variant="outline" className={cn("text-[9px] h-4 px-1.5 border font-normal", roleClass)}>
                                {label}
                            </Badge>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default TeamDetailsPage