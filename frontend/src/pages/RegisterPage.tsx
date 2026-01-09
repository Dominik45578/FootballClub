import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [nick, setNick] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // set tab title on this page
  useEffect(() => {
    const prev = document.title
    document.title = 'Rejestracja'
    return () => { document.title = prev }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simple placeholder: show success toast and navigate to activation page
    setTimeout(() => {
      setLoading(false)
      toast.success('Zarejestrowano (placeholder)')
      navigate('/activate-account')
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center font-bold">Rejestracja</CardTitle>
          <CardDescription className="text-center text-base">Utwórz konto</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <form onSubmit={handleRegister}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nick">Login (nick)</Label>
                <Input id="nick" type="text" placeholder="nick" value={nick} onChange={(e) => setNick(e.target.value)} required disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" type="password" placeholder="hasło" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>
              <Button className="w-full mt-4" type="submit" disabled={loading} style={{ cursor: 'pointer' }}>
                {loading ? 'Rejestracja...' : 'Zarejestruj się'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
          <p>To jest placeholder — integracja z backendem do zaimplementowania.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
