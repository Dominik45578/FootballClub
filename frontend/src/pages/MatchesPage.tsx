import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

// Mockowane dane meczów (tryb offline)
const mockMatches = [
	{
		id: 101,
		opponent: 'FC Placeholder',
		date: '2024-08-12',
		venue: 'Stadion Miejski',
		source: 'external',
		lastUpdated: '15 min temu',
		status: 'Zaplanowany',
	},
	{
		id: 102,
		opponent: 'Real Test',
		date: '2024-08-20',
		venue: 'Nasze boisko',
		source: 'internal',
		lastUpdated: '10 min temu',
		status: 'Zaplanowany',
	},
]

export function MatchesPage() {
	const navigate = useNavigate()

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-card">
				<div className="container flex h-16 items-center px-4">
					<h1 className="text-2xl font-bold">Mecze</h1>
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
						{mockMatches.map((m) => (
							<div
								key={m.id}
								className="rounded-lg border bg-slate-900/60 text-slate-100 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<h3 className="text-lg font-semibold">{m.opponent}</h3>
										<Badge
											variant={
												m.source === 'external' ? 'secondary' : 'default'
											}
										>
											{m.source === 'external'
												? 'Dane z importu'
												: 'Nasza drużyna'}
										</Badge>
									</div>
									<p className="text-sm text-slate-200/80">
										{m.date} • {m.venue}
									</p>
									<p className="text-xs text-slate-400">
										Ostatnia aktualizacja: {m.lastUpdated}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="outline">{m.status}</Badge>
									<Button
										variant="outline"
										onClick={() => navigate(`/matches/${m.id}`)}
									>
										Szczegóły
									</Button>
								</div>
							</div>
						))}
						{mockMatches.length === 0 && (
							<div className="rounded-lg border bg-slate-900/60 text-slate-100 p-4 text-sm">
								Brak meczów w harmonogramie (mock).
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	)
}

export default MatchesPage
