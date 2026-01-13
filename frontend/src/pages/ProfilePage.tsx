import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, getMemberStatus, type MemberStatus } from '@/lib/userApi'
import type { MemberProfile } from '@/lib/userApi'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

export function ProfilePage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Profil użytkownika'
        return () => { document.title = prev }
    }, [])
    const navigate = useNavigate();
    const [profile, setProfile] = useState<MemberProfile | null>(null)
    const [height, setHeight] = useState<string>('')
    const [weight, setWeight] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [unauthorized, setUnauthorized] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const memberStatus: MemberStatus = getMemberStatus()

    useEffect(() => {
        let mounted = true
        getMyProfile({ allowUnauth: true }).then(p => {
            if (!mounted) return
            setUnauthorized(false)
            setError(null)
            setProfile(p)
            setHeight(p.height ? String(p.height) : '')
            setWeight(p.weight ? String(p.weight) : '')
            setPhone(p.phoneNumber || '')
        }).catch((err: any) => {
            if (!mounted) return
            console.error(err)
            if (err?.status === 401 || err?.status === 403) {
                // Traktujemy jak błąd pobrania, nie pokazujemy "Brak dostępu"
                setUnauthorized(false)
                setError('Nie udało się pobrać profilu')
            } else {
                setError('Nie udało się pobrać profilu')
            }
        })
        return () => { mounted = false }
    }, [])

    const handleLogout = () => {
        logout();
        toast.success('Wylogowano pomyślnie');
        navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const updated = await updateMyProfile({ height: height ? Number(height) : undefined, weight: weight ? Number(weight) : undefined, phoneNumber: phone || undefined })
            setProfile(updated)
            toast.success('Zaktualizowano profil (mock)')
        } catch (err: any) {
            toast.error('Błąd', { description: err?.message || 'Nie udało się zaktualizować' })
        }
    }

    const initials = profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'U' : 'U'
    const fullName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Użytkownik' : 'Użytkownik'
    const maskedPesel = profile?.maskedPesel || '—'
    const age = profile?.age ?? '—'
    const email = (profile as any)?.email || '—'

    const errorView = (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Wystąpił błąd</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Profil użytkownika</h1>
                    <Button variant="outline" onClick={handleLogout} className="cursor-pointer">Wyloguj się</Button>
                </div>
            </header>
            <main className="container py-8 space-y-6">
                {error ? errorView : null}
                {
                    <>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
                                        {profile ? initials : <Skeleton className="h-full w-full rounded-full" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{profile ? fullName : <Skeleton className="h-6 w-40" />}</CardTitle>
                                        <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                            <span>Email: {profile ? email : <Skeleton className="h-4 w-24" />}</span>
                                            <Badge variant="outline">PESEL: {maskedPesel}</Badge>
                                            <Badge variant="secondary">Wiek: {age}</Badge>
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="secondary">Wzrost: {profile?.height ? `${profile.height} cm` : '—'}</Badge>
                                    <Badge variant="secondary">Waga: {profile?.weight ? `${profile.weight} kg` : '—'}</Badge>
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle>Informacje o koncie</CardTitle>
                                        <CardDescription>Podstawowe dane pobrane z profilu</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {!profile && (
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-4 w-64" />
                                            <Skeleton className="h-4 w-56" />
                                        </div>
                                    )}
                                    {profile && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-lg border bg-muted/20 p-3">
                                                <div className="text-xs uppercase text-muted-foreground">Imię i nazwisko</div>
                                                <div className="text-base font-semibold">{fullName}</div>
                                            </div>
                                            <div className="rounded-lg border bg-muted/20 p-3">
                                                <div className="text-xs uppercase text-muted-foreground">PESEL (maskowany)</div>
                                                <div className="text-base font-semibold">{maskedPesel}</div>
                                            </div>
                                            <div className="rounded-lg border bg-muted/20 p-3">
                                                <div className="text-xs uppercase text-muted-foreground">Wiek</div>
                                                <div className="text-base font-semibold">{age}</div>
                                            </div>
                                            <div className="rounded-lg border bg-muted/20 p-3">
                                                <div className="text-xs uppercase text-muted-foreground">Telefon</div>
                                                <div className="text-base font-semibold">{profile.phoneNumber || '—'}</div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Edycja profilu</CardTitle>
                                    <CardDescription>Wzrost, waga i numer telefonu</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="height">Wzrost (cm)</Label>
                                            <Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="np. 180" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="weight">Waga (kg)</Label>
                                            <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="np. 75" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Numer telefonu</Label>
                                            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="np. +48123456789" />
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <Button type="submit">Zapisz</Button>
                                            <Button type="button" variant="ghost" onClick={handleLogout}>Wyloguj się</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                }
            </main>
        </div>
    )
}

export default ProfilePage
