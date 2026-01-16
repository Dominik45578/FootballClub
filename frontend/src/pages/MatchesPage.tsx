import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAllMatches, getMyMatches, type MatchResponse, statusToLabel } from '@/lib/matchesApi'
import { getToken, parseJwtPayload } from '@/lib/auth'

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
     const [forbidden, setForbidden] = useState(false)
     const [infoMessage, setInfoMessage] = useState<string | null>(null)

    // Helper to load user's matches and set info - dostępny dla całego komponentu
    const fallbackToMyMatches = async (notice?: string) => {
        try {
            setInfoMessage(notice ?? 'Brak uprawnień do wszystkich meczów — wyświetlam Twoje mecze.')
            setLoading(true)
            const p = await getMyMatches(0, 50)
            setMatches(p.content)
        } catch (e: any) {
            setError(String(e?.message || e))
        } finally {
            setLoading(false)
        }
    }

     useEffect(() => {
         const prev = document.title
         document.title = 'Mecze'
         setLoading(true)
         setForbidden(false)

         ;(async () => {
             try {
                 const p = await getAllMatches(0, 50)
                 setMatches(p?.content ?? (p as any))
                 setError(null)
                 setForbidden(false)
             } catch (e: any) {
                 // Jeśli backend zwrócił 403, spróbuj fallbacku do moich meczów (jeśli użytkownik zalogowany)
                 if (e && e.status === 403) {
                     const token = getToken()
                     if (token) {
                         await fallbackToMyMatches('Nie masz uprawnień do przeglądania wszystkich meczów — pokazuję tylko Twoje mecze.')
                         return
                     }
                     setForbidden(true)
                     setError('Brak dostępu: wymagane logowanie, aby zobaczyć wszystkie mecze.')
                     return
                 }
                 setError(String(e?.message || e))
             } finally {
                 setLoading(false)
             }
         })()

         return () => {
             document.title = prev
         }
     }, [])

    // retry pobrania wszystkich meczów (ręcznie lub po wykryciu loginu w innej karcie)
    const reloadAllMatches = async () => {
        setLoading(true)
        setError(null)
        setForbidden(false)
        try {
            const p = await getAllMatches(0, 50)
            setMatches(p?.content ?? (p as any))
            setError(null)
            setForbidden(false)
        } catch (e: any) {
            if (e && e.status === 403) {
                const token = getToken()
                if (token) {
                    await fallbackToMyMatches('Nie masz uprawnień do przeglądania wszystkich meczów — pokazuję tylko Twoje mecze.')
                    return
                }
                setForbidden(true)
                setError('Brak dostępu: wymagane logowanie, aby zobaczyć wszystkie mecze.')
            } else {
                setError(String(e?.message || e))
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const onStorage = (ev: StorageEvent) => {
            // jeśli zmienił się token lub auth-token w localStorage i wcześniej mieliśmy forbidden, spróbuj ponownie
            if (!forbidden) return
            const changedKeys = ['auth-token', 'auth-refresh-token', 'token']
            if (ev.key && changedKeys.includes(ev.key)) {
                // krótki timeout, żeby inne skrypty zdążyły zapisać cookie/localStorage
                setTimeout(() => {
                    reloadAllMatches().catch(() => {})
                }, 200)
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [forbidden])

     // fallback: spróbuj pobrać tylko moje mecze (wymaga logowania) — użyteczne jeśli użytkownik jest zalogowany
     const loadMyMatches = async () => {
         setLoading(true)
         setError(null)
         try {
             const p = await getMyMatches(0, 50)
             setMatches(p.content)
         } catch (e: any) {
             setError(String(e?.message || e))
         } finally {
             setLoading(false)
         }
     }

     return (
 		<div className="min-h-screen bg-background">
			<header className="border-b bg-card">
				<div className="container flex h-16 items-center px-4 justify-between">
					<h1 className="text-2xl font-bold">Mecze</h1>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={() => navigate('/dashboard')}>
							<ArrowLeft className="mr-2 h-4 w-4" /> Powrót
						</Button>
						<Button variant="link" onClick={() => {
							const token = getToken()
							console.info('[matches.debug] token:', token)
							const payload = parseJwtPayload(token)
							console.info('[matches.debug] token payload:', payload)
							alert(`Token payload:\n${JSON.stringify(payload, null, 2)}`)
						}}>Pokaż token</Button>
					</div>
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
						{forbidden && (
							<div className="rounded-lg border bg-slate-900/60 text-slate-100 p-4 text-sm flex flex-col gap-2">
								<div>Treść listy meczów wymaga uprawnień. Zaloguj się aby zobaczyć wszystkie mecze.</div>
								<div className="flex gap-2">
									<Button variant="default" onClick={() => navigate('/login')}>Zaloguj się</Button>
									<Button variant="outline" onClick={loadMyMatches}>Pokaż moje mecze</Button>
									<Button variant="ghost" onClick={reloadAllMatches}>Spróbuj ponownie</Button>
								</div>
							</div>
						)}
						{infoMessage && (
							<div className="rounded-lg border bg-slate-900/60 text-slate-100 p-4 text-sm">
								{infoMessage}
							</div>
						)}
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
