import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { useEffect, useState } from 'react';
import {
    getMyProfile,
    updateMyProfile,
    getMyAccount,
    updateMyAccount
} from '@/lib/userApi'
import type { MemberProfile, UserAccount } from '@/lib/userApi'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowLeft, UserCog, User as UserIcon, Shield, Calendar } from 'lucide-react'

export function ProfilePage() {
    const navigate = useNavigate();

    // --- State: Member Profile (Lewa strona) ---
    const [profile, setProfile] = useState<MemberProfile | null>(null)
    const [height, setHeight] = useState<string>('')
    const [weight, setWeight] = useState<string>('')
    const [phone, setPhone] = useState<string>('')

    // --- State: User Account (Prawa strona) ---
    const [account, setAccount] = useState<UserAccount | null>(null)
    const [username, setUsername] = useState<string>('')
    const [email, setEmail] = useState<string>('')

    // --- State: General ---
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const prev = document.title
        document.title = 'Profil użytkownika'
        return () => { document.title = prev }
    }, [])

    // Pobieranie danych równolegle
    useEffect(() => {
        let mounted = true

        const fetchData = async () => {
            try {
                // Fetch Member Profile
                const profileData = await getMyProfile({ allowUnauth: true }).catch(err => {
                    console.warn('Failed to fetch profile', err);
                    return null;
                });

                if (mounted && profileData) {
                    setProfile(profileData)
                    setHeight(profileData.height ? String(profileData.height) : '')
                    setWeight(profileData.weight ? String(profileData.weight) : '')
                    setPhone(profileData.phoneNumber || '')
                }

                // Fetch Account Data
                const accountData = await getMyAccount({ allowUnauth: true }).catch(err => {
                    console.warn('Failed to fetch account', err);
                    return null;
                });

                if (mounted && accountData) {
                    setAccount(accountData)
                    setUsername(accountData.userName || '')
                    setEmail(accountData.userEmail || '')
                }

            } catch (err: any) {
                if (mounted) setError('Wystąpił błąd podczas ładowania danych.')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchData();
        return () => { mounted = false }
    }, [])

    const handleLogout = () => {
        logout();
        toast.success('Wylogowano pomyślnie');
        navigate('/');
    };

    // --- Handlers: Left Side (Member) ---
    const handleMemberUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const updated = await updateMyProfile({
                height: height ? Number(height) : undefined,
                weight: weight ? Number(weight) : undefined,
                phoneNumber: phone || undefined
            })
            setProfile(updated)
            toast.success('Zaktualizowano dane profilowe')
        } catch (err: any) {
            toast.error('Błąd aktualizacji profilu', { description: err?.message })
        }
    }

    // --- Handlers: Right Side (Account) ---
    const handleAccountUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        // Prosta walidacja email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Błąd walidacji', { description: 'Podaj poprawny adres email.' });
            return;
        }

        try {
            await updateMyAccount({
                username: username,
                email: email
            });
            toast.success('Zaktualizowano dane konta', { description: 'Zmiany mogą wymagać przelogowania.' })
            // Opcjonalnie odświeżamy dane
            const refreshed = await getMyAccount();
            setAccount(refreshed);
        } catch (err: any) {
            toast.error('Błąd aktualizacji konta', { description: err?.message || 'Nie udało się zapisać zmian.' })
        }
    }

    const initials = profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() : 'U'
    const fullName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'Użytkownik'

    if (loading && !profile && !account) {
        return <div className="p-8 space-y-4 container"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserIcon className="h-6 w-6" /> Profil użytkownika
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                        </Button>
                        <Button variant="outline" onClick={handleLogout} className="cursor-pointer">Wyloguj się</Button>
                    </div>
                </div>
            </header>

            <main className="container py-8 space-y-6 px-4">
                {error && (
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardHeader><CardTitle className="text-destructive flex gap-2"><AlertCircle /> Błąd</CardTitle></CardHeader>
                        <CardContent>{error}</CardContent>
                    </Card>
                )}

                {/* Top Summary Card */}
                <Card className="shadow-sm border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary">
                            {initials}
                        </div>
                        <div>
                            <CardTitle className="text-2xl">{fullName}</CardTitle>
                            <CardDescription className="flex gap-2 mt-1">
                                {account?.userRole?.map((role, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        {role.role.replace('ROLE_', '')}
                                    </Badge>
                                ))}
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                {/* GRID 2 COLUMNS */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* --- LEWA STRONA: Member Profile (Dane fizyczne) --- */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground border-b pb-2">
                            <UserIcon className="w-5 h-5" /> Dane Członkowskie
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Informacje fizyczne</CardTitle>
                                <CardDescription>Twoje dane sportowe w klubie</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleMemberUpdate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>PESEL</Label>
                                            <Input value={profile?.maskedPesel || ''} disabled className="bg-muted" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Wiek</Label>
                                            <Input value={profile?.age || ''} disabled className="bg-muted" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="height">Wzrost (cm)</Label>
                                            <Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="180" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="weight">Waga (kg)</Label>
                                            <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Numer telefonu</Label>
                                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+48..." />
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" className="w-full">Zapisz dane członkowskie</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- PRAWA STRONA: User Account (Dane systemowe) --- */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground border-b pb-2">
                            <UserCog className="w-5 h-5" /> Ustawienia Konta
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Dane logowania</CardTitle>
                                <CardDescription>Identyfikacja w systemie i dostęp</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAccountUpdate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>ID Użytkownika</Label>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-sm px-3 py-1">#{account?.userId}</Badge>
                                            {account?.createdAt && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Utworzono: {new Date(account.createdAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">Nazwa użytkownika (Login)</Label>
                                        <Input
                                            id="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Login"
                                        />
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Unikalna nazwa używana do logowania.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Adres Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="text-sm font-medium mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> Przypisane role systemowe</div>
                                        <div className="flex flex-wrap gap-1">
                                            {account?.userRole?.length ? account.userRole.map((role, i) => (
                                                <Badge key={i} variant="secondary" className="font-mono text-xs">
                                                    {role.role}
                                                </Badge>
                                            )) : <span className="text-xs text-muted-foreground">Brak ról</span>}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" variant="secondary" className="w-full">Aktualizuj konto</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default ProfilePage