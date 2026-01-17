import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { requestPasswordReset, setNewPassword } from '@/lib/userApi'

export function ResetPasswordPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const tokenFromUrl = search.get('token') || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(!!tokenFromUrl)

  useEffect(() => {
    const prev = document.title
    document.title = showNewPasswordForm ? 'Ustaw nowe hasło' : 'Reset hasła'
    return () => { document.title = prev }
  }, [showNewPasswordForm])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await requestPasswordReset({ email })
      toast.success(res?.message || 'Jeśli email istnieje, wysłaliśmy kod resetujący')
      setShowNewPasswordForm(true)
    } catch (err: any) {
      toast.error('Błąd', { description: err?.message || 'Nie udało się wysłać resetu' })
    } finally {
      setLoading(false)
    }
  }

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.length < 6) {
      toast.error('Email musi mieć min. 6 znaków')
      return
    }
    if (code.length < 6 || code.length > 10) {
      toast.error('Kod musi mieć 6-10 znaków')
      return
    }
    if (password.length < 8 || password.length > 32) {
      toast.error('Hasło musi mieć 8-32 znaki')
      return
    }
    if (password !== confirm) {
      toast.error('Hasła muszą być identyczne')
      return
    }
    setLoading(true)
    try {
      const res = await setNewPassword({ email, code, password, confirmNewPassword: confirm })
      if (res?.status !== false) {
        toast.success(res?.message || 'Hasło zmienione, możesz się zalogować')
        setPassword('')
        setConfirm('')
        setCode('')
        setEmail('')
        navigate('/login')
      } else {
        toast.error(res?.message || 'Nie udało się ustawić hasła')
      }
    } catch (err: any) {
      toast.error('Błąd', { description: err?.message || 'Nie udało się ustawić hasła' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center font-bold">{showNewPasswordForm ? 'Ustaw nowe hasło' : 'Reset hasła'}</CardTitle>
          <CardDescription className="text-center text-base">
            {showNewPasswordForm ? 'Wprowadź kod z maila i ustaw nowe hasło' : 'Podaj email, aby otrzymać kod resetujący'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <form onSubmit={handleRequestReset} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button className="w-full mt-2" type="submit" disabled={loading}>
              {loading ? 'Wysyłanie...' : 'Wyślij kod resetujący'}
            </Button>
          </form>

          {showNewPasswordForm && (
            <form onSubmit={handleSetNewPassword} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Kod (6-10 znaków)</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="kod z maila"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  minLength={6}
                  maxLength={10}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Nowe hasło</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="nowe hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={32}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((s) => !s)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${showPassword ? 'text-primary' : 'text-muted-foreground'} focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-1 transition-transform duration-150 ease-in-out`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Powtórz hasło</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="powtórz hasło"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  maxLength={32}
                  disabled={loading}
                />
              </div>
              <Button className="w-full mt-2" type="submit" disabled={loading}>
                {loading ? 'Zapisywanie...' : 'Zapisz nowe hasło'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
          <p>Po otrzymaniu kodu wpisz go powyżej, aby ustawić nowe hasło.</p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ResetPasswordPage
