import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    CheckCircle, Loader2, UserCog, ArrowLeft, AlertCircle,
    Shield, User, Mail, Calendar, Lock, AlertTriangle,
    Crown, Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    getMyProfile,
    updateMyProfile,
    getMyAccount,
    updateMyAccount,
    ensureMemberStatus
} from '@/lib/userApi'
import type { MemberProfile, UserAccount } from '@/lib/userApi'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function MemberProfilePage() {
    const navigate = useNavigate()

    // --- Stan: Dane Członka (Member) ---
    const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null)
    const [memberForm, setMemberForm] = useState({ phoneNumber: '', height: '', weight: '' })
    const [memberLoading, setMemberLoading] = useState(true)
    const [memberSaving, setMemberSaving] = useState(false)
    const [memberError, setMemberError] = useState<string | null>(null)

    // --- Stan: Dane Konta (User Account) ---
    const [account, setAccount] = useState<UserAccount | null>(null)
    const [accountForm, setAccountForm] = useState({ username: '', email: '' })
    const [accountLoading, setAccountLoading] = useState(true)
    const [accountSaving, setAccountSaving] = useState(false)

    // --- Stan: Potwierdzenie zmiany Emaila ---
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [confirmCountdown, setConfirmCountdown] = useState(5)
    const [confirmEmailMatch, setConfirmEmailMatch] = useState('')

    const countdownInterval = useRef<number | null>(null)

    // --- LOGIKA BIZNESOWA: Wykrywanie Trenera ---
    // Sprawdzamy, czy w rolach znajduje się uprawnienie trenera.
    // Używamy .some() dla wydajności - przerywa pętlę po pierwszym trafieniu.
    const isCoach = account?.userRole?.some(r =>
        r.role.toUpperCase().includes('COACH') ||
        r.role.toUpperCase().includes('TRENER')
    ) ?? false

    useEffect(() => {
        const prev = document.title
        document.title = 'Profil użytkownika'
        return () => { document.title = prev }
    }, [])

    // Logika odliczania 5 sekund w modalu
    useEffect(() => {
        if (isConfirmOpen) {
            setConfirmCountdown(5)
            setConfirmEmailMatch('')
            countdownInterval.current = window.setInterval(() => {
                setConfirmCountdown((prev) => {
                    if (prev <= 1) {
                        if (countdownInterval.current !== null) clearInterval(countdownInterval.current)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (countdownInterval.current !== null) clearInterval(countdownInterval.current)
        }
        return () => {
            if (countdownInterval.current !== null) clearInterval(countdownInterval.current)
        }
    }, [isConfirmOpen])

    // Pobieranie danych
    useEffect(() => {
        let mounted = true

        const fetchData = async () => {
            // 1. Member Profile
            try {
                const p = await getMyProfile({ allowUnauth: true })
                if (mounted) {
                    ensureMemberStatus().catch(() => undefined)
                    setMemberProfile(p)
                    setMemberForm({
                        phoneNumber: p.phoneNumber || '',
                        height: p.height != null ? String(p.height) : '',
                        weight: p.weight != null ? String(p.weight) : '',
                    })
                }
            } catch (err: any) {
                if (mounted) {
                    const isMissing = err?.status === 404 || err?.status === 401 || err?.status === 403
                    setMemberError(isMissing ? 'NOT_FOUND' : 'Nie udało się pobrać danych członka')
                }
            } finally {
                if (mounted) setMemberLoading(false)
            }

            // 2. User Account
            try {
                const acc = await getMyAccount({ allowUnauth: true })
                if (mounted) {
                    setAccount(acc)
                    setAccountForm({
                        username: acc.userName || '',
                        email: acc.userEmail || ''
                    })
                }
            } catch (err: any) {
                if (mounted) console.error('Błąd pobierania konta:', err)
            } finally {
                if (mounted) setAccountLoading(false)
            }
        }

        fetchData()
        return () => { mounted = false }
    }, [])

    // Handlers (Member)
    const handleMemberChange = (field: string, value: string) => {
        setMemberForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memberProfile) return
        setMemberSaving(true)
        try {
            const payload = {
                phoneNumber: memberForm.phoneNumber || undefined,
                height: memberForm.height ? Number(memberForm.height) : undefined,
                weight: memberForm.weight ? Number(memberForm.weight) : undefined,
            }
            const updated = await updateMyProfile(payload)
            setMemberProfile(updated)
            toast.success('Zapisano dane członkowskie')
        } catch (err: any) {
            toast.error('Błąd zapisu', { description: err?.message })
        } finally {
            setMemberSaving(false)
        }
    }

    // Handlers (Account)
    const handleAccountChange = (field: string, value: string) => {
        setAccountForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleAccountPreSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!account) return

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(accountForm.email)) {
            toast.error('Nieprawidłowy format adresu email')
            return
        }

        const emailChanged = accountForm.email.trim().toLowerCase() !== account.userEmail.trim().toLowerCase()

        if (emailChanged) {
            setIsConfirmOpen(true)
        } else {
            executeAccountUpdate()
        }
    }

    const executeAccountUpdate = async () => {
        if (!account) return
        setAccountSaving(true)
        setIsConfirmOpen(false)

        try {
            const payload = { username: accountForm.username, email: accountForm.email }
            await updateMyAccount(payload)
            setAccount({ ...account, userName: payload.username, userEmail: payload.email })
            toast.success('Zaktualizowano dane konta', {
                description: 'Jeśli zmieniono email, może być wymagane ponowne potwierdzenie.'
            })
        } catch (err: any) {
            toast.error('Nie udało się zaktualizować konta', { description: err?.message })
        } finally {
            setAccountSaving(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—'
        return new Date(dateString).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
    }

    return (
        <div className="min-h-screen bg-background pb-12 relative">
            {/* Modal Potwierdzenia Zmiany Emaila - (bez zmian w logice) */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl border-destructive/50 ring-1 ring-destructive/20 bg-background">
                        <CardHeader className="space-y-1">
                            <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                                <AlertTriangle className="h-5 w-5" />
                                Potwierdzenie krytycznej zmiany
                            </div>
                            <CardTitle>Zmiana adresu email</CardTitle>
                            <CardDescription>
                                Ta operacja zmieni Twój login oraz adres do korespondencji. Prosimy o uważne porównanie adresów.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2 p-3 bg-muted/50 rounded-lg border text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Obecny Email</span>
                                    <div className="font-mono font-medium text-foreground break-all">{account?.userEmail}</div>
                                </div>
                                <div className="border-t my-1"></div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1 text-primary">Nowy Email</span>
                                    <div className="font-mono font-bold text-primary break-all">{accountForm.email}</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmEmail" className="text-xs uppercase text-muted-foreground">
                                    Przepisz nowy email aby potwierdzić
                                </Label>
                                <Input
                                    id="confirmEmail"
                                    placeholder={accountForm.email}
                                    value={confirmEmailMatch}
                                    onChange={(e) => setConfirmEmailMatch(e.target.value)}
                                    className={confirmEmailMatch && confirmEmailMatch !== accountForm.email ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    onClick={executeAccountUpdate}
                                    variant="destructive"
                                    className="w-full transition-all"
                                    disabled={confirmCountdown > 0 || confirmEmailMatch !== accountForm.email}
                                >
                                    {confirmCountdown > 0 ? (
                                        <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Potwierdź za {confirmCountdown}s </>
                                    ) : (
                                        <> <CheckCircle className="mr-2 h-4 w-4" /> Potwierdzam zmianę </>
                                    )}
                                </Button>
                                <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} className="w-full">
                                    Anuluj
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <header className="border-b bg-[#091021] sticky top-0 z-50 shadow-sm">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserCog className="h-6 w-6"/> Profil użytkownika
                    </h1>
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Dashboard
                    </Button>
                </div>
            </header>

            <main className="container py-8 px-4 sm:px-6 lg:px-8 space-y-8">

                <div className="grid gap-6 lg:grid-cols-2 items-start">

                    {/* --- LEWA KOLUMNA: Member Profile --- */}
                    {/* WPROWADZONO: Logika styli dla Trenera (Border + Glow) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground border-b pb-2">
                            <User className="w-5 h-5" /> Dane Fizyczne
                        </div>
                        <Card className={`
                            shadow-sm h-full transition-all duration-300 relative overflow-hidden
                            ${isCoach
                            ? 'border-amber-400/60 ring-1 ring-amber-400/30 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]'
                            : ''
                        }
                        `}>
                            {/* Ozdobny gradient dla trenera w tle */}
                            {isCoach && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 animate-pulse" />
                            )}

                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            Profil Sportowy
                                            {/* WPROWADZONO: Ikona wyróżniająca trenera */}
                                            {isCoach && (
                                                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1 px-2">
                                                    <Crown className="w-3.5 h-3.5 fill-current" />
                                                    Sztab
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>Twoje parametry fizyczne w klubie.</CardDescription>
                                    </div>
                                    {isCoach && <Star className="h-6 w-6 text-amber-400 fill-amber-400/20 animate-pulse" />}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {memberLoading && (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Ładowanie profilu...
                                    </div>
                                )}

                                {!memberLoading && (memberError === 'NOT_FOUND' || !memberProfile) && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-muted/20 rounded-lg border border-dashed">
                                        <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                                        <div className="space-y-1">
                                            <h3 className="font-semibold">Brak profilu członkowskiego</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                                Nie posiadasz jeszcze aktywnego profilu.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!memberLoading && memberProfile && (
                                    <div className="space-y-6">
                                        <div className="grid gap-4 sm:grid-cols-2 bg-muted/30 p-4 rounded-md">
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase font-bold">Imię i Nazwisko</span>
                                                <p className="font-medium">{memberProfile.firstName} {memberProfile.lastName}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase font-bold">Wiek</span>
                                                <p className="font-medium">{memberProfile.age != null ? `${memberProfile.age} lat` : '—'}</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleMemberSubmit} className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Wzrost (cm)</Label>
                                                    <Input
                                                        type="number"
                                                        value={memberForm.height}
                                                        onChange={(e) => handleMemberChange('height', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Waga (kg)</Label>
                                                    <Input
                                                        type="number"
                                                        value={memberForm.weight}
                                                        onChange={(e) => handleMemberChange('weight', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Numer telefonu</Label>
                                                <Input
                                                    value={memberForm.phoneNumber}
                                                    onChange={(e) => handleMemberChange('phoneNumber', e.target.value)}
                                                />
                                            </div>

                                            <Button type="submit" disabled={memberSaving} className="w-full sm:w-auto">
                                                {memberSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                Zapisz dane fizyczne
                                            </Button>
                                        </form>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- PRAWA KOLUMNA: User Account --- */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground border-b pb-2">
                            <Shield className="w-5 h-5" /> Ustawienia Konta
                        </div>
                        <Card className="shadow-sm h-full">
                            <CardHeader>
                                <CardTitle>Dane Logowania</CardTitle>
                                <CardDescription>Informacje systemowe i dostępowe.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {accountLoading ? (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Ładowanie konta...
                                    </div>
                                ) : !account ? (
                                    <div className="text-destructive text-sm text-center py-4">
                                        Błąd ładowania konta.
                                    </div>
                                ) : (
                                    <form onSubmit={handleAccountPreSubmit} className="space-y-6">

                                        {/* WPROWADZONO: Sekcja Info + Badge z Rolami pod datą */}
                                        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/10">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="px-2 py-1 bg-background">ID: {account.userId}</Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground" title="Data dołączenia">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Dołączono: {formatDate(account.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Wyświetlanie ról w zespole pod datą */}
                                            {account.userRole && account.userRole.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1 border-t border-dashed mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground self-center">Role:</span>
                                                    {account.userRole.map((roleObj, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant={roleObj.role.includes('ADMIN') ? 'destructive' : 'secondary'}
                                                            className="text-xs px-2 py-0.5"
                                                        >
                                                            {roleObj.role.replace('ROLE_', '')}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="username">Nazwa użytkownika</Label>
                                                <div className="relative">
                                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="username"
                                                        className="pl-9"
                                                        value={accountForm.username}
                                                        onChange={(e) => handleAccountChange('username', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Adres Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        className="pl-9"
                                                        value={accountForm.email}
                                                        onChange={(e) => handleAccountChange('email', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Button type="submit" disabled={accountSaving} variant="secondary" className="w-full sm:w-auto">
                                            {accountSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                                            Aktualizuj konto
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* --- DOLNA SEKCJA: Pełna lista uprawnień (zostawiamy jako szczegóły) --- */}
                {account && !accountLoading && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground border-b pb-2">
                            <Lock className="w-5 h-5" /> Szczegóły Uprawnień
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Role i Uprawnienia</CardTitle>
                                <CardDescription>Szczegółowy opis przypisanych ról.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {account.userRole?.map((roleObj, idx) => (
                                        <div key={idx} className="flex flex-col p-4 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                                    {roleObj.role}
                                                </Badge>
                                                <Shield className="w-4 h-4 text-muted-foreground/50" />
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {roleObj.description || 'Standardowe uprawnienia użytkownika.'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    )
}

export default MemberProfilePage