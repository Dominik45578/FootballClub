import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, UserCog, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile, type MemberProfile, ensureMemberStatus } from '@/lib/userApi'
import { toast } from 'sonner'

export function MemberProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [form, setForm] = useState({ phoneNumber: '', height: '', weight: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Profil użytkownika'
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    getMyProfile({ allowUnauth: true })
      .then((p) => {
        if (!mounted) return
        ensureMemberStatus().catch(() => undefined)
        setProfile(p)
        setForm({
          phoneNumber: p.phoneNumber || '',
          height: p.height != null ? String(p.height) : '',
          weight: p.weight != null ? String(p.weight) : '',
        })
      })
      .catch((err: any) => {
        if (!mounted) return
        const msg = err?.status === 401 || err?.status === 403 ? 'Brak dostępu do profilu członka' : 'Nie udało się pobrać profilu'
        setError(msg)
        if (err?.status === 401 || err?.status === 403) {
          toast.error('Brak dostępu do profilu członka')
        }
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      const payload = {
        phoneNumber: form.phoneNumber || undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      }
      const updated = await updateMyProfile(payload)
      setProfile(updated)
      setSaved(true)
      toast.success('Zapisano zmiany')
    } catch (err: any) {
      toast.error('Nie udało się zapisać', { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Profil użytkownika</h1>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do dashboardu
          </Button>
        </div>
      </header>
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle>{profile ? `${profile.firstName} ${profile.lastName}` : '—'}</CardTitle>
            <CardDescription>Podgląd i edycja danych.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading && <div className="text-sm text-muted-foreground">Ładowanie profilu...</div>}
            {error && (
              <div className="text-sm text-red-500">
                {error === 'Member not approved' ? 'Twoje członkostwo nie jest jeszcze zatwierdzone.' : error}
              </div>
            )}
            {!loading && !profile && !error && (
              <div className="text-sm text-muted-foreground">
                Nie masz profilu członka. Wypełnij formularz „Zostań członkiem”, aby uzyskać dostęp.
              </div>
            )}
            {profile && !loading && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">PESEL (maskowany)</p>
                    <p className="text-base font-medium">{profile.maskedPesel ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data urodzenia</p>
                    <p className="text-base font-medium">{profile.birthDate ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wiek</p>
                    <p className="text-base font-medium">{profile.age != null ? `${profile.age} lat` : '—'}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Numer telefonu</label>
                      <Input value={form.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} placeholder="123-456-789" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Wzrost (cm)</label>
                      <Input type="number" value={form.height} onChange={(e) => handleChange('height', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Waga (kg)</label>
                      <Input type="number" value={form.weight} onChange={(e) => handleChange('weight', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2 h-4 w-4" />}
                      Zapisz zmiany
                    </Button>
                  </div>
                  {saved && (
                    <div className="flex items-center gap-2 rounded-md border border-green-700/50 bg-green-900/40 px-3 py-2 text-sm text-green-100">
                      <CheckCircle className="h-4 w-4" />
                      <span>Zapisano zmiany.</span>
                    </div>
                  )}
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default MemberProfilePage
