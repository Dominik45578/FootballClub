import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getClubs } from '@/lib/externalApi'
import { getTeamMembers, getTeamDetails } from '@/lib/userApi'

const positionLabels: Record<string, string> = {
  Goalkeeper: 'Bramkarz',
  Defender: 'Obrońca',
  Midfielder: 'Pomocnik',
  Attacker: 'Napastnik',
}

export function ClubSquadPage() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const [clubName, setClubName] = useState<string>('')
  const [players, setPlayers] = useState<any[]>([])
  const [positionFilter, setPositionFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubIdError, setClubIdError] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Skład klubu'
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    const load = async () => {
      const idNum = Number(clubId)
      if (!clubId || Number.isNaN(idNum) || idNum <= 0) {
        const msg = 'Brak poprawnego ID klubu w adresie'
        setError(msg)
        setClubIdError(msg)
        setPlayers([])
        setClubName('—')
        return
      }
      setClubIdError(null)
      setLoading(true)
      setError(null)
      try {
        // Pobierz nazwę z listy klubów (bez ryzykownych wywołań które mogą wymusić logowanie)
        try {
          const clubs = await getClubs({ page: 0, size: 50 })
          const found = clubs.items.find((c) => (c.id ?? c.teamId) === idNum)
          setClubName(found?.name ?? found?.teamName ?? `Klub ${idNum}`)
        } catch (err) {
          setClubName(`Klub ${idNum}`)
        }

        // Pobierz szczegóły zespołu (zawierające pole members) — użyj allowUnauth aby nie przekierowywać do /login przy 401/403
        try {
          const details = await getTeamDetails(idNum, { allowUnauth: true })
          if (details?.name) setClubName(details.name)
          const rawMembers: any[] = (details && (details as any).members) ? (details as any).members : []
          // mapuj członków na format tabeli
          const mapped = (rawMembers || []).map((m: any) => ({
            id: m.teamMemberId ?? m.memberId ?? m.id,
            name: `${m.firstName ?? m.name ?? ''}${m.lastName ? ' ' + m.lastName : ''}`.trim() || m.fullName || m.username || '—',
            number: (m.number ?? m.playerNumber ?? m.shirtNumber ?? m.jerseyNumber) || undefined,
            // Spróbuj odczytać pozycję z różnych pól; jeśli brak, zostaw undefined
            position: (m.position ?? m.positionName ?? m.role ?? undefined) as any,
            age: m.age ?? (m.birthDate ? Math.max(0, new Date().getFullYear() - new Date(m.birthDate).getFullYear()) : undefined) ?? undefined,
            status: m.status ?? undefined,
            roles: Array.isArray(m.roles) ? m.roles : (m.member?.roles ?? []),
          }))
          // Pokaż osoby z rolą TEAM_PLAYER niezależnie od statusu — UI filtruje po pozycji, więc tu pozostawiamy wszystkich
          setPlayers(mapped)
        } catch (e) {
          // fallback: jeśli getTeamDetails zawiedzie, spróbuj globalnego endpointu getTeamMembers
          const resp = await getTeamMembers(undefined, 0, 1000, { allowUnauth: true })
          const members = (resp?.items ?? resp ?? [])
          const mapped = (members || []).map((m: any) => ({
            id: m.teamMemberId ?? m.memberId ?? m.id,
            name: `${m.firstName ?? m.name ?? ''}${m.lastName ? ' ' + m.lastName : ''}`.trim() || m.username || '—',
            number: (m.number ?? m.shirtNumber ?? m.jerseyNumber) || undefined,
            position: (m.position ?? m.positionName) || undefined,
            age: m.age ?? m.years ?? undefined,
          }))
          setPlayers(mapped)
        }
         setError(null)
        // fallback do mocków jeśli nic nie zwrócono
        if (!players || players.length === 0) {
          const fallback = await (await import('@/lib/externalApi')).getClubSquad(-1)
          setPlayers(fallback)
        }
       } catch (e: any) {
         setError(e?.message || 'Nie udało się wczytać składu')
         const fallback = await (await import('@/lib/externalApi')).getClubSquad(-1)
         setPlayers(fallback)
       } finally {
         setLoading(false)
       }
     }
     load()
   }, [clubId])

  const filtered = useMemo(
    () => players.filter((p) => positionFilter === 'ALL' || p.position === positionFilter),
    [players, positionFilter]
  )

  const counts = useMemo(() => {
    return players.reduce<Record<string, number>>((acc, p) => {
      const pos = p.position || 'Inne'
      acc[pos] = (acc[pos] || 0) + 1
      return acc
    }, {})
  }, [players])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Skład klubu</h1>
          <Button variant="outline" onClick={() => navigate('/team-search')}>Wróć do wyszukiwarki</Button>
        </div>
      </header>
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
           <div>
             <CardTitle>Skład: {clubName || '—'}</CardTitle>
             <CardDescription>Lista zawodników z możliwością filtrowania po pozycji</CardDescription>
           </div>
         </CardHeader>
        <CardContent className="space-y-4 overflow-hidden">
           {(error || clubIdError) && <div className="text-sm text-destructive">{error || clubIdError}</div>}
           <div className="flex flex-wrap items-center gap-3">
             <div className="space-y-1">
               <span className="text-sm font-medium">Filtruj po pozycji</span>
               <Select value={positionFilter} onValueChange={setPositionFilter}>
                 <SelectTrigger className="w-40"><SelectValue placeholder="Wszystkie" /></SelectTrigger>
                 <SelectContent
                   position="popper"
                   className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg [&_[data-radix-select-viewport]]:bg-white dark:[&_[data-radix-select-viewport]]:bg-slate-900"
                 >
                   <SelectItem
                     value="ALL"
                     className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
                   >Wszystkie</SelectItem>
                   <SelectItem
                     value="Goalkeeper"
                     className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
                   >Bramkarze</SelectItem>
                   <SelectItem
                     value="Defender"
                     className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
                   >Obrońcy</SelectItem>
                   <SelectItem
                     value="Midfielder"
                     className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
                   >Pomocnicy</SelectItem>
                   <SelectItem
                     value="Attacker"
                     className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
                   >Napastnicy</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
               {Object.entries(counts).map(([pos, val]) => (
                 <span key={pos}>{positionLabels[pos] || pos}: {val}</span>
               ))}
             </div>
           </div>

           <div className="rounded-lg border w-full overflow-x-auto">
            <table className="table-auto text-sm w-full min-w-[520px]">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left px-3 py-2 rounded-tl-lg">#</th>
                  <th className="text-left px-3 py-2">Zawodnik</th>
                  <th className="text-left px-3 py-2">Pozycja</th>
                  <th className="text-left px-3 py-2 rounded-tr-lg">Wiek</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p.id ?? idx} className="border-t odd:bg-muted/40 hover:bg-muted/60">
                    <td className="px-3 py-2 font-semibold">{p.number || idx + 1}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{positionLabels[p.position || ''] || '—'}</td>
                    <td className="px-3 py-2">{p.age || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && !error && (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Brak graczy dla wybranego filtra.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Ładowanie...</td></tr>
                )}
                {error && filtered.length === 0 && !loading && (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Spróbuj wrócić do wyszukiwarki i wybrać klub ponownie.</td></tr>
                )}
              </tbody>
            </table>
          </div>
           {!clubId && (
             <div className="text-sm text-muted-foreground">Brak ID klubu w adresie. Wróć do wyszukiwarki, aby wybrać zespół.</div>
           )}
         </CardContent>
       </Card>
      </main>
     </div>
   )
 }

export default ClubSquadPage
