import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate, useParams } from 'react-router-dom'
import { getMatchById, statusToLabel, isTeamEditable, type MatchResponse } from '@/lib/matchesApi'

const getOpponentName = (m: MatchResponse | null) => {
  if (!m) return '—'
  return m.homeTeam?.isInternal ? (m.awayTeam?.name ?? '—') : (m.homeTeam?.name ?? '—')
}

const getSourceLabel = (m: MatchResponse | null) => (m?.homeTeam?.isInternal ? 'Nasza drużyna' : 'Dane z importu')
const formatDate = (iso?: string) => (iso ? iso.split('T')[0] : '—')

export function MatchDetailsPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<MatchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.title
    document.title = matchId ? `Mecz #${matchId}` : 'Szczegóły meczu'
    if (matchId) {
      setLoading(true)
      getMatchById(Number(matchId)).then(d => setData(d)).catch(e => setError(String(e?.message || e))).finally(() => setLoading(false))
    } else {
      setData(null)
    }
    return () => { document.title = prev }
  }, [matchId])

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
            <CardTitle>Mecz #{data?.matchId} — {getOpponentName(data)}</CardTitle>
            <Badge variant={data?.homeTeam?.isInternal ? 'default' : 'secondary'}>
              {getSourceLabel(data)}
            </Badge>
          </div>
          <CardDescription>{formatDate(data?.matchDate)} • {data ? `${data.homeTeam?.name} vs ${data.awayTeam?.name}` : '—'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <div className="p-4">Ładowanie szczegółów meczu…</div>}
          {error && <div className="p-4 text-destructive">Błąd: {error}</div>}
          {data && (
            <>
              <div className="p-4 rounded-lg border bg-slate-900/60 text-slate-100">
                <p className="text-sm text-slate-200/80">Status: <Badge variant="outline">{statusToLabel(data.status)}</Badge></p>
                <p className="text-sm mt-2 text-slate-200/80">Data: {data.matchDate}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border bg-card">
                  <h3 className="text-lg font-semibold">Nasza drużyna</h3>
                  <p className="text-sm text-muted-foreground">{isTeamEditable(data.homeTeam) ? 'Dane wewnętrzne — można edytować.' : 'Brak dostępu do edycji.'}</p>
                  <Button className="mt-3" variant="outline" disabled={!isTeamEditable(data.homeTeam)}>Edytuj skład</Button>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h3 className="text-lg font-semibold">Przeciwnik</h3>
                  <p className="text-sm text-muted-foreground">{isTeamEditable(data.awayTeam) ? 'Dane wewnętrzne — można edytować.' : 'Dane z importu — tylko podgląd.'}</p>
                  <Button className="mt-3" variant="outline" disabled={!isTeamEditable(data.awayTeam)}>Podgląd składu</Button>
                </div>
              </div>
            </>
          )}

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
