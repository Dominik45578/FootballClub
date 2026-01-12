import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { Eye, UserCheck, UserX, Search as SearchIcon, RotateCw } from 'lucide-react'
import { searchMembers, getMyProfile } from '@/lib/userApi'

export function MemberSearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [members, setMembers] = useState<Array<{ id: number; firstName: string; lastName: string; age?: number; roles?: string[]; status?: string }>>([])
  const [memberAllowed, setMemberAllowed] = useState(true)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [checkedAccess, setCheckedAccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const prev = document.title
    document.title = 'Członkowie'
    return () => { document.title = prev }
  }, [])

  const filtered = useMemo(() => members, [members])

  const handleSearch = async (resetPage = false) => {
    if (!memberAllowed) return
    setLoading(true)
    try {
      const targetPage = resetPage ? 0 : page
      const res = await searchMembers(query, targetPage, 10, { allowUnauth: true })
      setMembers(res.items)
      setTotal(res.total ?? res.items.length)
      if (resetPage) setPage(0)
    } catch (err: any) {
      setMemberAllowed(false)
      setMemberError(err?.message || 'Brak dostępu — zostań członkiem')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleSearch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let mounted = true
    getMyProfile({ allowUnauth: true })
      .then(() => { if (mounted) { setMemberAllowed(true); setMemberError(null); handleSearch(true); setCheckedAccess(true) } })
      .catch((err: any) => {
        if (!mounted) return
        setMemberAllowed(false)
        setMemberError(err?.message || 'Brak dostępu — zostań członkiem')
        setMembers([])
        setCheckedAccess(true)
      })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (memberAllowed) handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / 10)), [total])

  if (checkedAccess && !memberAllowed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container flex h-16 items-center px-4">
            <h1 className="text-2xl font-bold">Członkowie</h1>
          </div>
        </header>
        <main className="container py-8 px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-amber-500 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            {memberError || 'Brak dostępu — zostań zatwierdzonym członkiem, aby przeglądać listę członków.'}
          </div>
        </main>
      </div>
    )
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
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="np. Jan" disabled={!memberAllowed} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSearch(true)} disabled={loading || !memberAllowed}>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Szukaj
                </Button>
                <Button variant="outline" onClick={() => { setQuery(''); setPage(0); handleSearch(true) }} disabled={loading || !memberAllowed}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Wyczyść
                </Button>
              </div>
            </div>
            {memberError && (
              <div className="rounded-md border border-amber-500 bg-amber-50 text-amber-800 px-3 py-2 text-sm">{memberError}. Wypełnij formularz członkowski, aby uzyskać dostęp.</div>
            )}

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
                      <td className="px-3 py-2 font-semibold">{idx + 1 + page * 10}</td>
                      <td className="px-3 py-2">{m.firstName} {m.lastName}</td>
                      <td className="px-3 py-2">{m.age ?? '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {(m.roles ?? []).map((r) => (<Badge key={r} variant="outline">{r}</Badge>))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={m.status === 'ACTIVE' ? 'default' : 'secondary'}>{m.status ?? '—'}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/member/${m.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Podgląd
                          </Button>
                          {m.status === 'WAITING' && (
                            <>
                              <Button size="sm" variant="default" onClick={() => {/* approve handled elsewhere */}}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Zatwierdź
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => {/* reject handled elsewhere */}}>
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

export default MemberSearchPage

