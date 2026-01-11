import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, ArrowLeft } from 'lucide-react'

const mockMember = {
  id: 99,
  fullName: 'Zawodnik Publiczny',
  number: 11,
  roles: ['PLAYER'],
  status: 'ACTIVE',
  age: 24,
  height: 182,
  weight: 76,
}

export function MemberPublicProfilePage() {
  const { memberId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const prev = document.title
    document.title = `Profil członka ${memberId ?? ''}`
    return () => { document.title = prev }
  }, [memberId])

  const data = memberId ? { ...mockMember, id: Number(memberId) } : mockMember

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
            <CardTitle>{data.fullName}</CardTitle>
            <CardDescription>Widok publiczny członka (mock, bez danych wrażliwych).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">#{data.number}</Badge>
              <Badge variant={data.status === 'ACTIVE' ? 'default' : 'secondary'}>{data.status}</Badge>
              {data.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Wiek</p>
                <p className="text-base font-medium">{data.age} lat</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wzrost</p>
                <p className="text-base font-medium">{data.height} cm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waga</p>
                <p className="text-base font-medium">{data.weight} kg</p>
              </div>
            </div>
            <div className="rounded-lg border p-4 bg-card/70">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Dane wrażliwe (PESEL, adres) są ukryte w widoku publicznym.
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default MemberPublicProfilePage

