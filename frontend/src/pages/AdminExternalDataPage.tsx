import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    ArrowLeft, Search, RefreshCw, Globe, Shield,
    Trash2, Loader2, MapPin, ChevronLeft, ChevronRight,
    ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Importy API
import {
    getTeams,
    refreshTeamsForCountry,
    refreshSquad,
    deleteTeam,
    type TeamSummary
} from '@/lib/externalApi'

import { hasRole } from '@/lib/auth'

const SUPPORTED_COUNTRIES = [
    "England", "Spain", "Germany", "Italy", "France", "Poland",
    "Portugal", "Netherlands", "Belgium", "Brazil", "Argentina"
]

export function AdminExternalDataPage() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams() // Hook do zarządzania URL
    const isAdmin = hasRole('ADMIN')

    // Odczyt stanu początkowego z URL
    const initialQuery = searchParams.get('q') || ''
    const initialPage = parseInt(searchParams.get('page') || '0', 10)

    // --- Stan Aplikacji ---
    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const [teams, setTeams] = useState<TeamSummary[]>([])
    const [loadingTeams, setLoadingTeams] = useState(false)
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null)

    // --- Stan Paginacji ---
    const [page, setPage] = useState(initialPage)
    const [totalPages, setTotalPages] = useState(0)
    const PAGE_SIZE = 20

    // --- Stan Akcji ---
    const [actionLoading, setActionLoading] = useState(false)
    const [countryModalOpen, setCountryModalOpen] = useState(false)
    const [countryFilter, setCountryFilter] = useState('')

    useEffect(() => {
        document.title = 'Panel Administratora - Dane Zewnętrzne'
        // Przy montowaniu komponentu, jeśli mamy parametry w URL, pobierz dane
        if (initialQuery || initialPage >= 0) {
            fetchTeamsPage(initialPage, initialQuery)
        }
    }, [])
    // ^ Pusty dependency array, by wykonać tylko raz przy montowaniu.
    // Zmiany w URL będą obsługiwane przez settery stanu i logikę handlerów.

    // --- FUNKCJE POMOCNICZE ---

    const updateUrlParams = (newQuery: string, newPage: number) => {
        setSearchParams({ q: newQuery, page: newPage.toString() })
    }

    const fetchTeamsPage = async (pageIndex: number, query: string) => {
        setLoadingTeams(true)
        setExpandedTeamId(null)
        try {
            const result = await getTeams({ query: query, page: pageIndex, size: PAGE_SIZE })
            setTeams(result.content)
            setTotalPages(result.totalPages)
            // Aktualizujemy stan lokalny, aby był spójny z pobranymi danymi
            setPage(result.number)
            setSearchQuery(query)
        } catch (err: any) {
            toast.error('Błąd wyszukiwania', { description: err.message })
            setTeams([])
        } finally {
            setLoadingTeams(false)
        }
    }

    // --- HANDLERS ---

    const handleSearchSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const newPage = 0
        setPage(newPage)
        updateUrlParams(searchQuery, newPage) // Zapisz do URL
        await fetchTeamsPage(newPage, searchQuery)
    }

    const handlePageChange = (newPage: number) => {
        if (newPage < 0 || newPage >= totalPages) return
        setPage(newPage)
        updateUrlParams(searchQuery, newPage) // Zapisz do URL
        fetchTeamsPage(newPage, searchQuery)
    }

    const toggleExpand = (teamId: number) => {
        setExpandedTeamId(prev => prev === teamId ? null : teamId)
    }

    const handleCountrySync = async (country: string) => {
        setCountryModalOpen(false)
        const toastId = toast.loading(`Rozpoczynanie synchronizacji dla: ${country}...`)
        try {
            await refreshTeamsForCountry(country)
            toast.success(`Zaktualizowano dane dla kraju: ${country}`, { id: toastId })
        } catch (err: any) {
            toast.error('Błąd synchronizacji', {
                id: toastId,
                description: err.message || 'Wystąpił błąd serwera.'
            })
        }
    }

    const handleRefreshSquad = async (team: TeamSummary) => {
        setActionLoading(true)
        try {
            await refreshSquad(team.id)
            toast.success(`Skład zespołu ${team.name} został odświeżony.`)
        } catch (err: any) {
            toast.error('Błąd aktualizacji składu', { description: err.message })
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteTeam = async (team: TeamSummary) => {
        if (!isAdmin) return
        if (!confirm(`Czy na pewno chcesz usunąć zespół ${team.name}?`)) return

        setActionLoading(true)
        try {
            await deleteTeam(team.id)
            toast.success(`Zespół ${team.name} usunięty.`)
            fetchTeamsPage(page, searchQuery)
        } catch (err: any) {
            toast.error('Błąd usuwania', { description: err.message })
        } finally {
            setActionLoading(false)
        }
    }

    const handleLogoClick = (e: React.MouseEvent, teamId: number) => {
        e.stopPropagation()
        // Nawigacja standardowa - URL z parametrami query/page pozostanie w historii przeglądarki
        navigate(`/team/external/${teamId}`)
    }

    const filteredCountries = SUPPORTED_COUNTRIES.filter(c =>
        c.toLowerCase().includes(countryFilter.toLowerCase())
    )

    // --- KOMPONENTY UI ---

    const PaginationBar = () => (
        <div className="flex items-center justify-between bg-card p-2 rounded-md border shadow-sm my-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0 || loadingTeams}
            >
                <ChevronLeft className="h-4 w-4 mr-2" /> Poprzednia
            </Button>
            <span className="text-sm text-muted-foreground font-mono">
                Strona {page + 1} z {totalPages || 1}
            </span>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1 || loadingTeams}
            >
                Następna <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
    )

    return (
        <div className="min-h-screen bg-muted/20 relative pb-12">

            {/* Header Sticky */}
            <header className="border-b bg-background sticky top-0 z-30 shadow-sm h-16 flex items-center">
                <div className="container px-4 max-w-7xl mx-auto flex justify-between items-center">

                    {/* LEWA STRONA: LOGO + TYTUŁ */}
                    <div
                        className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/dashboard')}
                        title="Wróć do Dashboardu"
                    >
                        <div className="relative h-10 w-10">
                            <img
                                src="/favicon.png"
                                alt="Club Logo"
                                className="h-full w-full object-contain drop-shadow-sm"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">Menedżer Danych</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Panel Administratora</p>
                        </div>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                    </Button>
                </div>
            </header>

            <main className="container py-8 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* --- LEWA KOLUMNA: FILTRY (Sticky) --- */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6 sticky top-24">
                        <Card className="shadow-md border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle className="text-lg">Filtrowanie</CardTitle>
                                <CardDescription>Wyszukaj zespoły</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSearchSubmit} className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Nazwa, kraj..."
                                            className="pl-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loadingTeams}>
                                        {loadingTeams ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Szukaj
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-blue-500" />
                                    Import Danych
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Dialog open={countryModalOpen} onOpenChange={setCountryModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <RefreshCw className="h-4 w-4 mr-2" /> Synchronizuj ligę
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Wybierz kraj do importu</DialogTitle>
                                            <DialogDescription>
                                                Pobierze listę zespołów z zewnętrznego API.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <Input
                                                placeholder="Filtruj..."
                                                value={countryFilter}
                                                onChange={(e) => setCountryFilter(e.target.value)}
                                            />
                                            <ScrollArea className="h-[250px] border rounded-md p-2">
                                                {filteredCountries.map((country) => (
                                                    <Button
                                                        key={country}
                                                        variant="ghost"
                                                        className="w-full justify-start"
                                                        onClick={() => handleCountrySync(country)}
                                                    >
                                                        {country}
                                                    </Button>
                                                ))}
                                            </ScrollArea>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- PRAWA KOLUMNA: LISTA (Scrollable) --- */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-4">

                        {/* Paginacja GÓRA */}
                        {teams.length > 0 && <PaginationBar />}

                        <div className="space-y-3 min-h-[400px]">
                            {loadingTeams && teams.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-dashed">
                                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                                    <p>Pobieranie danych...</p>
                                </div>
                            ) : teams.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-dashed">
                                    <Search className="h-10 w-10 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Brak wyników</p>
                                    <p className="text-sm">Użyj wyszukiwarki po lewej stronie.</p>
                                </div>
                            ) : (
                                teams.map((team) => {
                                    const isExpanded = expandedTeamId === team.id
                                    return (
                                        <Card
                                            key={team.id}
                                            className={cn(
                                                "transition-all duration-200 hover:shadow-md cursor-pointer border-l-4",
                                                isExpanded ? "border-l-primary ring-1 ring-primary/20" : "border-l-transparent"
                                            )}
                                            onClick={() => toggleExpand(team.id)}
                                        >
                                            <div className="p-4 flex items-center gap-4">
                                                <div
                                                    className="h-12 w-12 shrink-0 bg-white rounded border p-1 shadow-sm flex items-center justify-center hover:scale-105 transition-transform"
                                                    title="Przejdź do profilu publicznego"
                                                    onClick={(e) => handleLogoClick(e, team.id)}
                                                >
                                                    {team.logo ? (
                                                        <img src={team.logo} alt={team.name} className="h-full w-full object-contain" />
                                                    ) : (
                                                        <Shield className="h-6 w-6 text-muted-foreground/30" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-lg truncate">{team.name}</h3>
                                                        <Badge variant={team.national ? "default" : "secondary"} className="text-[10px]">
                                                            {team.national ? 'Narodowy' : 'Klub'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" /> {team.country}
                                                        <span className="text-muted-foreground/30">|</span>
                                                        Kod: <span className="font-mono text-xs">{team.code}</span>
                                                    </p>
                                                </div>

                                                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                                                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                </Button>
                                            </div>

                                            {isExpanded && (
                                                <div className="bg-muted/30 border-t p-4 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div className="text-sm space-y-1 text-muted-foreground">
                                                            <p>ID Bazy: <span className="font-mono text-foreground">{team.id}</span></p>
                                                            <p>Rok założenia: <span className="font-medium text-foreground">{team.founded || 'Brak'}</span></p>
                                                        </div>

                                                        <div className="flex gap-2 w-full md:w-auto">
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                onClick={(e) => { e.stopPropagation(); handleRefreshSquad(team); }}
                                                                disabled={actionLoading}
                                                            >
                                                                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2"/> : <RefreshCw className="h-3 w-3 mr-2"/>}
                                                                Odśwież Skład
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 md:flex-none"
                                                                onClick={(e) => handleLogoClick(e, team.id)}
                                                            >
                                                                <ExternalLink className="h-3 w-3 mr-2" /> Profil
                                                            </Button>

                                                            {isAdmin && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    className="flex-1 md:flex-none"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team); }}
                                                                    disabled={actionLoading}
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-2" /> Usuń
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    )
                                })
                            )}
                        </div>

                        {/* Paginacja DÓŁ */}
                        {teams.length > 0 && <PaginationBar />}
                    </div>
                </div>
            </main>
        </div>
    )
}