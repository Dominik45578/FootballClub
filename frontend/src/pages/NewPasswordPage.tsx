import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Loader2, LockKeyhole, TriangleAlert } from 'lucide-react'

export function NewPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const prev = document.title
    document.title = 'Ustaw nowe hasło'
    return () => { document.title = prev }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setStatus('error')
      setMessage('Brak tokenu resetu. Otwórz link z e-maila.')
      return
    }
    if (password.length < 8) {
      setStatus('error')
      setMessage('Hasło musi mieć min. 8 znaków.')
      return
    }
    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Hasła nie są zgodne.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStatus('success')
      setMessage('Hasło zostało ustawione (mock). Możesz się zalogować.')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">Nowe hasło</h1>
        </div>
      </header>
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle>Ustaw nowe hasło</CardTitle>
            <CardDescription>Link pochodzi z wiadomości e-mail. W trybie offline to tylko podgląd.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-md border border-red-700/50 bg-red-900/40 px-3 py-2 text-sm text-red-100">
                <TriangleAlert className="h-4 w-4" />
                <span>{message}</span>
              </div>
            )}
            {status === 'success' && (
              <div className="flex items-center gap-2 rounded-md border border-green-700/50 bg-green-900/40 px-3 py-2 text-sm text-green-100">
                <CheckCircle className="h-4 w-4" />
                <span>{message}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nowe hasło</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Powtórz hasło</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
                  Zapisz hasło
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/login')}>
                  Wróć do logowania
                </Button>
              </div>
              {token && (
                <p className="text-xs text-muted-foreground">Token: {token.slice(0, 8)}... (mock podgląd)</p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// eslint-disable-next-line import/no-default-export
export default NewPasswordPage
