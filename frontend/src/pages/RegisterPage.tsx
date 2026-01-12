import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'

function passwordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score += 1
  if (/[A-Z]/.test(pw)) score += 1
  if (/[0-9]/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  return score // 0..4
}

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    if (username.length < 8 || username.length > 32) {
      toast.error('Login musi mieć 8-32 znaki')
      return
    }
    if (email.length < 6) {
      toast.error('Email musi mieć min. 6 znaków')
      return
    }
    if (password.length < 8) {
      toast.error('Hasło musi mieć min. 8 znaków')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Zarejestrowano (mock) — sprawdź email i aktywuj konto')
      navigate('/activate-account')
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center font-bold">Rejestracja</CardTitle>
          <CardDescription className="text-center text-base">Utwórz konto</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <form onSubmit={handleRegister}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Login (username)</Label>
                {loading ? <Skeleton className="h-9 w-full rounded-md" /> : <Input id="username" type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} minLength={8} maxLength={32} />}
                <p className="text-xs text-muted-foreground">8-32 znaków</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                {loading ? <Skeleton className="h-9 w-full rounded-md" /> : <Input id="email" type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} minLength={6} />}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Hasło</Label>
                <div className="relative">
                  {loading ? <Skeleton className="h-9 w-full rounded-md" /> : (
                    <>
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="hasło" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={8} />
                      <button type="button" aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(s => !s)}>
                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </>
                  )}
                </div>
                {/* strength meter */}
                {(() => {
                  const score = passwordStrength(password)
                  const pct = (score / 4) * 100
                  const labels = ['Bardzo słabe','Słabe','Średnie','Dobre','Silne']
                  const colors = ['bg-red-500','bg-orange-400','bg-yellow-400','bg-lime-400','bg-green-500']
                  const color = colors[score] || 'bg-muted'
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-full max-w-md bg-muted rounded h-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-label={`Siła hasła: ${labels[score]}`}>
                        <div className={`${color} h-2`} style={{ width: `${pct}%`, transition: 'width 220ms ease' }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${color}`} aria-hidden="true" />
                        <small className="text-xs text-muted-foreground">{labels[score]}</small>
                      </div>
                    </div>
                  )
                })()}
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
