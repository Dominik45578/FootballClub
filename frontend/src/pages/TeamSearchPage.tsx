import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getClubs } from '@/lib/externalApi'
import { useNavigate } from 'react-router-dom'

export function TeamSearchPage() {
    const [name, setName] = useState('')
    const [country, setCountry] = useState('')
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
            const res = await getClubs({ name, country, page, size })
            setClubs(res)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchClubs() }, [page])

    const totalPages = useMemo(() => Math.max(1, Math.ceil((clubs.total || 0) / size)), [clubs.total, size])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center px-4">
                    <h1 className="text-2xl font-bold">Wyszukiwarka klubów</h1>
                </div>
            </header>
            <main className="container py-8">
            <Card>
                <CardHeader>
                    <CardDescription>Filtruj po nazwie i kraju, zobacz stadion i przejdź do składu</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 overflow-hidden">
                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <label className="text-sm font-medium">Nazwa</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Real" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Kraj</label>
                            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="np. Spain" />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={() => { setPage(0); fetchClubs() }} disabled={loading}>Szukaj</Button>
                            <Button variant="outline" onClick={() => { setName(''); setCountry(''); setPage(0); fetchClubs() }} disabled={loading}>Wyczyść</Button>
                        </div>
                    </div>

                    <div className="w-full overflow-x-hidden">
                        <table className="w-full text-sm table-auto">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Klub</th>
                                    <th className="text-left py-2">Kraj</th>
                                    <th className="text-left py-2">Rok</th>
                                    <th className="text-left py-2">Stadion</th>
                                    <th className="text-left py-2">Pojemność</th>
                                    <th className="text-left py-2">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clubs.items.map((c) => {
                                    const clubId = c.id ?? c.teamId
                                    const clubName = c.name ?? c.teamName ?? '—'
                                    return (
                                    <tr key={clubId ?? c.name} className="border-b hover:bg-muted/50">
                                        <td className="py-2 font-medium">{clubName}</td>
                                        <td className="py-2">{c.country || '—'}</td>
                                        <td className="py-2">{c.founded || '—'}</td>
                                        <td className="py-2">{c.venue?.name || '—'}</td>
                                        <td className="py-2">{c.venue?.capacity ? c.venue.capacity.toLocaleString() : '—'}</td>
                                        <td className="py-2 flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => clubId && navigate(`/team-details/${clubId}`)} disabled={!clubId}>Szczegóły</Button>
                                            <Button size="sm" onClick={() => clubId && navigate(`/club/${clubId}/squad`)} disabled={!clubId}>Skład</Button>
                                        </td>
                                    </tr>
                                )})}
                                {clubs.items.length === 0 && !loading && (
                                    <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Brak wyników</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between">
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
