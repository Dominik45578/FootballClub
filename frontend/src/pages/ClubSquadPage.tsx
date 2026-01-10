import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getClubSquad, getClubs } from '@/lib/externalApi'

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
  const [positionFilter, setPositionFilter] = useState<string>('')

  useEffect(() => {
    const prev = document.title
    document.title = 'Skład klubu'
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    const load = async () => {
      const idNum = Number(clubId)
      if (!idNum) return
      const squad = await getClubSquad(idNum)
      setPlayers(squad)
      // Best-effort: fetch club name from list (mock) to show header
      const clubs = await getClubs({ page: 0, size: 50 })
      const found = clubs.items.find((c) => c.id === idNum)
      setClubName(found?.name || `Klub ${idNum}`)
    }
    load()
  }, [clubId])

  const filtered = useMemo(
    () => players.filter((p) => !positionFilter || p.position === positionFilter),
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
    <div className="min-h-screen bg-background">
      <Card className="container mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Skład: {clubName || '—'}</CardTitle>
            <CardDescription>Lista zawodników z możliwością filtrowania po pozycji</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/team-search')}>Wróć do wyszukiwarki</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <span className="text-sm font-medium">Filtruj po pozycji</span>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Wszystkie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Wszystkie</SelectItem>
                  <SelectItem value="Goalkeeper">Bramkarze</SelectItem>
                  <SelectItem value="Defender">Obrońcy</SelectItem>
                  <SelectItem value="Midfielder">Pomocnicy</SelectItem>
                  <SelectItem value="Attacker">Napastnicy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
              {Object.entries(counts).map(([pos, val]) => (
                <span key={pos}>{positionLabels[pos] || pos}: {val}</span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 flex flex-col gap-2 bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">{p.number || '—'}</div>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{positionLabels[p.position || ''] || '—'}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex gap-4">
                  <span>Wiek: {p.age || '—'}</span>
                  <span>Nr: {p.number || '—'}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">Brak graczy dla wybranego filtra.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClubSquadPage

