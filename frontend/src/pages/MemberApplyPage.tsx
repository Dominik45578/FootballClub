import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { applyForMembership, getMemberStatus, type MemberStatus, getMyProfile } from '@/lib/userApi'
import { toast } from 'sonner'

export function MemberApplyPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<MemberStatus>('guest')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const prev = document.title
    document.title = 'Zostań członkiem'
    setStatus(getMemberStatus())
    let mounted = true
    // Jeśli backend zwróci profil, traktujemy użytkownika jako member
    getMyProfile({ allowUnauth: true })
      .then(() => { if (mounted) setStatus('member') })
      .catch(() => { /* brak profilu -> guest/pending */ })
    return () => { mounted = false; document.title = prev }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await applyForMembership({ firstName, lastName, phone, position, note })
      setStatus('pending')
      toast.success('Wniosek wysłany (mock). Oczekuje na zatwierdzenie.')
    } catch (err: any) {
      toast.error('Nie udało się wysłać wniosku', { description: err?.message })
    } finally {
      setLoading(false)
    }
  }

  const pending = status === 'pending'
  const member = status === 'member'

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Card className="mt-6 w-full rounded-none border-0 bg-card/90 shadow-none">
        <CardHeader>
          <CardTitle>Zostań członkiem</CardTitle>
          <CardDescription>Uzupełnij dane, a trener/admin zatwierdzi Twój wniosek.</CardDescription>
        </CardHeader>
        <CardContent>
          {member && (
            <div className="p-4 rounded-lg bg-emerald-900/60 text-emerald-100 border border-emerald-700 mb-4">Jesteś zatwierdzonym członkiem. Możesz przejść do profilu lub drużyny.
              <div className="mt-2 flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => navigate('/member/profile')}>Profil</Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/teams')}>Zespoły</Button>
              </div>
            </div>
          )}
          {pending && !member && (
            <div className="p-4 rounded-lg mb-4 border border-slate-600 bg-slate-900 text-slate-100">Wniosek oczekuje na akceptację. Poczekaj na zatwierdzenie przez trenera/admina.</div>
          )}
          {!member && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Imię</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={loading || pending} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Nazwisko</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={loading || pending} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="np. +48123456789" disabled={loading || pending} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="position">Preferowana pozycja</Label>
                <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="np. pomocnik" disabled={loading || pending} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note">Notatka</Label>
                <Textarea id="note" value={note} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)} placeholder="Dodatkowe informacje" disabled={loading || pending} />
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button type="submit" disabled={loading || pending}>{pending ? 'Wysłano (oczekuje)' : 'Wyślij wniosek'}</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>Wróć do panelu</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MemberApplyPage
