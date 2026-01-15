import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getTeams } from '@/lib/userApi'
import { toast } from 'sonner'
import { Eye, Search as SearchIcon, RotateCw } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (teamId: number) => void
}

export default function TeamSearchModal({ open, onOpenChange, onSelect }: Props) {
  const [name, setName] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(5)
  const [loading, setLoading] = useState(false)
  const [clubs, setClubs] = useState<{ items: any[]; total: number }>({ items: [], total: 0 })

  useEffect(() => {
    if (!open) return
    fetchClubsSafe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page])

  // Debug: log clubs/state when not loading
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      console.debug('[TeamSearchModal] clubs', clubs, { name, page, size })
    }
  }, [loading, clubs, name, page, size])

  const fetchClubs = async () => {
    setLoading(true)
    try {
      const res = await getTeams({ mode: 'ALL_TEAMS', name, page, size }, { allowUnauth: true })
      setClubs({ items: res.items, total: res.total ?? res.items.length })
      // @ts-ignore
      const fromMock = (res as any).fromMock
      // @ts-ignore
      const err = (res as any).error
      if (fromMock && err) {
        console.warn('[TeamSearchModal] backend returned mock fallback', err)
      }
    } finally {
      setLoading(false)
    }
  }

  // Safer wrapper with error handling
  const fetchClubsSafe = async () => {
    try {
      await fetchClubs()
    } catch (err: any) {
      console.error('TeamSearchModal.fetchClubs error', err)
      setClubs({ items: [], total: 0 })
      toast.error('Błąd wyszukiwania zespołów', { description: err?.message })
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil((clubs.total || 0) / size)), [clubs.total, size])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wybierz zespół do edycji</DialogTitle>
          <DialogDescription>Szukaj po nazwie i wybierz zespół, aby wypełnić formularz edycji.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Nazwa</label>
              <div className="relative">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Real" />
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 h-4 w-4" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setPage(0); fetchClubsSafe() }} disabled={loading}>
                <SearchIcon className="mr-2 h-4 w-4" />Szukaj
              </Button>
              <Button variant="outline" onClick={() => { setName(''); setPage(0); fetchClubs() }} disabled={loading}>
                <RotateCw className="mr-2 h-4 w-4" />Wyczyść
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loading && clubs.items.length === 0 && (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`s-${i}`} className="rounded-lg border p-3 bg-card animate-pulse">
                  <div className="h-4 w-3/5 bg-muted/40 rounded mb-2" />
                  <div className="h-3 w-1/3 bg-muted/30 rounded" />
                </div>
              ))
            )}

            {!loading && clubs.items.map((c, idx) => {
              const clubId = c.teamId ?? c.id
              const clubName = c.teamName ?? c.name ?? '—'
              return (
                <div key={clubId ?? `${clubName}-${idx}`} className="rounded-lg border p-3 bg-card flex items-center justify-between hover:shadow">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold">{clubName}</div>
                      <div className="text-xs text-muted-foreground">{c.category || '—'}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Liczba członków: {c.numberOfMembers ?? '—'}</div>
                  </div>
                  <div>
                    <Button size="sm" variant="outline" onClick={() => clubId && onSelect(clubId)} disabled={!clubId}>
                      <Eye className="mr-2 h-4 w-4"/>Wybierz
                    </Button>
                  </div>
                </div>
              )
            })}

            {!loading && clubs.items.length === 0 && (
              <div className="rounded-lg border p-4 text-center text-muted-foreground">Brak wyników</div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Strona {page + 1} / {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>Poprzednia</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || loading}>Następna</Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
