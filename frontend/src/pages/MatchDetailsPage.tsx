import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    ArrowLeft,
    CalendarDays,
    Shield,
    Shirt,
    User,
    X
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMatchById, statusToLabel, type MatchResponse, type MatchTeamData, type MatchMember } from '@/lib/matchesApi'
import { cn } from '@/lib/utils'

export function MatchDetailsPage() {
    const { matchId } = useParams()
    const navigate = useNavigate()
    const [match, setMatch] = useState<MatchResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Stan dla modala zawodnika
    const [selectedPlayer, setSelectedPlayer] = useState<MatchMember | null>(null)

    useEffect(() => {
        if (matchId) {
            setLoading(true)
            getMatchById(Number(matchId))
                .then(setMatch)
                .catch(e => setError(String(e?.message || e)))
                .finally(() => setLoading(false))
        }
    }, [matchId])

    if (loading) return <div className="p-8 text-center text-muted-foreground">Ładowanie szczegółów meczu...</div>
    if (error) return <div className="p-8 text-center text-destructive">Błąd: {error}</div>
    if (!match) return null

    const isLive = match.status === 'LIVE'
    const showScore = match.status === 'FINISHED' || isLive

    const dateObj = new Date(match.matchDate)
    const dateStr = dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    const timeStr = dateObj.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col font-sans relative">
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm">
                <div className="container flex h-16 items-center gap-4 px-4 md:px-8 max-w-7xl mx-auto">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/matches')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                    </Button>
                    <h1 className="text-lg font-semibold tracking-tight">Szczegóły spotkania</h1>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">

                {/* --- KARTA GŁÓWNA --- */}
                <Card className="bg-[#0f172a] text-slate-100 border-slate-800 shadow-lg overflow-hidden relative">
                    <div className={cn("absolute top-0 left-0 right-0 h-1",
                        isLive ? "bg-green-500 animate-pulse" :
                            match.status === 'FINISHED' ? "bg-slate-500" :
                                "bg-blue-500"
                    )} />

                    <CardContent className="p-8 pt-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            {/* GOSPODARZ */}
                            <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right gap-4">
                                <TeamLogoLarge team={match.homeTeam} />
                                <div>
                                    <h2 className={cn("text-3xl font-bold leading-none tracking-tight", match.homeTeam?.isInternal && "text-emerald-400")}>
                                        {match.homeTeam?.name}
                                    </h2>
                                    <Badge className="mt-3 bg-emerald-900/40 text-emerald-200 border-emerald-700/50 hover:bg-emerald-900/60">
                                        GOSPODARZ
                                    </Badge>
                                </div>
                            </div>

                            {/* WYNIK */}
                            <div className="flex flex-col items-center justify-center min-w-[200px] gap-4">
                                <Badge variant="outline" className="border-slate-600 text-slate-400 uppercase tracking-widest px-3">
                                    {statusToLabel(match.status)}
                                </Badge>

                                {showScore ? (
                                    <div className="text-7xl font-black tracking-tighter tabular-nums flex items-center gap-4 text-white drop-shadow-2xl">
                                        <span>{match.homeTeamScore}</span>
                                        <span className="text-slate-600 pb-2">:</span>
                                        <span>{match.awayTeamScore}</span>
                                    </div>
                                ) : (
                                    <div className="text-6xl font-bold text-slate-700 py-2">VS</div>
                                )}

                                <div className="flex items-center text-sm font-medium text-slate-300 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
                                    <CalendarDays className="h-4 w-4 mr-2 text-slate-400" />
                                    {dateStr}, {timeStr}
                                </div>
                            </div>

                            {/* GOŚĆ */}
                            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4">
                                <TeamLogoLarge team={match.awayTeam} />
                                <div>
                                    <h2 className={cn("text-3xl font-bold leading-none tracking-tight", match.awayTeam?.isInternal && "text-emerald-400")}>
                                        {match.awayTeam?.name}
                                    </h2>
                                    <Badge className="mt-3 bg-amber-900/40 text-amber-200 border-amber-700/50 hover:bg-amber-900/60">
                                        GOŚĆ
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- SKŁADY --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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

            {/* --- MODAL ZAWODNIKA --- */}
            {selectedPlayer && (
                <PlayerDetailsModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    )
}

// --- KOMPONENT PANELU SKŁADU ---
function TeamSquadPanel({ team, title, onPlayerClick }: { team: MatchTeamData, title: string, onPlayerClick: (p: MatchMember) => void }) {
    const isInternal = team.isInternal
    const members = team.squad || []

    // Sortowanie: Bramkarze (zwykle nr 1) -> Reszta
    const sortedMembers = [...members].sort((a, b) => (a.number || 99) - (b.number || 99))

    return (
        <Card className="h-full border-border/60 shadow-sm bg-card">
            <CardHeader className={cn("border-b pb-4", isInternal ? "bg-emerald-500/5" : "bg-amber-500/5")}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TeamLogoSmall team={team} />
                        <div>
                            <h3 className="font-bold text-lg">{title}</h3>
                            <p className="text-xs text-muted-foreground">
                                {isInternal ? 'Kadra klubu' : 'Dane z bazy zewnętrznej'}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-background">
                        {members.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {members.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                        <div className="p-3 bg-muted rounded-full">
                            <User className="h-6 w-6 opacity-30" />
                        </div>
                        <span className="text-sm">Brak danych o składzie.</span>
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {sortedMembers.map((player) => (
                            <PlayerRow
                                key={player.teamMemberId || player.memberId}
                                player={player}
                                onClick={() => onPlayerClick(player)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- KOMPONENT WIERSZA ZAWODNIKA ---
function PlayerRow({ player, onClick }: { player: MatchMember, onClick: () => void }) {
    const initials = `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`.toUpperCase()

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-3 px-4 hover:bg-muted/40 transition-colors group cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 font-mono font-bold text-sm bg-muted text-muted-foreground rounded group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-border/50">
                    {player.number || '-'}
                </div>

                <Avatar className="h-10 w-10 border border-border/60 shadow-sm">
                    {/* Używamy photoUrl z backendu */}
                    <AvatarImage src={player.logoUrl} alt={player.firstName} className="object-cover" />
                    <AvatarFallback className="text-xs font-medium bg-background text-muted-foreground">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div>
                    <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                        {player.firstName} {player.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                        <Shirt className="h-3 w-3 opacity-70" />
                        {player.fieldPosition ? player.fieldPosition.toLowerCase().replace('_', ' ') : '—'}
                    </div>
                </div>
            </div>

            {player.roles && player.roles.includes('CAPTAIN') && (
                <div className="h-6 w-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-[10px] font-bold border border-yellow-200 shadow-sm" title="Kapitan">
                    C
                </div>
            )}
        </div>
    )
}

// --- KOMPONENT MODALA ZAWODNIKA ---
function PlayerDetailsModal({ player, onClose }: { player: MatchMember, onClose: () => void }) {
    const initials = `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`.toUpperCase()

    // Zamknij modal przy ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Przycisk zamknięcia */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 text-slate-400 hover:text-white hover:bg-white/10 z-10 rounded-full"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                <div className="flex flex-col items-center pt-10 pb-8 px-6 text-center text-slate-100">
                    {/* Duże zdjęcie */}
                    <div className="relative mb-6">
                        <Avatar className="h-32 w-32 border-4 border-slate-700 shadow-xl">
                            <AvatarImage src={player.logoUrl} alt={player.firstName} className="object-cover" />
                            <AvatarFallback className="text-3xl font-bold bg-slate-800 text-slate-400">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {/* Numer nałożony na zdjęcie */}
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white font-black text-lg w-10 h-10 flex items-center justify-center rounded-full border-4 border-[#0f172a] shadow-md">
                            {player.number || '-'}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-1">{player.firstName} {player.lastName}</h2>

                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600">
                            {player.fieldPosition ? player.fieldPosition.replace('_', ' ') : 'Pozycja nieznana'}
                        </Badge>
                        {player.roles && player.roles.includes('CAPTAIN') && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30">
                                Kapitan
                            </Badge>
                        )}
                    </div>

                    <div className="w-full grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Status</span>
                            <span className="font-medium text-emerald-400">{player.status || 'Aktywny'}</span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Rola</span>
                            <span className="font-medium truncate block">
                                {player.roles && player.roles.length > 0 ? player.roles.join(', ') : 'Zawodnik'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 w-full">
                        <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200" onClick={onClose}>
                            Zamknij
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- HELPERY LOGO ---

function TeamLogoLarge({ team }: { team: MatchTeamData }) {
    const src = team.isInternal ? '/favicon.png' : (team.logoUrl || null)

    return (
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-slate-700 bg-white flex items-center justify-center shadow-2xl p-3">
            {src ? (
                <img src={src} alt={team.name} className="h-full w-full object-contain" />
            ) : (
                <Shield className="h-12 w-12 text-slate-300" />
            )}
        </div>
    )
}

function TeamLogoSmall({ team }: { team: MatchTeamData }) {
    const src = team.isInternal ? '/favicon.png' : (team.logoUrl || null)

    return (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-white flex items-center justify-center shadow-sm p-1">
            {src ? (
                <img src={src} alt={team.name} className="h-full w-full object-contain" />
            ) : (
                <Shield className="h-5 w-5 text-muted-foreground/30" />
            )}
        </div>
    )
}