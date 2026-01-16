import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getTeams } from '@/lib/userApi'
import { useNavigate } from 'react-router-dom'
import { Eye, Search as SearchIcon, RotateCw, ArrowLeft, Edit, Trash2, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { hasRole } from '@/lib/auth'

export function TeamSearchPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)
    const [size] = useState(10) // Zwiększyłem domyślny rozmiar dla lepszej czytelności
    const [loading, setLoading] = useState(false)
    const [clubs, setClubs] = useState<{ items: any[]; total: number }>({ items: [], total: 0 })
    const [backendError, setBackendError] = useState<{ status?: number | null; message?: string | null; respText?: string | null; location?: string | null } | null>(null)

    // Admin check
    const isAdmin = hasRole('ADMIN')

    const navigate = useNavigate()

    useEffect(() => {
        const prev = document.title
        document.title = 'Wyszukiwarka klubów'
        return () => { document.title = prev }
    }, [])

    const fetchClubs = async () => {
        setLoading(true)
        try {
            // Logika: Jeśli wpisano liczbę -> szukaj po teamId, inaczej po name
            const isIdSearch = searchQuery.trim() !== '' && !isNaN(Number(searchQuery))

            const params: any = {
                mode: 'ALL_TEAMS',
                page,
                size
            }

            if (searchQuery.trim()) {
                if (isIdSearch) {
                    params.teamId = Number(searchQuery)
                } else {
                    params.name = searchQuery
                }
            }

            // userApi.getTeams uderza do endpointu: /user/teams (zgodnie z gateway/user/...)
            const res = await getTeams(params, { allowUnauth: true })

            setClubs({ items: res.items, total: res.total ?? res.items.length })
            setBackendError((res as any).fromMock ? (res as any).error ?? null : null)
        } catch (err: any) {
            console.error('TeamSearchPage.fetchClubs error', err)
            setClubs({ items: [], total: 0 })
            // Tylko logujemy błąd, nie czyścimy tabeli jeśli to np. błąd sieci chwilowy
            toast.error('Błąd pobierania danych', { description: err?.message })
        } finally {
            setLoading(false)
        }
    }

    // Wywołanie przy zmianie strony
    useEffect(() => { fetchClubs() }, [page])

    const handleSearchClick = () => {
        setPage(0)
        fetchClubs()
    }

    const handleClear = () => {
        setSearchQuery('')
        setPage(0)
        // Po wyczyszczeniu pobierz wszystko
        setTimeout(() => fetchClubs(), 0)
    }

    // Placeholdery dla akcji admina
    const handleEdit = (id: number) => {
        console.log(`[ADMIN] Edit team ID: ${id}`)
        toast.info(`Edycja zespołu ${id} (funkcja w budowie)`)
    }

    const handleDelete = (id: number) => {
        console.log(`[ADMIN] Delete team ID: ${id}`)
        toast.info(`Usuwanie zespołu ${id} (funkcja w budowie)`)
    }

    const totalPages = useMemo(() => Math.max(1, Math.ceil((clubs.total || 0) / size)), [clubs.total, size])

    // Formatowanie daty - "ładny" format
    const formatDate = (isoString?: string) => {
        if (!isoString) return '—'
        const date = new Date(isoString)
        if (isNaN(date.getTime())) return '—'

        return date.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <img src="/favicon.png" alt="Logo" className="h-8 w-8 object-contain" />
                        <h1 className="text-2xl font-bold">Wyszukiwarka klubów</h1>
                    </div>
                    <div>
                        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                        </Button>
                    </div>
                </div>
            </header>

            {/* Wyśrodkowany kontener główny */}
            <main className="container py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <Card className="shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardDescription>Filtruj po nazwie lub ID i przejdź do szczegółów zespołu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 overflow-hidden">

                        {/* Pasek wyszukiwania */}
                        <div className="grid gap-3 md:grid-cols-3">
                            {backendError && (
                                <div className="col-span-3 p-3 rounded border bg-yellow-50 text-sm">
                                    Backend odrzucił żądanie (status: {backendError.status ?? '—'}). Wyświetlane są dane mockowe.
                                    <div className="mt-2 flex gap-2">
                                        <Button size="sm" onClick={handleSearchClick}><RotateCw className="mr-2 h-4 w-4"/>Spróbuj ponownie</Button>
                                        <div className="text-muted-foreground">{backendError.message ?? backendError.respText ?? ''}</div>
                                    </div>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium">Nazwa lub ID zespołu</label>
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="np. Real Madryt lub 123"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleSearchClick} disabled={loading} className="flex-1 md:flex-none">
                                    <SearchIcon className="mr-2 h-4 w-4" />
                                    Szukaj
                                </Button>
                                <Button variant="outline" onClick={handleClear} disabled={loading}>
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    Wyczyść
                                </Button>
                            </div>
                        </div>

                        {/* Tabela wyników */}
                        <div className="w-full overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm table-auto min-w-[800px]">
                                <thead>
                                <tr className="bg-muted/60">
                                    <th className="text-left py-3 px-4 rounded-tl-lg w-[60px]">ID</th>
                                    <th className="text-left py-3 px-4">Nazwa zespołu</th>
                                    <th className="text-left py-3 px-4">Kategoria</th>
                                    <th className="text-left py-3 px-4">Data utworzenia</th>
                                    <th className="text-left py-3 px-4">Członkowie</th>
                                    <th className="text-right py-3 px-4 rounded-tr-lg">Akcje</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading && clubs.items.length === 0 && (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={`skeleton-${i}`} className="border-t">
                                            <td className="px-4 py-4" colSpan={6}>
                                                <Skeleton className="h-6 w-full" />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {!loading && clubs.items.map((c, idx) => {
                                    const clubId = c.teamId ?? c.id
                                    const clubName = c.teamName ?? c.name ?? '—'
                                    return (
                                        <tr key={clubId ?? idx} className="border-t odd:bg-muted/40 hover:bg-muted/60 transition-colors">
                                            <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                                                {clubId}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-base">
                                                {clubName}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="secondary" className="font-normal">{c.category || '—'}</Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-3 w-3 opacity-70" />
                                                    <span className="capitalize">{formatDate(c.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {c.numberOfMembers ?? c.memberCount ?? '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => clubId && navigate(`/team-details/${clubId}`)} disabled={!clubId}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Szczegóły
                                                    </Button>

                                                    {/* Przyciski Admina */}
                                                    {isAdmin && clubId && (
                                                        <>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(clubId)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(clubId)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                {clubs.items.length === 0 && !loading && (
                                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Brak wyników spełniających kryteria.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginacja */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                            <span className="text-sm text-muted-foreground">Strona {page + 1} z {totalPages} (Suma: {clubs.total})</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>Poprzednia</Button>
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || loading}>Następna</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

export default TeamSearchPage