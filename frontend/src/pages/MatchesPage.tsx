import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
    Search,
    LayoutList,
    User,
    CalendarDays,
    ArrowLeft,
    Archive,
    Shield,
    Eye
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAllMatches, getMyMatches, getMatchById, type MatchResponse, statusToLabel } from '@/lib/matchesApi'
import { cn } from '@/lib/utils'

type ViewMode = 'all' | 'my' | 'archived'

export function MatchesPage() {
    const navigate = useNavigate()

    const [viewMode, setViewMode] = useState<ViewMode>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [matches, setMatches] = useState<MatchResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // --- LOGIKA POBIERANIA ---
    const fetchList = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            let result;
            if (viewMode === 'my') {
                result = await getMyMatches(0, 50)
            } else {
                result = await getAllMatches(0, 50)
            }

            let content = result.content || []

            if (viewMode === 'archived') {
                content = content.filter(m => m.status === 'FINISHED' || m.status === 'CANCELLED')
            }

            setMatches(content)
        } catch (e: any) {
            if (e?.status === 403 && viewMode === 'all') {
                setError('Brak dostępu do wszystkich meczów. Przełączono na Twoje mecze.')
                setViewMode('my')
            } else {
                setError('Nie udało się pobrać listy meczów.')
            }
        } finally {
            setLoading(false)
        }
    }, [viewMode])

    const fetchById = useCallback(async (id: number) => {
        setLoading(true)
        setError(null)
        try {
            const match = await getMatchById(id)
            setMatches(match ? [match] : [])
        } catch (e: any) {
            setMatches([])
            if (e?.status !== 404) setError('Błąd wyszukiwania.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const isIdSearch = /^\d+$/.test(searchQuery.trim())
        if (isIdSearch) {
            fetchById(Number(searchQuery))
        } else if (searchQuery.trim().length === 0) {
            fetchList()
        }
    }, [fetchList, fetchById, searchQuery, viewMode])

    const filteredMatches = matches.filter(m => {
        if (!searchQuery || /^\d+$/.test(searchQuery)) return true
        const query = searchQuery.toLowerCase()
        const home = m.homeTeam?.name?.toLowerCase() || ''
        const away = m.awayTeam?.name?.toLowerCase() || ''
        return home.includes(query) || away.includes(query)
    })

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col font-sans">

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur shadow-sm">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-lg bg-white p-1 border shadow-sm">
                            <img
                                src="/favicon.png"
                                alt="Club Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Centrum Meczowe</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Zarządzanie rozgrywkami</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                </div>
            </header>

            {/* --- GŁÓWNY LAYOUT --- */}
            <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">

                    {/* --- LEWA KOLUMNA: FILTRY (STICKY) --- */}
                    <aside className="hidden md:block sticky top-24 h-fit">
                        <Card className="shadow-sm border-border/60 bg-card">
                            <CardHeader className="pb-3 bg-muted/30 border-b px-4 py-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Search className="h-4 w-4" /> Filtry
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4 p-4">
                                <Input
                                    placeholder="Szukaj (ID lub nazwa)..."
                                    className="bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />

                                <div className="flex flex-col gap-1">
                                    <NavButton
                                        active={viewMode === 'all'}
                                        onClick={() => setViewMode('all')}
                                        icon={<LayoutList className="h-4 w-4" />}
                                        label="Wszystkie mecze"
                                    />
                                    <NavButton
                                        active={viewMode === 'my'}
                                        onClick={() => setViewMode('my')}
                                        icon={<User className="h-4 w-4" />}
                                        label="Moje mecze"
                                    />
                                    <NavButton
                                        active={viewMode === 'archived'}
                                        onClick={() => setViewMode('archived')}
                                        icon={<Archive className="h-4 w-4" />}
                                        label="Zarchiwizowane"
                                    />
                                </div>

                                <Separator />
                                <Button className="w-full shadow-sm" onClick={() => navigate('/matches/new')}>
                                    + Dodaj Mecz
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* --- MOBILNE FILTRY (< md) --- */}
                    <div className="md:hidden mb-4 space-y-3">
                        <Input
                            placeholder="Szukaj..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            <Button size="sm" variant={viewMode==='all'?'default':'outline'} onClick={()=>setViewMode('all')}>Wszystkie</Button>
                            <Button size="sm" variant={viewMode==='my'?'default':'outline'} onClick={()=>setViewMode('my')}>Moje</Button>
                            <Button size="sm" variant={viewMode==='archived'?'default':'outline'} onClick={()=>setViewMode('archived')}>Archiwum</Button>
                        </div>
                    </div>

                    {/* --- PRAWA KOLUMNA: LISTA MECZÓW --- */}
                    <main className="min-w-0 flex flex-col gap-6">

                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                {viewMode === 'archived' ? 'Archiwum' :
                                    viewMode === 'my' ? 'Twoje mecze' : 'Terminarz'}
                            </h2>
                            <Badge variant="secondary" className="px-3 py-1 text-xs">
                                Liczba: {filteredMatches.length}
                            </Badge>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20 text-sm font-medium flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            {!loading && filteredMatches.length === 0 && !error && (
                                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                                    <p className="text-muted-foreground font-medium">Brak meczów spełniających kryteria.</p>
                                </div>
                            )}

                            {filteredMatches.map((match) => (
                                <MatchCard
                                    key={match.matchId}
                                    match={match}
                                    onClick={() => navigate(`/matches/${match.matchId}`)}
                                />
                            ))}
                        </div>
                    </main>

                </div>
            </div>
        </div>
    )
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <Button
            variant={active ? "secondary" : "ghost"}
            className={cn(
                "justify-start w-full text-sm font-medium transition-colors",
                active ? "bg-white shadow-sm text-primary hover:bg-white" : "text-muted-foreground hover:bg-muted/50"
            )}
            onClick={onClick}
        >
            <span className={cn("mr-3", active ? "opacity-100" : "opacity-70")}>{icon}</span>
            {label}
        </Button>
    )
}

// --- KARTA MECZU ---
function MatchCard({ match, onClick }: { match: MatchResponse; onClick: () => void }) {
    const showScore = match.status === 'FINISHED' || match.status === 'LIVE'

    const dateObj = new Date(match.matchDate)
    const dateStr = dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
    const timeStr = dateObj.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    // 1. Kolor paska statusu (Lewy margines)
    let statusColor = "bg-blue-500"

    // 2. Styl badge'a statusu (Środek)
    // Używamy spójnego stylu: przezroczyste tło, kolorowy tekst i obramowanie
    let statusBadgeStyle = "bg-blue-900/50 text-blue-200 border-blue-700/50"

    if (match.status === 'LIVE') {
        statusColor = "bg-green-500 animate-pulse"
        statusBadgeStyle = "bg-green-900/50 text-green-200 border-green-700/50 animate-pulse"
    } else if (match.status === 'CANCELLED') {
        statusColor = "bg-red-600"
        statusBadgeStyle = "bg-red-900/50 text-red-200 border-red-700/50"
    } else if (match.status === 'POSTPONED') {
        statusColor = "bg-yellow-500"
        statusBadgeStyle = "bg-yellow-900/50 text-yellow-200 border-yellow-700/50"
    } else if (match.status === 'FINISHED') {
        statusColor = "bg-slate-500"
        statusBadgeStyle = "bg-slate-800/50 text-slate-400 border-slate-700/50"
    }

    // --- LOGIKA FAVICON ---
    // Wymuszamy pobranie /favicon.png jeśli isInternal=true
    const homeLogo = match.homeTeam?.isInternal ? '/favicon.png' : match.homeTeam?.logoUrl
    const awayLogo = match.awayTeam?.isInternal ? '/favicon.png' : match.awayTeam?.logoUrl

    return (
        <div className="group relative overflow-hidden rounded-xl bg-[#0f172a] text-slate-100 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-800">

            {/* PASEK STATUSU: 2/3 wysokości (66%), wyśrodkowany pionowo */}
            <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[66%] rounded-r-sm z-10",
                statusColor
            )} />

            <div className="flex flex-col md:flex-row h-full">

                {/* DANE MECZU */}
                <div className="flex-1 p-5 pl-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">

                    {/* GOSPODARZ */}
                    <div className="flex-1 flex items-center justify-end gap-4 w-full md:w-auto">
                        <div className="flex flex-col items-end text-right">
                            <span className={cn("text-lg font-bold leading-tight truncate max-w-[160px] md:max-w-[200px] text-white", match.homeTeam?.isInternal && "text-emerald-400")}>
                                {match.homeTeam?.name || "Gospodarz"}
                            </span>
                            {/* BADGE GOSPODARZA - Zmieniony na Emerald */}
                            <Badge className="mt-1.5 bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900/70 border-emerald-700/50 text-[10px] px-2 shadow-none font-semibold">
                                GOSPODARZ
                            </Badge>
                        </div>
                        <TeamLogo url={homeLogo} name={match.homeTeam?.name} />
                    </div>

                    {/* ŚRODEK (WYNIK I STATUS) */}
                    <div className="flex flex-col items-center justify-center min-w-[120px] px-2 text-center">

                        {/* BADGE STATUSU - Zmieniony styl na spójny z resztą */}
                        <Badge variant="outline" className={cn("mb-2 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-sm", statusBadgeStyle)}>
                            {statusToLabel(match.status)}
                        </Badge>

                        {showScore ? (
                            <div className="text-4xl font-black tracking-tighter flex items-center gap-2 mb-1 tabular-nums text-white">
                                <span>{match.homeTeamScore ?? 0}</span>
                                <span className="text-slate-500 text-3xl px-0.5">:</span>
                                <span>{match.awayTeamScore ?? 0}</span>
                            </div>
                        ) : (
                            <div className="text-3xl font-bold text-slate-600 mb-1">VS</div>
                        )}

                        <div className="flex items-center text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full mt-1">
                            <CalendarDays className="h-3 w-3 mr-1.5 opacity-70" />
                            {dateStr}, {timeStr}
                        </div>
                    </div>

                    {/* GOŚĆ */}
                    <div className="flex-1 flex items-center justify-start gap-4 w-full md:w-auto flex-row-reverse md:flex-row">
                        <TeamLogo url={awayLogo} name={match.awayTeam?.name} />
                        <div className="flex flex-col items-start text-left">
                            <span className={cn("text-lg font-bold leading-tight truncate max-w-[160px] md:max-w-[200px] text-white", match.awayTeam?.isInternal && "text-emerald-400")}>
                                {match.awayTeam?.name || "Gość"}
                            </span>
                            {/* BADGE GOŚCIA - Bursztynowy */}
                            <Badge className="mt-1.5 bg-amber-900/50 text-amber-200 hover:bg-amber-900/70 border-amber-700/50 text-[10px] px-2 shadow-none font-semibold">
                                GOŚĆ
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* KOMPAKTOWY PASEK AKCJI (Pionowy po prawej) */}
                <div className="relative border-l border-slate-700/50 bg-slate-900/30 flex flex-col items-center justify-center w-14 min-w-[56px]">
                    {/* Kreska oddzielająca na 66% wysokości */}
                    <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[1px] h-[66%] bg-slate-700/50" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                        onClick={onClick}
                        title="Szczegóły"
                    >
                        <Eye className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function TeamLogo({ url, name }: { url?: string | null, name?: string }) {
    return (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center shadow-sm p-1">
            {url ? (
                // Wymuszony render img jeśli URL jest podany
                <img src={url} alt={name} className="h-full w-full object-contain" />
            ) : (
                <Shield className="h-7 w-7 text-slate-500" />
            )}
        </div>
    )
}