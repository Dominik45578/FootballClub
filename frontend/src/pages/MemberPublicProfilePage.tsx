import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, ArrowLeft } from 'lucide-react'
import { getMemberProfile } from '@/lib/userApi'

export function MemberPublicProfilePage() {
  const { memberId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.title
    document.title = `Profil członka ${memberId ?? ''}`
    return () => { document.title = prev }
  }, [memberId])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!memberId) return
      setLoading(true)
      setError(null)
      try {
        const res = await getMemberProfile(Number(memberId), { allowUnauth: true })
        if (!mounted) return
        // Normalizuj odpowiedź - backend może zwracać różne kształty
        const normalized = {
          id: res?.id ?? Number(memberId),
          fullName: res?.fullName ?? ((`${res?.firstName ?? res?.name ?? ''} ${res?.lastName ?? ''}`.trim()) || `#${memberId}`),
          number: res?.number ?? res?.shirtNumber ?? null,
          roles: res?.roles ?? (res?.role ? [res.role] : []),
          status: res?.status ?? res?.state ?? 'UNKNOWN',
          age: res?.age ?? res?.years ?? null,
          height: res?.height ?? null,
          weight: res?.weight ?? null,
          raw: res,
        }
        setData(normalized)
      } catch (err: any) {
        console.error('MemberPublicProfilePage: fetch error', err)
        if (!mounted) return
        setError(err?.message || 'Błąd pobierania profilu')
        setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [memberId])

  const showUnavailable = (!loading && !data && !error)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Profil członka</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć
          </Button>
        </div>
      </header>
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle>{loading ? 'Ładowanie...' : (data ? data.fullName : `Profil #${memberId}`)}</CardTitle>
            <CardDescription>Widok publiczny członka. Pokazywane są tylko dane przeznaczone do widoku publicznego.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <div className="text-sm text-muted-foreground">Ładowanie profilu...</div>}
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            {showUnavailable && (
              <div className="text-sm text-muted-foreground">Nie znaleziono profilu publicznego.</div>
            )}

            {data && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  {data.number != null && <Badge variant="outline">#{data.number}</Badge>}
                  <Badge variant={data.status === 'ACTIVE' ? 'default' : 'secondary'}>{data.status}</Badge>
                  {(data.roles || []).map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Wiek</p>
                    <p className="text-base font-medium">{data.age != null ? `${data.age} lat` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wzrost</p>
                    <p className="text-base font-medium">{data.height != null ? `${data.height} cm` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waga</p>
                    <p className="text-base font-medium">{data.weight != null ? `${data.weight} kg` : '—'}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-4 bg-card/70">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Dane wrażliwe (PESEL, adres) są ukryte w widoku publicznym.
                  </div>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default MemberPublicProfilePage
