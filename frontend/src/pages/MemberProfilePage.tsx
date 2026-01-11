import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, UserCog, Lock } from 'lucide-react'

// Zaktualizowano dane profilu użytkownika, aby korzystać z DTO
const mockProfile = {
    id: 1,
    firstName: 'Jan',
    lastName: 'Kowalski',
    maskedPesel: '90********12',
    birthDate: '1990-01-01',
    phoneNumber: '123-456-789',
    height: 180,
    weight: 75,
    age: 36,
};

export function MemberProfilePage() {
  const navigate = useNavigate()
  useEffect(() => {
    const prev = document.title
    document.title = 'Profil użytkownika'
    return () => { document.title = prev }
  }, [])

    const profile = {
        id: mockProfile.id,
        fullName: `${mockProfile.firstName} ${mockProfile.lastName}`,
        maskedPesel: mockProfile.maskedPesel,
        birthDate: mockProfile.birthDate,
        phoneNumber: mockProfile.phoneNumber,
        height: mockProfile.height,
        weight: mockProfile.weight,
        age: mockProfile.age,
    };

  const [form, setForm] = useState({
    phoneNumber: mockProfile.phoneNumber,
    height: mockProfile.height?.toString() || '',
    weight: mockProfile.weight?.toString() || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Profil użytkownika</h1>
          <Button variant="outline" size="sm" onClick={() => navigate('/new-password')}>
            <Lock className="mr-2 h-4 w-4" /> Reset hasła
          </Button>
        </div>
      </header>
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle>{profile.fullName}</CardTitle>
            <CardDescription>Podgląd i edycja wybranych danych (mock, bez backendu).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">PESEL (maskowany)</p>
                <p className="text-base font-medium">{profile.maskedPesel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data urodzenia</p>
                <p className="text-base font-medium">{profile.birthDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wiek</p>
                <p className="text-base font-medium">{profile.age} lat</p>
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
                  Zapisz zmiany (mock)
                </Button>
              </div>
              {saved && (
                <div className="flex items-center gap-2 rounded-md border border-green-700/50 bg-green-900/40 px-3 py-2 text-sm text-green-100">
                  <CheckCircle className="h-4 w-4" />
                  <span>Zapisano zmiany lokalnie (mock).</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
 }

export default MemberProfilePage
