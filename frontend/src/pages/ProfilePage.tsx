import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '@/lib/userApi'
import type { MemberProfile } from '@/lib/userApi'

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

    useEffect(() => {
        let mounted = true
        getMyProfile().then(p => {
            if (!mounted) return
            setProfile(p)
            setHeight(p.height ? String(p.height) : '')
            setWeight(p.weight ? String(p.weight) : '')
            setPhone(p.phoneNumber || '')
        }).catch(err => {
            console.error(err)
            toast.error('Nie udało się pobrać profilu (mock)')
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

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Profil użytkownika</h1>
                    <Button variant="outline" onClick={handleLogout} className="cursor-pointer">Wyloguj się</Button>
                </div>
            </header>
            <main className="container py-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Informacje o koncie</CardTitle>
                            <CardDescription>Podstawowe dane pobrane z profilu</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {!profile && (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                            )}
                            {profile && (
                                <>
                                    <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                                    <p className="text-muted-foreground">PESEL (maskowany): {profile.maskedPesel || '—'}</p>
                                    <p className="text-muted-foreground">Wiek: {profile.age ?? '—'}</p>
                                </>
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
            </main>
        </div>
    )
}

export default ProfilePage
