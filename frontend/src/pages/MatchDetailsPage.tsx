import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate, useParams } from 'react-router-dom'

const mockMatch = {
  id: 101,
  opponent: 'FC Placeholder',
  date: '2024-08-12',
  venue: 'Stadion Miejski',
  source: 'external' as const,
  lastUpdated: '15 min temu',
  status: 'Zaplanowany',
  note: 'Dane przeciwnika pochodzą z importu; tylko podgląd.',
  ourTeam: {
    name: 'Nasza drużyna',
    editable: true,
  },
  opponentTeam: {
    name: 'FC Placeholder',
    editable: false,
  },
}

export function MatchDetailsPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    const prev = document.title
    document.title = matchId ? `Mecz #${matchId}` : 'Szczegóły meczu'
    return () => { document.title = prev }
  }, [matchId])
  const data = matchId ? { ...mockMatch, id: Number(matchId) } : mockMatch

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">Szczegóły meczu</h1>
        </div>
      </header>
      <main className="container py-8">
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>Mecz #{data.id} — {data.opponent}</CardTitle>
            <Badge variant={data.source === 'external' ? 'secondary' : 'default'}>
              {data.source === 'external' ? 'Dane z importu' : 'Nasza drużyna'}
            </Badge>
          </div>
          <CardDescription>{data.date} • {data.venue}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border bg-slate-900/60 text-slate-100">
            <p className="text-sm text-slate-200/80">Status: <Badge variant="outline">{data.status}</Badge></p>
            <p className="text-xs text-slate-400 mt-1">Ostatnia aktualizacja: {data.lastUpdated}</p>
            <p className="text-sm mt-2 text-slate-200/80">{data.note}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold">Nasza drużyna</h3>
              <p className="text-sm text-muted-foreground">Dane wewnętrzne — można edytować (gdy podłączysz backend).</p>
              <Button className="mt-3" variant="outline" disabled>Edytuj skład (mock)</Button>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold">Przeciwnik</h3>
              <p className="text-sm text-muted-foreground">Dane z importu — tylko podgląd.</p>
              <Button className="mt-3" variant="outline" disabled>Podgląd składu (mock)</Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/matches')}>Powrót do listy meczów</Button>
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  )
}

export default MatchDetailsPage
