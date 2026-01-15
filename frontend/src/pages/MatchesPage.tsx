import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { getMyMatches, type MatchResponse, statusToLabel } from '@/lib/matchesApi'

const formatOpponent = (m: MatchResponse) => {
    const isHomeInternal = m.homeTeam?.isInternal
    return isHomeInternal ? m.awayTeam?.name ?? '—' : m.homeTeam?.name ?? '—'
}

const formatSource = (m: MatchResponse) => (m.homeTeam?.isInternal ? 'internal' : 'external')

const formatDate = (iso?: string) => (iso ? iso.split('T')[0] : '—')

export function MatchesPage() {
     const navigate = useNavigate()
     const [matches, setMatches] = useState<MatchResponse[] | null>(null)
     const [loading, setLoading] = useState(false)
     const [error, setError] = useState<string | null>(null)

     useEffect(() => {
         const prev = document.title
         document.title = 'Mecze'
         setLoading(true)
         getMyMatches(0, 50).then(p => { setMatches(p.content); setLoading(false) }).catch(e => { setError(String(e?.message || e)); setLoading(false) })
         return () => {
             document.title = prev
         }
     }, [])

     return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-card">
				<div className="container flex h-16 items-center px-4 justify-between">
					<h1 className="text-2xl font-bold">Mecze</h1>
					<Button variant="outline" onClick={() => navigate('/dashboard')}>
						Wróć do panelu
					</Button>
				</div>
			</header>
			<main className="container py-8">
				<Card>
					<CardHeader className="flex flex-col gap-1">
						<CardDescription>
							Dane przeciwników pochodzą z importu (cache), nasza drużyna z systemu
							wewnętrznego.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						{loading && <div className="text-sm text-muted-foreground">Ładowanie meczów…</div>}
						{error && <div className="text-sm text-destructive">Błąd: {error}</div>}
						{!loading && !error && matches && matches.length === 0 && (
							<div className="rounded-lg border bg-slate-900/60 text-slate-100 p-4 text-sm">Brak meczów.</div>
						)}
						{!loading && !error && matches?.map((m) => (
							<div
								key={m.matchId}
								className="rounded-lg border bg-slate-900/60 text-slate-100 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h3 className="text-lg font-semibold">{formatOpponent(m)}</h3>
										<Badge variant={formatSource(m) === 'external' ? 'secondary' : 'default'}>
											{formatSource(m) === 'external' ? 'Dane z importu' : 'Nasza drużyna'}
										</Badge>
									</div>
									<p className="text-sm text-slate-200/80">
										{formatDate(m.matchDate)}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="outline">{statusToLabel(m.status)}</Badge>
									<Button variant="outline" onClick={() => navigate(`/matches/${m.matchId}`)}>
										Szczegóły
									</Button>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</main>
		</div>
	)
}

export default MatchesPage
