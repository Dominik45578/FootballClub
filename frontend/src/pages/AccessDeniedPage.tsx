import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function AccessDeniedPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Brak dostępu</h1>
        </div>
      </header>
      <main className="container py-8">
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Dostęp zabroniony</CardTitle>
            <CardDescription>Twoje konto nie ma uprawnień do przeglądania tej strony.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Jeśli uważasz, że to błąd, skontaktuj się z administratorem lub sprawdź swoje uprawnienia.</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/dashboard')}>Powrót do dashboardu</Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>Odśwież</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

