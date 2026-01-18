import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx'
import {
    ArrowLeft,
    CalendarDays,
    Shield,
    X,
    Pencil,
    Trash2,
    Save,
    User,
    Shirt,
    Clock,
    House,
    Plane,
    CircleDot
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
import { useNavigate, useParams } from 'react-router-dom'
import {
    getMatchById,
    updateMatch,
    deleteMatch,
    statusToLabel,
    type MatchResponse,
    type MatchTeamData,
    type MatchMember,
    type MatchStatus,
    type UpdateMatchRequest
} from '@/lib/matchesApi.ts'
import { cn } from '@/lib/utils.ts'
import { toast } from 'sonner'
import { hasRole } from '@/lib/auth.ts'

export function MatchDetailsPage() {
    const { matchId } = useParams()
    const navigate = useNavigate()

    // --- STAN DANYCH ---
    const [match, setMatch] = useState<MatchResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // --- STAN UI ---
    const [selectedPlayer, setSelectedPlayer] = useState<MatchMember | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // --- STAN FORMULARZA EDYCJI ---
    // Użytkownik edytuje "Gospodarz" i "Gość", ale wysyłamy "Internal" i "External"
    const [editForm, setEditForm] = useState<{
        date: string
        time: string
        status: MatchStatus
        homeScore: string
        awayScore: string
    }>({
        date: '', time: '', status: 'SCHEDULED', homeScore: '0', awayScore: '0'
    })

    // Uprawnienia
    const canManage = hasRole('ROLE_COACH') || hasRole('ROLE_ADMIN') || hasRole('ADMIN')

    useEffect(() => {
        if (matchId) {
            fetchMatch()
        }
    }, [matchId])

    const fetchMatch = () => {
        setLoading(true)
        getMatchById(Number(matchId))
            .then(data => {
                setMatch(data)

                // Konwersja daty z ISO
                const d = new Date(data.matchDate)
                const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
                const timeStr = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }).slice(0, 5) // HH:MM

                setEditForm({
                    date: dateStr,
                    time: timeStr,
                    status: data.status,
                    homeScore: data.homeTeamScore !== null ? String(data.homeTeamScore) : '0',
                    awayScore: data.awayTeamScore !== null ? String(data.awayTeamScore) : '0'
                })
            })
            .catch(e => setError(String(e?.message || "Nie udało się pobrać meczu")))
            .finally(() => setLoading(false))
    }

    // --- HANDLERS ---

    const handleDelete = async () => {
        if (!confirm('Usunąć ten mecz trwale?')) return

        setIsSaving(true)
        try {
            await deleteMatch(Number(matchId))
            toast.success('Mecz usunięty')
            navigate('/matches')
        } catch (e: any) {
            toast.error('Błąd usuwania', { description: e.message })
            setIsSaving(false)
        }
    }

    const handleSave = async () => {
        if (!match) return
        setIsSaving(true)

        try {
            // 1. LOGIKA DATY
            const formDateStr = `${editForm.date}T${editForm.time}`
            const formDateObj = new Date(formDateStr)
            const originalDateObj = new Date(match.matchDate)

            formDateObj.setSeconds(0, 0)
            originalDateObj.setSeconds(0, 0)
            const hasDateChanged = formDateObj.getTime() !== originalDateObj.getTime()

            // 2. PARSOWANIE WYNIKÓW Z UI (HOME vs AWAY)
            const homeScoreInt = parseInt(editForm.homeScore, 10)
            const awayScoreInt = parseInt(editForm.awayScore, 10)

            // 3. MAPOWANIE NA INTERNAL / EXTERNAL (Kluczowy moment!)
            const isHomeInternal = match.homeTeam.isInternal

            // Jeśli nasz zespół (Internal) gra jako Gospodarz:
            // InternalScore = wynik gospodarza (homeScore)
            // ExternalScore = wynik gościa (awayScore)
            // isHome = true

            // Jeśli nasz zespół (Internal) gra jako Gość:
            // InternalScore = wynik gościa (awayScore)
            // ExternalScore = wynik gospodarza (homeScore)
            // isHome = false

            const internalScore = isHomeInternal ? homeScoreInt : awayScoreInt
            const externalScore = isHomeInternal ? awayScoreInt : homeScoreInt

            // 4. BUDOWANIE PAYLOADU
            const payload: UpdateMatchRequest = {
                matchDate: hasDateChanged ? new Date(formDateStr).toISOString() : undefined,
                status: editForm.status,
                isHome: isHomeInternal, // Informujemy backend, czy internal grał u siebie
                internalTeamScore: isNaN(internalScore) ? 0 : internalScore,
                externalTeamScore: isNaN(externalScore) ? 0 : externalScore,
            }

            const updatedMatch = await updateMatch(Number(matchId), payload)

            setMatch(updatedMatch)
            setIsEditing(false)
            toast.success('Mecz zaktualizowany')
        } catch (e: any) {
            console.error(e)
            toast.error('Błąd aktualizacji', { description: e.message })
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-emerald-500"><CircleDot className="animate-spin h-10 w-10" /></div>
    if (error) return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-red-500 font-bold">{error}</div>
    if (!match) return null

    // UI LOGIKA
    const isLive = match.status === 'LIVE'
    const showScore = match.status === 'FINISHED' || isLive || isEditing || match.status === 'POSTPONED' || match.status === 'CANCELLED'

    const dateObj = new Date(match.matchDate)
    const dateDisplay = dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    const timeDisplay = dateObj.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    // KOLORY PASKA
    let stripeColor = 'bg-blue-500' // Scheduled
    if (isLive) stripeColor = 'bg-green-500 animate-pulse'
    else if (match.status === 'FINISHED') {
        if (match.homeTeamScore > match.awayTeamScore) stripeColor = 'bg-emerald-500'
        else if (match.homeTeamScore < match.awayTeamScore) stripeColor = 'bg-red-500'
        else stripeColor = 'bg-slate-400'
    } else if (match.status === 'POSTPONED') stripeColor = 'bg-yellow-500'
    else if (match.status === 'CANCELLED') stripeColor = 'bg-orange-500'

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col font-sans relative pb-20">
            {/* HEADER */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm bg-[#0f172a]">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-lg bg-white p-1 border shadow-sm cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <img src="/favicon.png" alt="Club Logo" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Centrum Meczowe</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Zarządzanie rozgrywkami</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                    </Button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">

                {/* KARTA MECZU */}
                <Card className={cn(
                    "bg-[#0f172a] text-slate-100 shadow-lg overflow-hidden relative transition-all duration-300",
                    isEditing ? "border-2 border-blue-500 ring-4 ring-blue-500/20" : "border-slate-800"
                )}>
                    {/* Pasek statusu */}
                    <div className={cn("absolute top-0 left-0 right-0 h-1.5 z-10", stripeColor)} />

                    {/* Akcje */}
                    {canManage && (
                        <div className="absolute top-4 right-4 flex gap-2 z-20">
                            {isEditing ? (
                                <>
                                    <Button size="sm" variant="destructive" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                        <X className="h-4 w-4 mr-2" /> Anuluj
                                    </Button>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={isSaving}>
                                        <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Zapis...' : 'Zapisz'}
                                    </Button>
                                </>
                            ) : (
                                <div className="flex gap-2 p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-lg">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:bg-blue-500/20" onClick={() => setIsEditing(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/20" onClick={handleDelete}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <CardContent className="p-8 pt-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">

                            {/* GOSPODARZ */}
                            <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right gap-4">
                                <TeamLogoLarge team={match.homeTeam} />
                                <div>
                                    <h2 className={cn("text-3xl font-bold leading-none tracking-tight uppercase", match.homeTeam?.isInternal && "text-emerald-400")}>
                                        {match.homeTeam?.name}
                                    </h2>
                                    <Badge className="mt-2 bg-emerald-900/40 text-emerald-200 border-emerald-700/50 hover:bg-emerald-900/60 flex w-fit ml-auto mr-auto md:mr-0 gap-1">
                                        <House className="h-3 w-3" /> GOSPODARZ
                                    </Badge>
                                </div>
                            </div>

                            {/* WYNIK / VS / EDYCJA */}
                            <div className="flex flex-col items-center justify-center min-w-[260px] gap-4 z-10">
                                {isEditing ? (
                                    <div className="flex flex-col gap-3 w-full bg-slate-900/90 p-5 rounded-xl border border-slate-600 shadow-2xl animate-in fade-in zoom-in-95">
                                        <div className="flex items-center gap-3 justify-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Dom</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="text-center text-xl font-bold h-12 w-20 bg-slate-800 border-slate-600 text-white focus:ring-blue-500"
                                                    value={editForm.homeScore}
                                                    onChange={(e) => setEditForm({...editForm, homeScore: e.target.value})}
                                                />
                                            </div>
                                            <span className="text-slate-500 font-bold text-2xl pt-4">:</span>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Wyjazd</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="text-center text-xl font-bold h-12 w-20 bg-slate-800 border-slate-600 text-white focus:ring-blue-500"
                                                    value={editForm.awayScore}
                                                    onChange={(e) => setEditForm({...editForm, awayScore: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <Select
                                            value={editForm.status}
                                            onValueChange={(val) => setEditForm({...editForm, status: val as MatchStatus})}
                                        >
                                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SCHEDULED">Zaplanowany</SelectItem>
                                                <SelectItem value="PLANNED">Planowany</SelectItem>
                                                <SelectItem value="LIVE">Na żywo</SelectItem>
                                                <SelectItem value="FINISHED">Zakończony</SelectItem>
                                                <SelectItem value="POSTPONED">Przełożony</SelectItem>
                                                <SelectItem value="CANCELLED">Odwołany</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="date"
                                                className="bg-slate-800 border-slate-600 text-white text-xs px-2 h-9"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                            />
                                            <Input
                                                type="time"
                                                className="bg-slate-800 border-slate-600 text-white text-xs px-2 h-9"
                                                value={editForm.time}
                                                onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Badge variant="outline" className={cn("border-slate-600 text-slate-300 uppercase tracking-widest px-3 py-1 bg-slate-900/50 backdrop-blur-sm")}>
                                            {statusToLabel(match.status)}
                                        </Badge>

                                        {showScore ? (
                                            <div className="text-7xl font-black tracking-tighter tabular-nums flex items-center gap-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                                <span>{match.homeTeamScore}</span>
                                                <span className="text-slate-600 pb-2">:</span>
                                                <span>{match.awayTeamScore}</span>
                                            </div>
                                        ) : (
                                            <div className="text-6xl font-black text-slate-700 py-2 tracking-tighter">VS</div>
                                        )}

                                        <div className="flex items-center text-sm font-medium text-slate-300 bg-slate-800/80 px-5 py-2 rounded-full border border-slate-700 shadow-inner">
                                            <CalendarDays className="h-4 w-4 mr-2 text-blue-400" />
                                            {dateDisplay}
                                            <span className="mx-2 text-slate-600">|</span>
                                            <Clock className="h-4 w-4 mr-2 text-blue-400" />
                                            {timeDisplay}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* GOŚĆ */}
                            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4">
                                <TeamLogoLarge team={match.awayTeam} />
                                <div>
                                    <h2 className={cn("text-3xl font-bold leading-none tracking-tight uppercase", match.awayTeam?.isInternal && "text-emerald-400")}>
                                        {match.awayTeam?.name}
                                    </h2>
                                    <Badge className="mt-2 bg-amber-900/40 text-amber-200 border-amber-700/50 hover:bg-amber-900/60 flex w-fit ml-auto mr-auto md:ml-0 gap-1">
                                        <Plane className="h-3 w-3" /> GOŚĆ
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SKŁADY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-8">
                    <TeamSquadPanel
                        team={match.homeTeam}
                        title="Skład Gospodarzy"
                        onPlayerClick={setSelectedPlayer}
                    />
                    <TeamSquadPanel
                        team={match.awayTeam}
                        title="Skład Gości"
                        onPlayerClick={setSelectedPlayer}
                    />
                </div>
            </main>

            {/* MODAL ZAWODNIKA */}
            {selectedPlayer && (
                <PlayerDetailsModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    )
}

function TeamSquadPanel({ team, title, onPlayerClick }: { team: MatchTeamData, title: string, onPlayerClick: (p: MatchMember) => void }) {
    const isInternal = team.isInternal
    const members = team.squad || []
    const sortedMembers = [...members].sort((a, b) => (a.number || 99) - (b.number || 99))

    return (
        <Card className="h-full border-slate-800 shadow-md bg-[#0f172a] text-slate-100">
            <CardHeader className={cn("border-b border-slate-800 pb-4", isInternal ? "bg-emerald-950/10" : "bg-amber-950/10")}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TeamLogoSmall team={team} />
                        <div>
                            <h3 className="font-bold text-lg text-slate-100">{title}</h3>
                            <p className="text-xs text-slate-400">{isInternal ? 'Kadra klubu' : 'Dane z bazy zewnętrznej'}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-300">{members.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {members.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                        <div className="p-3 bg-slate-900 rounded-full"><User className="h-6 w-6 opacity-30" /></div>
                        <span className="text-sm">Brak danych o składzie.</span>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/60">
                        {sortedMembers.map((player) => (
                            <PlayerRow key={player.teamMemberId || player.memberId} player={player} onClick={() => onPlayerClick(player)} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PlayerRow({ player, onClick }: { player: MatchMember, onClick: () => void }) {
    const initials = `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`.toUpperCase()
    return (
        <div onClick={onClick} className="flex items-center justify-between p-3 px-4 hover:bg-slate-800/50 transition-colors group cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 font-mono font-bold text-sm bg-slate-900 text-slate-400 rounded group-hover:bg-slate-700 group-hover:text-white transition-all border border-slate-800 group-hover:border-slate-600">
                    {player.number || '-'}
                </div>
                <Avatar className="h-10 w-10 border border-slate-700 shadow-sm">
                    <AvatarImage src={player.logoUrl} alt={player.firstName} className="object-cover" />
                    <AvatarFallback className="text-xs font-medium bg-slate-800 text-slate-400">{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium text-sm text-slate-200 group-hover:text-emerald-400 transition-colors">{player.firstName} {player.lastName}</div>
                    <div className="text-xs text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
                        <Shirt className="h-3 w-3 opacity-70" /> {player.fieldPosition ? player.fieldPosition.toLowerCase().replace('_', ' ') : '—'}
                    </div>
                </div>
            </div>
            {player.roles && player.roles.includes('CAPTAIN') && (
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-[10px] font-bold border border-yellow-500/40 shadow-sm" title="Kapitan">C</div>
            )}
        </div>
    )
}

function PlayerDetailsModal({ player, onClose }: { player: MatchMember, onClose: () => void }) {
    const initials = `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`.toUpperCase()
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-slate-400 hover:text-white hover:bg-white/10 z-10 rounded-full" onClick={onClose}><X className="h-5 w-5" /></Button>
                <div className="flex flex-col items-center pt-10 pb-8 px-6 text-center text-slate-100">
                    <div className="relative mb-6">
                        <Avatar className="h-32 w-32 border-4 border-slate-700 shadow-xl">
                            <AvatarImage src={player.logoUrl} alt={player.firstName} className="object-cover" />
                            <AvatarFallback className="text-3xl font-bold bg-slate-800 text-slate-400">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white font-black text-lg w-10 h-10 flex items-center justify-center rounded-full border-4 border-[#0f172a] shadow-md">{player.number || '-'}</div>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{player.firstName} {player.lastName}</h2>
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600">{player.fieldPosition ? player.fieldPosition.replace('_', ' ') : 'Pozycja nieznana'}</Badge>
                        {player.roles && player.roles.includes('CAPTAIN') && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30">Kapitan</Badge>}
                    </div>
                    <div className="w-full grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Status</span>
                            <span className="font-medium text-emerald-400">{player.status || 'Aktywny'}</span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Rola</span>
                            <span className="font-medium truncate block">{player.roles && player.roles.length > 0 ? player.roles.join(', ') : 'Zawodnik'}</span>
                        </div>
                    </div>
                    <div className="mt-8 w-full"><Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200" onClick={onClose}>Zamknij</Button></div>
                </div>
            </div>
        </div>
    )
}

function TeamLogoLarge({ team }: { team: MatchTeamData }) {
    const src = team.isInternal ? '/favicon.png' : (team.logoUrl || null)
    return (
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-slate-700 bg-white flex items-center justify-center shadow-2xl p-3">
            {src ? <img src={src} alt={team.name} className="h-full w-full object-contain" /> : <Shield className="h-12 w-12 text-slate-300" />}
        </div>
    )
}

function TeamLogoSmall({ team }: { team: MatchTeamData }) {
    const src = team.isInternal ? '/favicon.png' : (team.logoUrl || null)
    return (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-white flex items-center justify-center shadow-sm p-1">
            {src ? <img src={src} alt={team.name} className="h-full w-full object-contain" /> : <Shield className="h-5 w-5 text-muted-foreground/30" />}
        </div>
    )
}