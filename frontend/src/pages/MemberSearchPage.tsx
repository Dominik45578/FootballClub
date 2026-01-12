import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { Eye, UserCheck, UserX, Search as SearchIcon, RotateCw } from 'lucide-react'

const mockMembers = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  fullName: `Zawodnik ${i + 1}`,
  roles: i % 3 === 0 ? ['GOALKEEPER'] : ['PLAYER'],
  status: i % 4 === 0 ? 'WAITING' : 'ACTIVE',
  number: 10 + i,
}))

export function MemberSearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<typeof mockMembers>(mockMembers)
  const navigate = useNavigate()

  useEffect(() => {
    const prev = document.title
    document.title = 'Członkowie'
    return () => { document.title = prev }
  }, [])

  const filtered = useMemo(() => {
    return members.filter((m) =>
      m.fullName.toLowerCase().includes(query.toLowerCase().trim())
    )
  }, [members, query])

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      setMembers(mockMembers)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">Członkowie</h1>
        </div>
      </header>
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Wyszukaj członków</CardTitle>
            <CardDescription>Tryb offline — filtruj po imieniu/nazwisku, zobacz status i numer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px] space-y-1">
                <label className="text-sm font-medium">Szukaj</label>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="np. Jan" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={loading}>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Szukaj
                </Button>
                <Button variant="outline" onClick={() => { setQuery(''); handleSearch() }} disabled={loading}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Wyczyść
                </Button>
              </div>
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm table-auto">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="px-3 py-2 text-left rounded-tl-lg">#</th>
                    <th className="px-3 py-2 text-left">Imię i nazwisko</th>
                    <th className="px-3 py-2 text-left">Numer</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left rounded-tr-lg">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`s-${i}`} className="border-t">
                        <td className="px-3 py-3" colSpan={6}><Skeleton className="h-4 w-full" /></td>
                      </tr>
                    ))
                  )}
                  {!loading && filtered.map((m, idx) => (
                    <tr key={m.id} className="border-t odd:bg-muted/40 hover:bg-muted/60">
                      <td className="px-3 py-2 font-semibold">{idx + 1}</td>
                      <td className="px-3 py-2">{m.fullName}</td>
                      <td className="px-3 py-2">{m.number}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {m.roles.map((r) => (<Badge key={r} variant="outline">{r}</Badge>))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={m.status === 'ACTIVE' ? 'default' : 'secondary'}>{m.status}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/member/${m.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Podgląd
                          </Button>
                          {m.status === 'WAITING' && (
                            <>
                              <Button size="sm" variant="default" onClick={() => { /* mock approve */ }}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Zatwierdź
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { /* mock reject */ }}>
                                <UserX className="mr-2 h-4 w-4" />
                                Odrzuć
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Brak wyników</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default MemberSearchPage

