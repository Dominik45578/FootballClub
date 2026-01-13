import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getTeams } from '@/lib/userApi'
import { useNavigate } from 'react-router-dom'
import { Eye, Search as SearchIcon, RotateCw, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function TeamSearchPage() {
    const [name, setName] = useState('')
    const [page, setPage] = useState(0)
    const [size] = useState(5)
    const [loading, setLoading] = useState(false)
    const [clubs, setClubs] = useState<{ items: any[]; total: number }>({ items: [], total: 0 })
    const navigate = useNavigate()

    useEffect(() => {
        const prev = document.title
        document.title = 'Wyszukiwarka klubów'
        return () => { document.title = prev }
    }, [])

    const fetchClubs = async () => {
        setLoading(true)
        try {
            const res = await getTeams({ mode: 'ALL_TEAMS', name, page, size }, { allowUnauth: true })
            setClubs({ items: res.items, total: res.total ?? res.items.length })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchClubs() }, [page])

    const totalPages = useMemo(() => Math.max(1, Math.ceil((clubs.total || 0) / size)), [clubs.total, size])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Wyszukiwarka klubów</h1>
                    <div>
                        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container py-8 px-4 sm:px-6 lg:px-8">
                <Card className="shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardDescription>Filtruj po nazwie i przejdź do szczegółów zespołu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 overflow-hidden">
                        <div className="grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium">Nazwa</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Real" />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={() => { setPage(0); fetchClubs() }} disabled={loading}>
                                    <SearchIcon className="mr-2 h-4 w-4" />
                                    Szukaj
                                </Button>
                                <Button variant="outline" onClick={() => { setName(''); setPage(0); fetchClubs() }} disabled={loading}>
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    Wyczyść
                                </Button>
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm table-auto min-w-[700px]">
                                <thead>
                                    <tr className="bg-muted/60">
                                        <th className="text-left py-2 px-3 rounded-tl-lg">#</th>
                                        <th className="text-left py-2 px-3">Nazwa zespołu</th>
                                        <th className="text-left py-2 px-3">Kategoria</th>
                                        <th className="text-left py-2 px-3">Liczba członków</th>
                                        <th className="text-left py-2 px-3">Mój status</th>
                                        <th className="text-left py-2 px-3 rounded-tr-lg">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && clubs.items.length === 0 && (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={`skeleton-${i}`} className="border-t">
                                                <td className="px-3 py-3" colSpan={6}>
                                                    <Skeleton className="h-4 w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {!loading && clubs.items.map((c, idx) => {
                                        const clubId = c.teamId ?? c.id
                                        const clubName = c.teamName ?? c.name ?? '—'
                                        return (
                                        <tr key={clubId ?? c.name} className="border-t odd:bg-muted/40 hover:bg-muted/60">
                                            <td className="py-2 px-3 font-medium">
                                                <Badge variant="outline">{idx + 1 + page * size}</Badge>
                                            </td>
                                            <td className="py-2 px-3 font-medium flex items-center gap-2">
                                                {clubName}
                                            </td>
                                            <td className="py-2 px-3">{c.category || '—'}</td>
                                            <td className="py-2 px-3">{c.numberOfMembers ?? '—'}</td>
                                            <td className="py-2 px-3">{c.myStatus ?? '—'}</td>
                                            <td className="py-2 px-3">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => clubId && navigate(`/team-details/${clubId}`)} disabled={!clubId}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Szczegóły
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                    {clubs.items.length === 0 && !loading && (
                                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Brak wyników</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm text-muted-foreground">Strona {page + 1} / {totalPages}</span>
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
