import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
    Search, ArrowLeft, Calendar, Shield,
    CheckCircle2, Loader2, Save
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// API Imports
import { getTeams as getInternalTeams } from '@/lib/userApi' // Internal teams
import { getTeams as getExternalTeamsList, type TeamSummary } from '@/lib/externalApi' // External teams (zmieniona nazwa)
import { createMatch } from '@/lib/matchesApi' // Match creation

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
        // Na start ładujemy domyślne listy
        fetchInternalTeams()
        fetchExternalTeams()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // --- LOGIKA WYSZUKIWANIA: INTERNAL ---
    const fetchInternalTeams = async (query: string = '') => {
        setLoadingInternal(true)
        try {
            const isId = /^\d+$/.test(query.trim()) && query.trim().length > 0

            const params: any = {
                mode: 'ALL_TEAMS',
                size: 20
            }

            if (query.trim()) {
                if (isId) params.teamId = Number(query)
                else params.name = query
            }

            // Pobranie z userApi
            const res = await getInternalTeams(params, { allowUnauth: true })

            // Mapowanie + FILTRACJA STATUSU ACTIVE
            const mapped: TeamSelectable[] = (res.items || [])
                .filter((t: any) => (t.status || 'CREATED') === 'ACTIVE')
                .map((t: any) => ({
                    id: t.teamId ?? t.id,
                    name: t.teamName ?? t.name,
                    logo: '/favicon.png', // Internal zawsze ma nasze logo
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
            // Używamy getTeams (zaimportowane jako getExternalTeamsList) z externalApi
            // Przyjmuje parametr 'query' do wyszukiwania
            const res = await getExternalTeamsList({ query: query, size: 20 })

            // Mapowanie wyników (TeamSummary -> TeamSelectable)
            // Używamy pola 'logo' (zgodnie z nowym DTO), a nie 'logoUrl'
            let mapped: TeamSelectable[] = (res.content || []).map((c: TeamSummary) => ({
                id: c.id,
                name: c.name,
                logo: c.logo,
                origin: 'external',
                info: c.country ? `${c.country} (${c.code})` : c.code
            }))

            // Logika filtrowania ID po stronie klienta (dla precyzji)
            if (/^\d+$/.test(query.trim())) {
                const id = Number(query)
                // Szukamy dokładnego dopasowania ID w wynikach
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

    // --- HANDLERY SZUKANIA ---
    const handleInternalSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchInternalTeams(internalQuery)
    }

    const handleExternalSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchExternalTeams(externalQuery)
    }

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
                isHome: isHome
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
            <header className="border-b bg-[#0f172a] sticky top-0 z-30 shadow-sm h-16 flex items-center"><div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
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
                        <p className="text-xs text-muted-foreground hidden sm:block">Dodaj nowy mecz</p>
                    </div>

                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="h-4 w-4" />
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

                {/* PASEK OSOBNOŚCI: USTAWIENIA CZASU I GOSPODARZA */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Szczegóły spotkania</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-6 items-end">
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
                        <div className="flex items-center space-x-3 pb-2 border-l pl-6 ml-2 h-12">
                            <Switch id="home-mode" checked={isHome} onCheckedChange={setIsHome} />
                            <div className="space-y-0.5">
                                <Label htmlFor="home-mode">Gramy u siebie?</Label>
                                <p className="text-xs text-muted-foreground">
                                    {isHome ? 'Jesteśmy GOSPODARZEM' : 'Jesteśmy GOŚCIEM (Wyjazd)'}
                                </p>
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

                            {/* LEWA: GOSPODARZ */}
                            <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right gap-4">
                                <TeamLogoLarge
                                    url={isHome ? selectedInternal?.logo : selectedExternal?.logo}
                                    name={isHome ? selectedInternal?.name : selectedExternal?.name}
                                />
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-none tracking-tight">
                                        {(isHome ? selectedInternal?.name : selectedExternal?.name) || '???'}
                                    </h2>
                                    <Badge className="mt-3 bg-emerald-900/40 text-emerald-200 border-emerald-700/50">GOSPODARZ</Badge>
                                </div>
                            </div>

                            {/* ŚRODEK: VS */}
                            <div className="flex flex-col items-center justify-center min-w-[150px] gap-2">
                                <Badge variant="outline" className="border-blue-700/50 text-blue-200 bg-blue-900/20 uppercase tracking-widest px-3">
                                    ZAPLANOWANY
                                </Badge>
                                <div className="text-5xl md:text-6xl font-black text-slate-700 py-2">VS</div>
                                {matchDate && (
                                    <div className="flex items-center text-sm font-medium text-slate-300 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
                                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                        {matchDate} {matchTime}
                                    </div>
                                )}
                            </div>

                            {/* PRAWA: GOŚĆ */}
                            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4">
                                <TeamLogoLarge
                                    url={!isHome ? selectedInternal?.logo : selectedExternal?.logo}
                                    name={!isHome ? selectedInternal?.name : selectedExternal?.name}
                                />
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold leading-none tracking-tight">
                                        {(!isHome ? selectedInternal?.name : selectedExternal?.name) || '???'}
                                    </h2>
                                    <Badge className="mt-3 bg-amber-900/40 text-amber-200 border-amber-700/50">GOŚĆ</Badge>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* PRZYCISK ZAPISU */}
                    <div className="flex justify-end pt-4">
                        <Button
                            size="lg"
                            className="w-full md:w-auto text-base px-8 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
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
        <Card className={cn("flex flex-col h-[500px]", selected ? "border-primary/50 ring-1 ring-primary/10" : "")}>
            <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    {selected && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
                <form onSubmit={onSearch} className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={variant === 'internal' ? "Nazwa lub ID (np. 12)" : "Nazwa klubu..."}
                            className="pl-9"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading} size="sm">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Szukaj'}
                    </Button>
                </form>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden relative">
                <ScrollArea className="h-full">
                    {list.length === 0 && !loading && (
                        <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 opacity-20" />
                            <p>Brak wyników wyszukiwania.</p>
                        </div>
                    )}
                    {loading && (
                        <div className="p-8 text-center text-muted-foreground flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                        </div>
                    )}
                    <div className="divide-y">
                        {list.map((team) => (
                            <div
                                key={team.id}
                                onClick={() => onSelect(team)}
                                className={cn(
                                    "flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50",
                                    selected?.id === team.id ? "bg-primary/5 border-l-4 border-l-primary pl-[12px]" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="h-10 w-10 shrink-0 rounded bg-white border flex items-center justify-center p-1">
                                    {team.logo ? <img src={team.logo} className="h-full w-full object-contain" /> : <Shield className="h-5 w-5 text-muted-foreground/30"/>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-semibold truncate">{team.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1 h-4">{variant === 'internal' ? 'Nasza' : 'Zewn.'}</Badge>
                                        <span className="truncate">{team.info}</span>
                                    </div>
                                </div>
                                {selected?.id === team.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
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
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-slate-700 bg-white flex items-center justify-center shadow-2xl p-2 transition-transform hover:scale-105">
            {url ? (
                <img src={url} alt={name} className="h-full w-full object-contain" />
            ) : (
                <Shield className="h-10 w-10 text-slate-300" />
            )}
        </div>
    )
}