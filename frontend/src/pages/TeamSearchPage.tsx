import  { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
    Search, RotateCw, Calendar,
    Users, Shield, Eye, Edit, Trash2,
    Loader2, ChevronLeft, ChevronRight,
    CheckCircle2, AlertCircle, XCircle, Clock,
    LayoutGrid, UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { getTeams } from '@/lib/userApi'
import { hasRole } from '@/lib/auth'
import { cn } from '@/lib/utils'

// --- KONFIGURACJA ---

type TeamStatus = 'CREATED' | 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED'

// Konfiguracja Statusów (Kolory + Ikony)
const STATUS_CONFIG: Record<TeamStatus, { label: string; bgClass: string; textClass: string; borderClass: string; icon: any }> = {
    ACTIVE: {
        label: 'Aktywny',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
        icon: CheckCircle2
    },
    CREATED: {
        label: 'Utworzony',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-700',
        borderClass: 'border-blue-200',
        icon: Clock
    },
    SUSPENDED: {
        label: 'Zawieszony',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-800',
        borderClass: 'border-yellow-300',
        icon: AlertCircle
    },
    ARCHIVED: {
        label: 'Archiwum',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
        borderClass: 'border-red-200',
        icon: XCircle
    },
}

// Pełna lista kategorii
const AVAILABLE_CATEGORIES = [
    'FIRST_TEAM', 'SENIOR', 'RESERVES', 'SECOND_TEAM', 'THIRD_TEAM', 'FOURTH_TEAM', 'FIFTH_TEAM',
    'U23', 'U21', 'U19', 'U18', 'U17', 'U16', 'U15', 'U14', 'U13', 'U12', 'U11', 'U10', 'U9', 'U8',
    'JUNIOR_OLDER', 'JUNIOR_YOUNGER', 'YOUTH',
    'ACADEMY', 'ACADEMY_ELITE', 'ACADEMY_DEVELOPMENT',
    'WOMEN_FIRST_TEAM', 'WOMEN_RESERVES', 'WOMEN_U19', 'WOMEN_U17', 'WOMEN_U15',
    'TRENING'
]

// --- HELPERY STYLÓW ---

const getCategoryStyle = (catRaw: string) => {
    const cat = catRaw.toUpperCase();

    if (cat === 'FIRST_TEAM' || cat === 'SENIOR' || cat === 'ACADEMY_ELITE') {
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    if (cat.includes('WOMEN')) {
        return 'bg-pink-100 text-pink-800 border-pink-300';
    }
    if (cat.includes('ACADEMY') || cat.includes('U') || cat.includes('JUNIOR') || cat === 'YOUTH') {
        return 'bg-sky-100 text-sky-800 border-sky-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
}

const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const formatDate = (isoString?: string) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' })
}

export function TeamSearchPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const isAdmin = hasRole('ADMIN')

    // --- Inicjalizacja Stanu (z URL) ---
    const initialQuery = searchParams.get('q') || ''
    const initialPage = parseInt(searchParams.get('page') || '0', 10)

    const statusParam = searchParams.get('statuses')
    // POPRAWKA: Rzutowanie ['ACTIVE'] na TeamStatus[], aby uniknąć błędu TS
    const initialStatuses = statusParam
        ? (statusParam.split(',') as TeamStatus[])
        : (['ACTIVE'] as TeamStatus[])

    const catsParam = searchParams.get('categories')
    const initialCats = catsParam ? catsParam.split(',') : []

    const initialMyTeams = searchParams.get('my') !== 'false'

    // --- Stan Aplikacji ---
    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const [selectedStatuses, setSelectedStatuses] = useState<TeamStatus[]>(initialStatuses)
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCats)
    const [myTeamsMode, setMyTeamsMode] = useState<boolean>(initialMyTeams)

    const [catSearch, setCatSearch] = useState('')

    // Dane
    const [clubs, setClubs] = useState<{ items: any[]; total: number }>({ items: [], total: 0 })
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(initialPage)
    const [size] = useState(10)

    // --- EFEKT: Synchronizacja URL i Pobieranie Danych ---
    useEffect(() => {
        const fetchAndSync = async () => {
            setLoading(true)

            const params: Record<string, string> = {
                page: page.toString(),
                my: myTeamsMode.toString()
            }
            if (searchQuery) params.q = searchQuery
            if (selectedStatuses.length > 0) params.statuses = selectedStatuses.join(',')
            if (selectedCategories.length > 0) params.categories = selectedCategories.join(',')
            setSearchParams(params, { replace: true })

            try {
                const isIdSearch = searchQuery.trim() !== '' && !isNaN(Number(searchQuery))
                const apiParams: any = {
                    mode: myTeamsMode ? 'MY_TEAMS' : 'ALL_TEAMS',
                    page,
                    size
                }

                if (searchQuery.trim()) {
                    if (isIdSearch) apiParams.teamId = Number(searchQuery)
                    else apiParams.name = searchQuery
                }

                const res = await getTeams(apiParams, { allowUnauth: true })

                let items = res.items || []
                let total = res.total ?? items.length

                // --- Client-side Filtering Fallback ---
                if (selectedStatuses.length > 0) {
                    items = items.filter((t: any) =>
                        selectedStatuses.includes((t.status || 'CREATED').toUpperCase() as TeamStatus)
                    )
                }

                if (selectedCategories.length > 0) {
                    items = items.filter((t: any) =>
                        selectedCategories.includes(t.category)
                    )
                }

                setClubs({ items, total })
            } catch (err: any) {
                console.error('Błąd pobierania:', err)
                toast.error('Błąd systemu', { description: 'Nie udało się pobrać listy zespołów' })
                setClubs({ items: [], total: 0 })
            } finally {
                setLoading(false)
            }
        }

        fetchAndSync()

    }, [page, searchQuery, selectedStatuses, selectedCategories, myTeamsMode, setSearchParams, size])

    useEffect(() => {
        document.title = 'Wyszukiwarka Zespołów'
    }, [])

    // --- Handlers ---

    const handleSearchEnter = () => setPage(0)

    const toggleStatus = (status: TeamStatus) => {
        setPage(0)
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        )
    }

    const toggleCategory = (cat: string) => {
        setPage(0)
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    const toggleMyTeams = () => {
        setPage(0)
        setMyTeamsMode(prev => !prev)
    }

    const handleClear = () => {
        setSearchQuery('')
        setSelectedStatuses(['ACTIVE'] as TeamStatus[]) // Reset do ACTIVE
        setSelectedCategories([])
        setCatSearch('')
        setPage(0)
    }

    // --- Sub-Components ---

    const PaginationBar = () => (
        <div className="flex items-center justify-between bg-card p-2 rounded-md border shadow-sm my-2">
            <Button variant="ghost" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0 || loading}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Poprzednia
            </Button>
            <span className="text-xs text-muted-foreground font-mono">
                Strona {page + 1} z {Math.max(1, Math.ceil((clubs.total || 0) / size))}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.max(1, Math.ceil((clubs.total || 0) / size)) - 1 || loading}>
                Następna <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
    )

    const displayedCategories = AVAILABLE_CATEGORIES.filter(c =>
        formatCategory(c).toLowerCase().includes(catSearch.toLowerCase())
    )

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-muted/20 relative pb-12">

            {/* STICKY HEADER */}
            <header className="border-b bg-[#0f172a] sticky top-0 z-30 shadow-sm h-16 flex items-center">
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
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Centrum Zespołów</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Wyszukiwarka zespołów</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>Wróć do panelu</Button>
                </div>
            </header>

            <main className="container py-8 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* LEWA KOLUMNA: FILTRY */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6 sticky top-24">

                        {/* 1. PRZYCISK: MOJE ZESPOŁY */}
                        <Button
                            variant={myTeamsMode ? "default" : "outline"}
                            className={cn(
                                "w-full h-12 text-base font-semibold shadow-sm transition-all border-2",
                                myTeamsMode
                                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "border-muted-foreground/20 text-muted-foreground hover:border-primary/50 hover:text-primary bg-card"
                            )}
                            onClick={toggleMyTeams}
                        >
                            <UserCheck className={cn("mr-2 h-5 w-5", myTeamsMode ? "animate-in zoom-in" : "")} />
                            {myTeamsMode ? "Moje Zespoły" : "Wszystkie Zespoły"}
                        </Button>

                        {/* 2. PANEL FILTRÓW */}
                        <Card className="shadow-md border-t-4 border-t-blue-600">
                            <CardContent className="p-4 space-y-6">

                                {/* Wyszukiwarka Tekstowa */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Szukaj</label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Nazwa lub ID..."
                                            className="pl-9 h-9 text-sm"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchEnter()}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Statusy (Pastylki) */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(Object.keys(STATUS_CONFIG) as TeamStatus[]).map(status => {
                                            const cfg = STATUS_CONFIG[status]
                                            const isSelected = selectedStatuses.includes(status)

                                            const activeStyle = `${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ring-1 ring-offset-1 ring-transparent`
                                            const inactiveStyle = "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"

                                            return (
                                                <Badge
                                                    key={status}
                                                    variant="outline"
                                                    onClick={() => toggleStatus(status)}
                                                    className={cn(
                                                        "cursor-pointer transition-all border px-2.5 py-1.5 text-xs font-medium select-none",
                                                        isSelected ? activeStyle : inactiveStyle
                                                    )}
                                                >
                                                    {cfg.label}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>

                                <Separator />

                                {/* Kategorie (Live Search + Scroll) */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kategoria</label>
                                        {selectedCategories.length > 0 && (
                                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 rounded-full">{selectedCategories.length}</span>
                                        )}
                                    </div>

                                    <Input
                                        placeholder="Znajdź kategorię..."
                                        className="h-8 text-xs bg-muted/30 mb-2"
                                        value={catSearch}
                                        onChange={(e) => setCatSearch(e.target.value)}
                                    />

                                    <ScrollArea className="h-[200px] border rounded-md p-1 bg-muted/10">
                                        <div className="space-y-0.5">
                                            {displayedCategories.length > 0 ? displayedCategories.map(cat => {
                                                const isSelected = selectedCategories.includes(cat)
                                                return (
                                                    <div
                                                        key={cat}
                                                        className={cn(
                                                            "flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors",
                                                            isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-muted-foreground"
                                                        )}
                                                        onClick={() => toggleCategory(cat)}
                                                    >
                                                        <Checkbox checked={isSelected} className="h-3.5 w-3.5 pointer-events-none" />
                                                        <span className="flex-1 truncate">{formatCategory(cat)}</span>
                                                    </div>
                                                )
                                            }) : (
                                                <p className="text-[10px] text-muted-foreground text-center py-4 italic">Brak wyników</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>

                                <Button variant="ghost" onClick={handleClear} disabled={loading} className="w-full h-8 text-xs text-muted-foreground mt-2">
                                    <RotateCw className="h-3 w-3 mr-2" /> Wyczyść filtry
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* PRAWA KOLUMNA: WYNIKI */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-4">

                        {clubs.items.length > 0 && <PaginationBar />}

                        <div className="space-y-3 min-h-[400px]">
                            {/* Loader */}
                            {loading && (
                                <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-dashed animate-pulse">
                                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                                    <p>Pobieranie danych...</p>
                                </div>
                            )}

                            {/* Brak wyników */}
                            {!loading && clubs.items.length === 0 && (
                                <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-dashed flex flex-col items-center">
                                    <LayoutGrid className="h-12 w-12 mb-4 opacity-20" />
                                    <h3 className="text-lg font-medium">Brak wyników</h3>
                                    <p className="text-sm max-w-xs mx-auto mt-2">
                                        Nie znaleziono zespołów dla obecnych filtrów.
                                    </p>
                                </div>
                            )}

                            {/* Lista Wyników */}
                            {!loading && clubs.items.map((team: any) => {
                                const rawStatus = (team.status || 'CREATED').toUpperCase() as TeamStatus
                                const cfg = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.CREATED
                                const clubId = team.id ?? team.teamId
                                const clubName = team.name ?? team.teamName ?? 'Bez nazwy'
                                const categoryRaw = team.category || 'SENIOR'
                                const categoryStyle = getCategoryStyle(categoryRaw)

                                return (
                                    <Card
                                        key={clubId}
                                        className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/50 group border-l-0"
                                    >
                                        {/* Pasek Statusu (Lewy Boczny) */}
                                        <div
                                            className={cn(
                                                "absolute left-0 top-0 bottom-0 w-1.5",
                                                cfg.bgClass.replace('bg-', 'bg-').replace('100', '500')
                                            )}
                                        />

                                        <div className="p-4 pl-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-lg leading-none truncate max-w-[400px]" title={clubName}>
                                                        {clubName}
                                                    </h3>

                                                    {/* Badge Kategorii (Z hierarchią kolorów) */}
                                                    <Badge
                                                        variant="outline"
                                                        className={cn("text-[10px] uppercase font-mono tracking-wider h-5 px-1.5 border", categoryStyle)}
                                                    >
                                                        {formatCategory(categoryRaw)}
                                                    </Badge>

                                                    {/* Badge Statusu (Mały, obok nazwy) */}
                                                    <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 border gap-1", cfg.textClass, cfg.bgClass, cfg.borderClass)}>
                                                        {cfg.label}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5" title="ID">
                                                        <Shield className="h-3.5 w-3.5 opacity-60" />
                                                        <span className="font-mono text-xs">#{clubId}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5" title="Data utworzenia">
                                                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                                                        <span className="text-xs">{formatDate(team.createdAt)}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5" title="Członkowie">
                                                        <Users className="h-3.5 w-3.5 opacity-60" />
                                                        <span className="text-xs">{team.numberOfMembers ?? team.memberCount ?? 0}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Akcje */}
                                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 text-xs shadow-sm bg-background border hover:bg-muted"
                                                    onClick={() => navigate(`/team-details/${clubId}`)}
                                                >
                                                    <Eye className="h-3 w-3 mr-2" /> Szczegóły
                                                </Button>

                                                {isAdmin && (
                                                    <div className="flex items-center border-l pl-2 ml-1 gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => toast.info('Edycja w budowie')}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => toast.info('Usuwanie w budowie')}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Pasek Paginacji (Dół) */}
                        {clubs.items.length > 0 && <PaginationBar />}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default TeamSearchPage