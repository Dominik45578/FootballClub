import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Input } from '@/components/ui/input.tsx'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
import {
    ArrowLeft, Trash2, CalendarDays, Ruler, Weight,
    Shirt, User, Crown, Megaphone, Briefcase, Stethoscope, Medal,
    Search, AlertTriangle, Filter, Eye, Settings2, Save,
    X, XCircle, Check, Timer, CircleDot, CalendarClock, ChevronDown, ChevronUp, PlusCircle,
    House, Plane // Dodane nowe ikony
} from 'lucide-react'
import {
    getMemberMemberships,
    getMemberProfileById,
    updateTeamMember,
    removeTeamMember,
    approveTeamMember,
    type MembershipResponse,
    type MemberSummaryResponse,
    type ManageTeamMemberRequest
} from '@/lib/userApi.ts'
import { getMatchesByTeamId } from '@/lib/matchesApi.ts'
import { hasRole } from '@/lib/auth.ts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils.ts'

const FIELD_POSITION_LABELS: Record<string, string> = {
    GOALKEEPER: 'Bramkarz',
    DEFENDER: 'Obrońca',
    MIDFIELDER: 'Pomocnik',
    ATTACKER: 'Napastnik',
    WINGER: 'Skrzydłowy',
    NO_POSITION: 'Brak pozycji'
}

const ROLE_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
    ROLE_TEAM_CAPTAIN: { label: 'Kapitan', icon: Crown, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    ROLE_TEAM_HEAD_COACH: { label: 'Trener Główny', icon: Megaphone, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    ROLE_TEAM_ASSISTANT_COACH: { label: 'Asystent', icon: Megaphone, className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    ROLE_TEAM_MANAGER: { label: 'Manager', icon: Briefcase, className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    ROLE_TEAM_PHYSIO: { label: 'Fizjoterapeuta', icon: Stethoscope, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    ROLE_TEAM_PLAYER: { label: 'Zawodnik', icon: User, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}
const DEFAULT_ROLE_CONFIG = { label: 'Członek', icon: User, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }

// Dodajemy dostępną listę ról (używana w edycji) — wcześniej brakowało tej stałej
const AVAILABLE_ROLES = Object.keys(ROLE_CONFIG);

const STATUS_FILTER_OPTIONS = [
    { value: 'ALL', label: 'Wszystkie statusy' },
    { value: 'ACTIVE', label: 'Aktywni' },
    { value: 'WAITING_FOR_VERIFICATION', label: 'Oczekujący' },
    { value: 'ARCHIVED', label: 'Zarchiwizowani' },
    { value: 'REJECTED', label: 'Odrzuceni' },
]

const formatDate = (isoDate?: string) => {
    if (!isoDate) return '—'
    return new Date(isoDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function MemberPublicProfilePage() {
    const { memberId } = useParams()
    const navigate = useNavigate()

    const [membershipData, setMembershipData] = useState<MembershipResponse | null>(null)
    const [memberProfile, setMemberProfile] = useState<MemberSummaryResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [errorOccurred, setErrorOccurred] = useState(false)
    const [isManagementMode, setIsManagementMode] = useState(false)
    const [editingTeamMemberId, setEditingTeamMemberId] = useState<number | null>(null)
    const [searchInput, setSearchInput] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [selectedRole, setSelectedRole] = useState('ALL')
    const [selectedStatus, setSelectedStatus] = useState('ACTIVE')
    const [isBannerDismissed, setIsBannerDismissed] = useState(false)

    const isPrivileged = hasRole('ROLE_ADMIN') || hasRole('ROLE_COACH')

    const fetchData = useCallback(async () => {
        if (!memberId) return
        setLoading(true)
        try {
            const [profileRes, membershipsRes] = await Promise.all([
                getMemberProfileById(Number(memberId)),
                getMemberMemberships(Number(memberId))
            ])
            setMemberProfile(profileRes)

            const enriched = await Promise.all(
                membershipsRes.content.map(async (m) => {
                    try {
                        const mRes = await getMatchesByTeamId(m.teamId)
                        return { ...m, matches: mRes.content || [] }
                    } catch (e) { return { ...m, matches: [] } }
                })
            )
            setMembershipData({ ...membershipsRes, content: enriched })
        } catch (err: any) {
            setErrorOccurred(true)
            toast.error(`Błąd: ${err.message}`)
        } finally { setLoading(false) }
    }, [memberId])

    useEffect(() => { fetchData() }, [fetchData])

    const filteredContent = useMemo(() => {
        if (!membershipData?.content) return []
        return membershipData.content.filter(item => {
            const statusMatch = selectedStatus === 'ALL' || item.status === selectedStatus
            const roleMatch = selectedRole === 'ALL' || item.roles.includes(selectedRole)
            const searchMatch = !appliedSearch || item.teamName?.toLowerCase().includes(appliedSearch.toLowerCase())

            if (!isPrivileged) return item.status === 'ACTIVE' && roleMatch && searchMatch
            return statusMatch && roleMatch && searchMatch
        })
    }, [membershipData, isPrivileged, selectedStatus, selectedRole, appliedSearch])

    const pendingMembershipsCount = useMemo(() => {
        if (!membershipData?.content) return 0
        return membershipData.content.filter(item => item.status === 'WAITING_FOR_VERIFICATION').length
    }, [membershipData])

    // Wyciągamy unikalne role ze wszystkich zespołów
    const allUniqueRoles = useMemo(() => {
        if (!membershipData?.content) return []
        const roleSet = new Set<string>()
        membershipData.content.forEach(m => m.roles.forEach(r => roleSet.add(r)))
        return Array.from(roleSet)
    }, [membershipData])

    // Sprawdzamy czy jest trenerem (dla złotego bordera)
    const isCoach = useMemo(() => {
        return allUniqueRoles.some(r => r === 'ROLE_TEAM_HEAD_COACH' || r === 'ROLE_TEAM_ASSISTANT_COACH')
    }, [allUniqueRoles])

    const handleUpdateMember = async (payload: ManageTeamMemberRequest) => {
        try {
            await updateTeamMember(payload)
            toast.success(`Zaktualizowano dane`)
            setEditingTeamMemberId(null)
            fetchData()
        } catch(e) { toast.error("Błąd zapisu danych") }
    }

    if (loading) return <LoadingState />
    if (errorOccurred || !memberProfile || !membershipData) return <ErrorState navigate={navigate} />

    const initials = `${memberProfile.firstName?.[0] ?? ''}${memberProfile.lastName?.[0] ?? ''}`.toUpperCase()

    return (
        <div className="min-h-screen bg-background pb-10">
            <header className="border-b bg-[#091021] sticky top-0 z-50 shadow-sm">
                <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <img src="/favicon.png" alt="Logo" className="h-8 w-8"/>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Szczegóły Członkostwa</h1>
                    </div>
                    <div className="flex gap-2 items-center">
                        {isPrivileged && (
                            <Button
                                variant={isManagementMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIsManagementMode(!isManagementMode)}
                                className={cn("transition-all", isManagementMode && "bg-blue-600 hover:bg-blue-700")}
                            >
                                <Settings2 className="mr-2 h-4 w-4"/>
                                {isManagementMode ? 'Zakończ Zarządzanie' : 'Zarządzaj'}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft
                            className="h-4 w-4 mr-2"/> Wróć</Button>
                    </div>
                </div>
            </header>

            <main className="container py-8 px-4 max-w-7xl mx-auto space-y-8">
                {pendingMembershipsCount > 0 && !isBannerDismissed && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 relative animate-in slide-in-from-top-2">
                        <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-800">Wymagana weryfikacja</h3>
                            <p className="text-sm text-blue-700">Użytkownik oczekuje na zatwierdzenie w <span className="font-bold">{pendingMembershipsCount}</span> zespołach.</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsBannerDismissed(true)}><X className="h-4 w-4" /></Button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="text-center pb-2 bg-muted/20 border-b">
                                    <div className="mx-auto mb-4 relative w-40 h-40">
                                        <div className={cn("absolute inset-0 rounded-full m-1 opacity-20", isCoach ? "bg-yellow-500 blur-md animate-pulse" : "bg-transparent")}></div>
                                        <Avatar className={cn("h-full w-full border-4 shadow-xl relative z-10", isCoach ? "border-yellow-500" : "border-slate-800")}>
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${initials}`} />
                                            <AvatarFallback className="text-5xl">{initials}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                                        {memberProfile.firstName} {memberProfile.lastName}
                                        {isCoach && <Medal className="h-6 w-6 text-yellow-500 shrink-0" />}
                                    </CardTitle>

                                    <div className="flex flex-col items-center gap-3 mt-3">
                                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                                            <CalendarDays className="h-4 w-4" /> Dołączył: {formatDate(memberProfile.joinDate)}
                                        </p>
                                        {/* Plakietki ról pod datą */}
                                        <div className="flex flex-wrap justify-center gap-1.5 px-2">
                                            {allUniqueRoles.map(role => {
                                                const cfg = ROLE_CONFIG[role] || DEFAULT_ROLE_CONFIG
                                                const Icon = cfg.icon
                                                return (
                                                    <Badge key={role} variant="outline" className={cn("gap-1 text-[10px] px-1.5 py-0.5", cfg.className)}>
                                                        <Icon className="h-3 w-3" />
                                                        {cfg.label}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <StatRow icon={User} label="Wiek" value={memberProfile.age} unit="lat" />
                                    <StatRow icon={Ruler} label="Wzrost" value={memberProfile.height} unit="cm" />
                                    <StatRow icon={Weight} label="Waga" value={memberProfile.weight} unit="kg" />
                                </CardContent>
                            </Card>
                        </div>
                    </aside>

                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Szukaj zespołu..." className="pl-9" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setAppliedSearch(searchInput)} />
                            </div>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="w-[160px]"><Filter className="h-3.5 w-3.5 mr-2"/><SelectValue placeholder="Rola" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Wszystkie Role</SelectItem>
                                    {Object.entries(ROLE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-[160px]"><CircleDot className="h-3.5 w-3.5 mr-2"/><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    {STATUS_FILTER_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredContent.map(item => (
                                <MembershipCard
                                    key={item.teamMemberId}
                                    item={item}
                                    isEditing={editingTeamMemberId === item.teamMemberId}
                                    isManagementMode={isManagementMode}
                                    onEditStart={() => setEditingTeamMemberId(item.teamMemberId)}
                                    onEditCancel={() => setEditingTeamMemberId(null)}
                                    onSave={handleUpdateMember}
                                    onDelete={() => removeTeamMember(item.teamMemberId).then(() => fetchData())}
                                    onApprove={() => approveTeamMember(item.teamMemberId).then(() => fetchData())}
                                    onViewTeam={() => navigate(`/team-details/${item.teamId}`)}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

function MembershipCard({ item, isEditing, isManagementMode, onEditStart, onEditCancel, onSave, onDelete, onApprove, onViewTeam }: any) {
    const [isMatchesExpanded, setIsMatchesExpanded] = useState(false)
    const navigate = useNavigate()

    const [editNumber, setEditNumber] = useState(item.number || '')
    const [editPosition, setEditPosition] = useState(item.fieldPosition || 'NO_POSITION')
    const [currentRoles, setCurrentRoles] = useState<string[]>(item.roles || [])

    useEffect(() => {
        if (isEditing) {
            setEditNumber(item.number || '')
            setEditPosition(item.fieldPosition || 'NO_POSITION')
            setCurrentRoles(item.roles || [])
        }
    }, [isEditing, item])

    const toggleRole = (role: string) => {
        if (currentRoles.includes(role)) setCurrentRoles(currentRoles.filter(r => r !== role))
        else setCurrentRoles([...currentRoles, role])
    }

    const matches = item.matches || [];
    const relevantMatches = matches.filter((m: any) => ['SCHEDULED', 'POSTPONED', 'LIVE'].includes(m.status))
        .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
        .slice(0, 5);

    const liveMatch = relevantMatches.find((m: any) => m.status === 'LIVE');

    const handleMatchesClick = () => {
        if (relevantMatches.length === 0) {
            toast.info("Brak meczy do wyświetlenia");
            return;
        }
        setIsMatchesExpanded(!isMatchesExpanded);
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { stripe: 'bg-emerald-500', badge: 'bg-emerald-900/50 text-emerald-200 border-emerald-700/50', label: 'Aktywny' };
            case 'REJECTED': return { stripe: 'bg-red-600', badge: 'bg-red-900/50 text-red-200 border-red-700/50', label: 'Odrzucony' };
            case 'ARCHIVED': return { stripe: 'bg-slate-500', badge: 'bg-slate-800/50 text-slate-400 border-slate-700/50', label: 'Zarchiwizowany' };
            default: return { stripe: 'bg-blue-500', badge: 'bg-blue-900/50 text-blue-200 border-blue-700/50', label: 'Oczekujący' };
        }
    }
    const theme = getStatusTheme(item.status);

    const getTeamLogo = (team: any) => {
        if (team.internal) return '/favicon.png';
        return team.logoUrl || null;
    }

    const getTeamInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    return (
        <Card className={cn(
            "group relative rounded-xl bg-[#0f172a] text-slate-100 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-800 overflow-hidden",
            isEditing && "ring-2 ring-blue-500 border-blue-500"
        )}>
            {/* PASEK STANU - 60% WYSOKOŚCI, WYŚRODKOWANY */}
            <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[60%] rounded-r-sm z-10 transition-all", theme.stripe)} />

            <CardContent className="p-0 flex flex-col">
                <div className="flex flex-col md:flex-row flex-1 pl-2">
                    <div className="flex-1 p-5 pl-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white leading-tight truncate">
                                    {item.teamName}
                                </h3>
                                <Badge variant="secondary" className="bg-slate-800 text-slate-400 hover:bg-slate-700">
                                    ID: {item.teamId}
                                </Badge>
                            </div>

                            {!isEditing && (
                                <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border", theme.badge)}>
                                    {theme.label}
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-[80px_1fr_auto] gap-4 items-center max-w-full">
                            <div className={cn("p-3 rounded-lg border flex items-center gap-2", isEditing ? "bg-slate-800 border-blue-500" : "bg-slate-900/50 border-slate-800")}>
                                <div className="p-1.5 bg-slate-800 rounded-md shrink-0"><Shirt className="h-3.5 w-3.5 text-emerald-400" /></div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 leading-none">NR</p>
                                    {isEditing ? (
                                        <Input className="h-6 p-0 border-0 bg-transparent text-xs font-mono font-bold focus-visible:ring-0" type="number" value={editNumber} onChange={e => setEditNumber(e.target.value)} />
                                    ) : <p className="text-sm font-mono font-bold text-white">#{item.number ?? '--'}</p>}
                                </div>
                            </div>

                            <div className={cn("p-3 rounded-lg border flex items-center gap-3", isEditing ? "bg-slate-800 border-blue-500" : "bg-slate-900/50 border-slate-800")}>
                                <div className="p-1.5 bg-slate-800 rounded-md shrink-0"><User className="h-3.5 w-3.5 text-blue-400" /></div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 leading-none">Pozycja</p>
                                    {isEditing ? (
                                        <Select value={editPosition} onValueChange={setEditPosition}>
                                            <SelectTrigger className="h-6 p-0 border-0 bg-transparent text-xs font-semibold focus:ring-0"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(FIELD_POSITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : <p className="text-sm font-semibold truncate">{FIELD_POSITION_LABELS[item.fieldPosition] || item.fieldPosition}</p>}
                                </div>
                            </div>

                            {!isEditing && (
                                <Button
                                    variant="ghost" size="sm"
                                    className={cn("h-12 px-4 rounded-lg flex flex-col gap-1 items-center justify-center border border-slate-800 hover:bg-slate-800/50",
                                        isMatchesExpanded ? "bg-slate-800 border-emerald-500/50 text-emerald-400" : "text-slate-500",
                                        liveMatch ? "bg-red-950/20 text-red-500 border-red-900/50" : (relevantMatches.length > 0 && !isMatchesExpanded ? "text-emerald-400" : ""))}
                                    onClick={handleMatchesClick}
                                >
                                    {liveMatch ? <CircleDot className="h-4 w-4 animate-pulse" /> : <CalendarClock className="h-4 w-4" />}
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Mecze: {matches.length}</span>
                                    {isMatchesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                            )}
                        </div>

                        {/* RENDEROWANIE RÓL */}
                        <div className="flex flex-col gap-2">
                            {/* PRZYPISANE ROLE */}
                            <div className="flex flex-wrap gap-2">
                                {(isEditing ? currentRoles : item.roles).map((r: string) => {
                                    const cfg = ROLE_CONFIG[r] || DEFAULT_ROLE_CONFIG;
                                    const Icon = cfg.icon;
                                    return (
                                        <Badge
                                            key={r}
                                            onClick={isEditing ? () => toggleRole(r) : undefined}
                                            className={cn("gap-1.5 px-2 py-1 text-[10px] font-semibold border transition-all", cfg.className, isEditing && "cursor-pointer hover:opacity-75")}
                                        >
                                            <Icon className="h-3 w-3" /> {cfg.label} {isEditing && <XCircle className="h-3 w-3 ml-1" />}
                                        </Badge>
                                    )
                                })}
                            </div>

                            {/* DOSTĘPNE ROLE DO DODANIA (TYLKO W TRYBIE EDYCJI) */}
                            {isEditing && (
                                <div className="flex flex-wrap gap-1 mt-2 border-t border-dashed border-slate-700 pt-2 animate-in fade-in">
                                    <p className="w-full text-[10px] font-semibold text-slate-500 uppercase mb-1">Dodaj rolę:</p>
                                    {AVAILABLE_ROLES.filter(r => !currentRoles.includes(r)).map(r => {
                                        const cfg = ROLE_CONFIG[r] || DEFAULT_ROLE_CONFIG;
                                        return (
                                            <Badge
                                                key={r}
                                                onClick={() => toggleRole(r)}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors px-1.5 py-0.5 text-[10px] border-slate-700 text-slate-400"
                                            >
                                                {cfg.label} <PlusCircle className="h-2.5 w-2.5 ml-1" />
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PASEK AKCJI */}
                    <div className="bg-slate-900/20 border-l border-slate-800 min-w-[56px] flex flex-col items-center py-4 justify-center">
                        <div className="flex flex-col gap-4">
                            {isEditing ? (
                                <>
                                    <Button size="icon" variant="ghost" className="text-emerald-500 hover:bg-emerald-500/10" onClick={() => onSave({
                                        teamMemberId: item.teamMemberId,
                                        status: item.status,
                                        newFieldPosition: editPosition,
                                        number: Number(editNumber),
                                        newRoles: currentRoles.filter(r => !item.roles.includes(r)),
                                        removedRoles: item.roles.filter((r: string) => !currentRoles.includes(r))
                                    })}><Save className="h-5 w-5" /></Button>
                                    <Button size="icon" variant="ghost" className="text-slate-400 hover:bg-white/10" onClick={onEditCancel}><X className="h-5 w-5" /></Button>
                                </>
                            ) : (
                                <>
                                    <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={onViewTeam}><Eye className="h-5 w-5" /></Button>
                                    {isManagementMode && (
                                        <>
                                            {(item.status === 'WAITING_FOR_VERIFICATION' || item.status === 'PENDING') && (
                                                <Button size="icon" variant="ghost" className="text-emerald-500 hover:bg-emerald-500/10" onClick={onApprove}><Check className="h-5 w-5" /></Button>
                                            )}
                                            <Button size="icon" variant="ghost" className="text-blue-400 hover:bg-blue-400/10" onClick={onEditStart}><Settings2 className="h-5 w-5" /></Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={onDelete}><Trash2 className="h-5 w-5" /></Button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEKCJA ROZWIJANA - MECZE */}
                {isMatchesExpanded && !isEditing && (
                    <div className="border-t border-slate-800 bg-slate-950/30 p-4 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">
                            <Timer className="h-3 w-3 text-emerald-500" />
                            Najbliższe mecze
                        </div>
                        <div className="grid gap-2">
                            {relevantMatches.map((m: any) => {
                                const isHomeGame = m.homeTeam.id === item.teamId;
                                const homeLogo = getTeamLogo(m.homeTeam);
                                const awayLogo = getTeamLogo(m.awayTeam);

                                return (
                                    <div key={m.matchId} className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all group/match">
                                        {/* IKONA TYPU MECZU */}
                                        <div className="flex items-center justify-center w-10 border-r border-slate-800 mr-2 pr-2">
                                            {isHomeGame ? (
                                                <div className="flex flex-col items-center text-emerald-500" title="Mecz domowy">
                                                    <House className="h-4 w-4 mb-1" />
                                                    <span className="text-[8px] font-bold uppercase">Dom</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-orange-500" title="Mecz wyjazdowy">
                                                    <Plane className="h-4 w-4 mb-1" />
                                                    <span className="text-[8px] font-bold uppercase">Wyjazd</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
                                            <div className="flex items-center justify-end gap-2 overflow-hidden">
                                                <span className={cn("text-right truncate font-bold", m.homeTeam.internal ? "text-emerald-400" : "text-white")}>
                                                    {m.homeTeam.name}
                                                </span>
                                                <Avatar className="h-6 w-6 bg-transparent shrink-0">
                                                    <AvatarImage src={homeLogo || undefined} className="object-contain" />
                                                    <AvatarFallback className="text-[8px] bg-slate-800 text-slate-400">{getTeamInitials(m.homeTeam.name)}</AvatarFallback>
                                                </Avatar>
                                            </div>

                                            <div className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-500 font-bold">VS</div>

                                            <div className="flex items-center justify-start gap-2 overflow-hidden">
                                                <Avatar className="h-6 w-6 bg-transparent shrink-0">
                                                    <AvatarImage src={awayLogo || undefined} className="object-contain" />
                                                    <AvatarFallback className="text-[8px] bg-slate-800 text-slate-400">{getTeamInitials(m.awayTeam.name)}</AvatarFallback>
                                                </Avatar>
                                                <span className={cn("text-left truncate font-bold", m.awayTeam.internal ? "text-emerald-400" : "text-white")}>
                                                    {m.awayTeam.name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-800">
                                            <div className="text-[10px] text-right hidden sm:block">
                                                <p className="font-bold text-slate-300">{new Date(m.matchDate).toLocaleDateString()}</p>
                                                <p className="text-slate-600">{new Date(m.matchDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-full bg-slate-800 group-hover/match:bg-emerald-500 group-hover/match:text-white transition-colors"
                                                onClick={() => navigate(`/matches/${m.matchId}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {relevantMatches.length === 0 && (
                                <div className="text-center text-xs text-slate-500 py-2">Brak nadchodzących spotkań</div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function StatRow({ icon: Icon, label, value, unit }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-full shadow-sm"><Icon className="h-4 w-4 text-primary" /></div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <span className="text-lg font-bold">{value ?? '--'} {unit}</span>
        </div>
    )
}

function LoadingState() {
    return <div className="flex items-center justify-center min-h-screen bg-[#0f172a]"><CircleDot className="animate-spin h-10 w-10 text-emerald-500" /></div>
}

function ErrorState({ navigate }: any) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0f172a] text-white">
            <h2 className="text-xl font-bold text-red-500">Błąd ładowania danych</h2>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-slate-700 text-slate-300">Wróć do Dashboardu</Button>
        </div>
    )
}

