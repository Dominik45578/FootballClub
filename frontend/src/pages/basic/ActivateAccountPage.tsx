import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { activateAccount, resendActivation } from '@/lib/userApi.ts'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { ArrowLeft } from 'lucide-react'

export function ActivateAccountPage() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Aktywacja konta'
    return () => { document.title = prev }
  }, [])

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendLeft, setResendLeft] = useState(0)
  const navigate = useNavigate()

  const validate = (value: string) => value.length >= 6 && value.length <= 10

  useEffect(() => {
    if (resendLeft <= 0) return
    const id = setInterval(() => setResendLeft((v) => v - 1), 1000)
    return () => clearInterval(id)
  }, [resendLeft])

  const handleResend = async () => {
    if (email.length < 6) {
      toast.error('Podaj poprawny email (min. 6 znaków)')
      return
    }
    setResendLoading(true)
    try {
      await resendActivation(email)
      toast.success('Kod ponownie wysłany')
      setResendLeft(30)
    } catch (err: any) {
      toast.error('Nie udało się wysłać kodu ponownie', { description: err?.message || 'Spróbuj za chwilę' })
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.length < 6) {
      toast.error('Email musi mieć min. 6 znaków')
      return
    }
    if (!validate(code)) {
      toast.error('Kod musi mieć 6-10 znaków')
      return
    }

    setLoading(true)
    try {
      await activateAccount(code,email)
      toast.success('Konto aktywowane! Przekierowuję do logowania...')
      navigate('/login')
    } catch (err: any) {
      toast.error('Błąd aktywacji', { description: err?.message || 'Nie udało się aktywować konta' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Aktywacja konta</CardTitle>
          <p className="mb-2 text-sm text-muted-foreground">Wprowadź kod aktywacyjny, który otrzymałeś e-mailem.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="flex flex-col gap-2 w-full items-center">
              <div className="w-full max-w-md">
                <Label htmlFor="email" className="text-left block mb-1">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" required minLength={6} />
              </div>
              <div className="w-full max-w-md">
                <Label htmlFor="activationCode" className="text-left block mb-1">Kod aktywacyjny</Label>
                <Input id="activationCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-10 znaków" maxLength={10} required />
                <p className="text-xs text-muted-foreground mt-2 text-left">Kod składa się z 6-10 znaków (litery i cyfry).</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 items-center w-full">
              <div className="w-full max-w-md">
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Aktywacja...' : 'Aktywuj konto'}</Button>
              </div>
              <div className="flex gap-2 w-full max-w-md mt-2">
                <Button variant="secondary" className="flex-1" type="button" onClick={handleResend} disabled={resendLoading || resendLeft > 0}>
                  {resendLoading ? 'Wysyłanie...' : resendLeft > 0 ? `Wyślij ponownie za ${resendLeft}s` : 'Wyślij kod ponownie'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivateAccountPage
