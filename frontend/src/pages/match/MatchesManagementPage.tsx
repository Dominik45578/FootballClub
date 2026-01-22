import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
    Search, ArrowLeft, Calendar, Shield,
    CheckCircle2, Loader2, Save, House, Plane
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils.ts'

// API Imports
import { getTeams as getInternalTeams } from '@/lib/userApi.ts'
import { getTeams as getExternalTeamsList, type TeamSummary } from '@/lib/externalApi.ts'
import { createMatch } from '@/lib/matchesApi.ts'

// --- TYPY POMOCNICZE ---

type TeamSelectable = {
    id: number
    name: string
    logo?: string | null
    origin: 'internal' | 'external'
    info?: string
}

export function MatchesManagementPage() {
    const navigate = useNavigate()

    // --- STAN ---

    // Internal (Nasze)
    const [internalQuery, setInternalQuery] = useState('')
    const [internalList, setInternalList] = useState<TeamSelectable[]>([])
    const [selectedInternal, setSelectedInternal] = useState<TeamSelectable | null>(null)
    const [loadingInternal, setLoadingInternal] = useState(false)

    // External (Rywale)
    const [externalQuery, setExternalQuery] = useState('')
    const [externalList, setExternalList] = useState<TeamSelectable[]>([])
    const [selectedExternal, setSelectedExternal] = useState<TeamSelectable | null>(null)
    const [loadingExternal, setLoadingExternal] = useState(false)

    // Ustawienia meczu
    const [matchDate, setMatchDate] = useState<string>('') // YYYY-MM-DD
    const [matchTime, setMatchTime] = useState<string>('12:00')
    const [isHome, setIsHome] = useState(true) // Czy my jesteśmy gospodarzem?
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        document.title = 'Kreator Meczu'
        fetchInternalTeams()
        fetchExternalTeams()
    }, [])

    // --- LOGIKA WYSZUKIWANIA: INTERNAL ---
    const fetchInternalTeams = async (query: string = '') => {
        setLoadingInternal(true)
        try {
            const isId = /^\d+$/.test(query.trim()) && query.trim().length > 0
            const params: any = { mode: 'ALL_TEAMS', size: 20 }

            if (query.trim()) {
                if (isId) params.teamId = Number(query)
                else params.name = query
            }

            const res = await getInternalTeams(params, { allowUnauth: true })

            const mapped: TeamSelectable[] = (res.items || [])
                .filter((t: any) => (t.status || 'CREATED') === 'ACTIVE')
                .map((t: any) => ({
                    id: t.teamId ?? t.id,
                    name: t.teamName ?? t.name,
                    logo: '/favicon.png',
                    origin: 'internal',
                    info: t.category || 'Zespół klubowy'
                }))

            setInternalList(mapped)
        } catch (e) {
            console.error(e)
            toast.error('Błąd pobierania naszych zespołów')
        } finally {
            setLoadingInternal(false)
        }
    }

    // --- LOGIKA WYSZUKIWANIA: EXTERNAL ---
    const fetchExternalTeams = async (query: string = '') => {
        setLoadingExternal(true)
        try {
            const res = await getExternalTeamsList({ query: query, size: 20 })

            let mapped: TeamSelectable[] = (res.content || []).map((c: TeamSummary) => ({
                id: c.id,
                name: c.name,
                logo: c.logo,
                origin: 'external',
                info: c.country ? `${c.country} (${c.code})` : c.code
            }))

            if (/^\d+$/.test(query.trim())) {
                const id = Number(query)
                const exact = mapped.filter((m) => m.id === id)
                if (exact.length > 0) mapped = exact
            }

            setExternalList(mapped)
        } catch (e) {
            console.error(e)
            toast.error('Błąd pobierania rywali')
        } finally {
            setLoadingExternal(false)
        }
    }

    // --- HANDLERY ---
    const handleInternalSearch = (e: React.FormEvent) => { e.preventDefault(); fetchInternalTeams(internalQuery) }
    const handleExternalSearch = (e: React.FormEvent) => { e.preventDefault(); fetchExternalTeams(externalQuery) }

    // --- ZAPIS ---
    const handleCreate = async () => {
        if (!selectedInternal || !selectedExternal || !matchDate) {
            toast.error('Wybierz oba zespoły i datę meczu')
            return
        }

        setIsSaving(true)
        try {
            const finalDate = new Date(`${matchDate}T${matchTime}`).toISOString()

            await createMatch({
                internalTeamId: selectedInternal.id,
                externalTeamId: selectedExternal.id,
                matchDate: finalDate,
                isHome: isHome // Przekazujemy flagę isHome
            })

            toast.success('Mecz został utworzony pomyślnie!')
            navigate('/matches')
        } catch (e: any) {
            console.error(e)
            toast.error('Nie udało się utworzyć meczu', { description: e.message || 'Błąd serwera' })
        } finally {
            setIsSaving(false)
        }
    }

    // --- WIDOK ---
    return (
        <div className="min-h-screen bg-muted/20 pb-20 font-sans">
            {/* Header */}
            <header className="border-b bg-[#091021] sticky top-0 z-50 shadow-sm">
                <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-lg bg-white p-1 border shadow-sm">
                            <img src="/favicon.png" alt="Club Logo" className="h-full w-full object-contain"/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Centrum Meczowe</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Dodaj nowy mecz</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-4 w-4"/>
                        <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                </div>
            </header>

            <main className="container py-8 px-4 max-w-7xl mx-auto space-y-8">

                {/* GRID WYBORU ZESPOŁÓW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* LEWA STRONA: INTERNAL */}
                    <TeamSelectorPanel
                        title="Nasza Drużyna"
                        description="Wybierz zespół klubowy (tylko status ACTIVE)"
                        query={internalQuery}
                        setQuery={setInternalQuery}
                        onSearch={handleInternalSearch}
                        loading={loadingInternal}
                        list={internalList}
                        selected={selectedInternal}
                        onSelect={setSelectedInternal}
                        variant="internal"
                    />

                    {/* PRAWA STRONA: EXTERNAL */}
                    <TeamSelectorPanel
                        title="Przeciwnik"
                        description="Wybierz rywala z bazy zewnętrznej"
                        query={externalQuery}
                        setQuery={setExternalQuery}
                        onSearch={handleExternalSearch}
                        loading={loadingExternal}
                        list={externalList}
                        selected={selectedExternal}
                        onSelect={setSelectedExternal}
                        variant="external"
                    />
                </div>

                {/* PASEK USTAWIEŃ MECZU (DATA, CZAS, LOKALIZACJA) */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Szczegóły spotkania</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-8 items-end">
                        <div className="space-y-2">
                            <Label>Data meczu</Label>
                            <Input
                                type="date"
                                value={matchDate}
                                onChange={(e) => setMatchDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Godzina</Label>
                            <Input
                                type="time"
                                value={matchTime}
                                onChange={(e) => setMatchTime(e.target.value)}
                                className="w-32"
                            />
                        </div>

                        {/* PRZEŁĄCZNIK DOM / WYJAZD */}
                        <div className="flex items-center gap-4 pb-2 pl-4 border-l h-14">
                            <div className="flex flex-col items-center gap-1">
                                <Label htmlFor="home-mode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lokalizacja</Label>
                                <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-lg border">
                                    <span className={cn("text-xs font-bold transition-colors flex items-center gap-1", !isHome && "text-muted-foreground opacity-50")}>
                                        <Plane className="h-3.5 w-3.5" /> WYJAZD
                                    </span>
                                    <Switch id="home-mode" checked={isHome} onCheckedChange={setIsHome} />
                                    <span className={cn("text-xs font-bold transition-colors flex items-center gap-1", isHome ? "text-emerald-600" : "text-muted-foreground opacity-50")}>
                                        DOM <House className="h-3.5 w-3.5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PODGLĄD I ZAPIS */}
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Podsumowanie
                    </h2>

                    {/* KARTA PODGLĄDU (Dark Theme Preview) */}
                    <div className="relative overflow-hidden rounded-xl bg-[#0f172a] text-slate-100 shadow-xl border border-slate-800 p-0">
                        {/* Pasek Statusu (Planowany) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[60%] bg-blue-500 rounded-r-sm" />

                        <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-10 gap-8">

                            {/* LEWA STRONA: GOSPODARZ (Zależnie od isHome) */}
                            <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right gap-4 transition-all duration-300">
                                <TeamLogoLarge
                                    url={isHome ? selectedInternal?.logo : selectedExternal?.logo}
                                    name={isHome ? selectedInternal?.name : selectedExternal?.name}
                                />
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-none tracking-tight">
                                        {(isHome ? selectedInternal?.name : selectedExternal?.name) || '???'}
                                    </h2>
                                    <Badge className="mt-3 bg-emerald-900/40 text-emerald-200 border-emerald-700/50 hover:bg-emerald-900/60 flex w-fit ml-auto mr-auto md:mr-0 gap-1">
                                        <House className="h-3 w-3" /> GOSPODARZ
                                    </Badge>
                                </div>
                            </div>

                            {/* ŚRODEK: VS */}
                            <div className="flex flex-col items-center justify-center min-w-[150px] gap-2">
                                <Badge variant="outline" className="border-blue-700/50 text-blue-200 bg-blue-900/20 uppercase tracking-widest px-3">
                                    ZAPLANOWANY
                                </Badge>
                                <div className="text-5xl md:text-6xl font-black text-slate-700 py-2 tracking-tighter">VS</div>
                                {matchDate && (
                                    <div className="flex items-center text-sm font-medium text-slate-300 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
                                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                        {matchDate} {matchTime}
                                    </div>
                                )}
                            </div>

                            {/* PRAWA STRONA: GOŚĆ (Zależnie od isHome) */}
                            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 transition-all duration-300">
                                <TeamLogoLarge
                                    url={!isHome ? selectedInternal?.logo : selectedExternal?.logo}
                                    name={!isHome ? selectedInternal?.name : selectedExternal?.name}
                                />
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-none tracking-tight">
                                        {(!isHome ? selectedInternal?.name : selectedExternal?.name) || '???'}
                                    </h2>
                                    <Badge className="mt-3 bg-amber-900/40 text-amber-200 border-amber-700/50 hover:bg-amber-900/60 flex w-fit ml-auto mr-auto md:ml-0 gap-1">
                                        <Plane className="h-3 w-3" /> GOŚĆ
                                    </Badge>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* PRZYCISK ZAPISU */}
                    <div className="flex justify-end pt-4">
                        <Button
                            size="lg"
                            className="w-full md:w-auto text-base px-8 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                            disabled={!selectedInternal || !selectedExternal || !matchDate || isSaving}
                            onClick={handleCreate}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                            Utwórz Mecz
                        </Button>
                    </div>
                </div>

            </main>
        </div>
    )
}

// --- SUB-KOMPONENTY ---

function TeamSelectorPanel({
                               title, description, query, setQuery, onSearch, loading, list, selected, onSelect, variant
                           }: {
    title: string, description: string, query: string, setQuery: (v: string) => void, onSearch: (e: React.FormEvent) => void,
    loading: boolean, list: TeamSelectable[], selected: TeamSelectable | null, onSelect: (t: TeamSelectable) => void,
    variant: 'internal' | 'external'
}) {
    return (
        <Card className={cn("flex flex-col h-[500px] transition-all", selected ? "border-primary/50 ring-2 ring-primary/10 shadow-md" : "")}>
            <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="flex items-center justify-between text-lg">
                    <span>{title}</span>
                    {selected && <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-in zoom-in" />}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
                <form onSubmit={onSearch} className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={variant === 'internal' ? "Nazwa lub ID (np. 12)" : "Nazwa klubu..."}
                            className="pl-9 bg-background/50"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading} size="sm">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Szukaj'}
                    </Button>
                </form>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden relative bg-card/50">
                <ScrollArea className="h-full">
                    {list.length === 0 && !loading && (
                        <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-3 opacity-60">
                            <Search className="h-10 w-10" />
                            <p>Brak wyników wyszukiwania.</p>
                        </div>
                    )}
                    {loading && (
                        <div className="p-12 text-center text-muted-foreground flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                        </div>
                    )}
                    <div className="divide-y divide-border/50">
                        {list.map((team) => (
                            <div
                                key={team.id}
                                onClick={() => onSelect(team)}
                                className={cn(
                                    "flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-muted/60",
                                    selected?.id === team.id ? "bg-primary/5 border-l-4 border-l-primary pl-[12px]" : "border-l-4 border-l-transparent pl-4"
                                )}
                            >
                                <div className="h-10 w-10 shrink-0 rounded-full bg-white border flex items-center justify-center p-1 shadow-sm">
                                    {team.logo ? <img src={team.logo} className="h-full w-full object-contain" /> : <Shield className="h-5 w-5 text-muted-foreground/30"/>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-semibold truncate text-sm">{team.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <Badge variant="secondary" className="text-[9px] px-1 h-4 border-muted-foreground/20">{variant === 'internal' ? 'KLUB' : 'RYWAL'}</Badge>
                                        <span className="truncate opacity-80">{team.info}</span>
                                    </div>
                                </div>
                                {selected?.id === team.id && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function TeamLogoLarge({ url, name }: { url?: string | null, name?: string }) {
    return (
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-slate-700 bg-white flex items-center justify-center shadow-2xl p-3 transition-transform duration-500 hover:scale-105">
            {url ? (
                <img src={url} alt={name} className="h-full w-full object-contain" />
            ) : (
                <Shield className="h-10 w-10 text-slate-300" />
            )}
        </div>
    )
}