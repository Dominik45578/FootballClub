import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    ArrowLeft, Search, ShieldAlert, Lock, Unlock,
    UserX, UserCheck, ShieldPlus, ShieldMinus, Loader2, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import {
    adminGetUser,
    adminBlockUser,
    adminUnblockUser,
    adminGrantRoles,
    adminRevokeRoles
} from '@/lib/userApi'
import type { AdminUserResponse } from '@/lib/userApi'

// Lista dostępnych ról w systemie
const AVAILABLE_ROLES = [
    'ROLE_USER',
    'ROLE_MEMBER',
    'ROLE_PLAYER',
    'ROLE_COACH',
    'ROLE_ADMIN' // Krytyczna rola
]

export function AdminUsersPage() {
    const navigate = useNavigate()

    // Stan wyszukiwania
    const [searchId, setSearchId] = useState('')
    const [fetchedUser, setFetchedUser] = useState<AdminUserResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [notFound, setNotFound] = useState(false)

    // Stan operacji
    const [actionLoading, setActionLoading] = useState(false)

    // Stan ról (wybrane do dodania/usunięcia)
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])

    // Modal potwierdzenia dla ADMINA
    const [confirmAdminAction, setConfirmAdminAction] = useState<{ type: 'GRANT' | 'REVOKE', isOpen: boolean }>({ type: 'GRANT', isOpen: false })

    useEffect(() => {
        document.title = 'Panel Administratora - Użytkownicy'
    }, [])

    // --- HELPER DO OBSŁUGI BŁĘDÓW ---
    const handleError = (title: string, err: any) => {
        console.error(err)

        // 1. Sprawdzenie błędu sieciowego (Brak połączenia)
        if (err instanceof TypeError || err.message === 'Failed to fetch' || err.name === 'TypeError') {
            toast.error('Brak połączenia z serwerem', {
                description: 'Sprawdź czy backend jest uruchomiony lub czy masz dostęp do internetu.'
            })
            return
        }

        // 2. Pobranie wiadomości z JSON-a z backendu
        // Twój backend zwraca np. { "error": "user cannot block himself" }
        // Standardowy Spring zwraca { "message": "..." }
        const backendMessage = err?.error || err?.message

        if (backendMessage) {
            toast.error(title, { description: backendMessage })
            console.error(backendMessage)

        } else {
            // 3. Fallback dla innych błędów
            toast.error(title, { description: 'Wystąpił nieoczekiwany błąd.' })
            console.error(backendMessage)
        }
    }

    // --- HANDLERY ---

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!searchId) return

        setLoading(true)
        setFetchedUser(null)
        setNotFound(false)
        setSelectedRoles([]) // Reset wyboru ról

        try {
            const user = await adminGetUser(Number(searchId))
            setFetchedUser(user)
        } catch (err: any) {
            // Specyficzna obsługa dla 404 przy wyszukiwaniu
            if (err?.status === 404) {
                setNotFound(true)
            } else {
                handleError('Błąd wyszukiwania', err)
                setNotFound(true)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleBlock = async () => {
        if (!fetchedUser) return
        setActionLoading(true)
        try {
            await adminBlockUser(fetchedUser.userId)
            toast.success(`Użytkownik #${fetchedUser.userId} został zablokowany.`)
        } catch (err: any) {
            handleError('Nie udało się zablokować użytkownika', err)
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnblock = async () => {
        if (!fetchedUser) return
        setActionLoading(true)
        try {
            await adminUnblockUser(fetchedUser.userId)
            toast.success(`Użytkownik #${fetchedUser.userId} został odblokowany.`)
        } catch (err: any) {
            handleError('Nie udało się odblokować użytkownika', err)
        } finally {
            setActionLoading(false)
        }
    }

    // Obsługa wyboru ról
    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        )
    }

    // Logika wywołania API ról
    const executeRoleUpdate = async (type: 'GRANT' | 'REVOKE') => {
        if (!fetchedUser || selectedRoles.length === 0) return

        // Zamknij modal jeśli otwarty
        setConfirmAdminAction({ ...confirmAdminAction, isOpen: false })
        setActionLoading(true)

        try {
            const payload = { userId: fetchedUser.userId, roles: selectedRoles }
            if (type === 'GRANT') {
                await adminGrantRoles(payload)
                toast.success('Pomyślnie nadano role.')
            } else {
                await adminRevokeRoles(payload)
                toast.success('Pomyślnie odebrano role.')
            }
            // Odśwież dane usera po zmianie
            handleSearch()
        } catch (err: any) {
            handleError('Błąd aktualizacji ról', err)
        } finally {
            setActionLoading(false)
        }
    }

    // Wrapper sprawdzający czy dotykamy ROLE_ADMIN
    const handleRoleActionAttempt = (type: 'GRANT' | 'REVOKE') => {
        if (selectedRoles.includes('ROLE_ADMIN')) {
            setConfirmAdminAction({ type, isOpen: true })
        } else {
            executeRoleUpdate(type)
        }
    }

    // --- RENDEROWANIE ---

    return (
        <div className="min-h-screen bg-background relative">

            {/* Modal bezpieczeństwa dla ROLE_ADMIN */}
            {confirmAdminAction.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <Card className="w-full max-w-md border-destructive shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <ShieldAlert className="h-6 w-6" />
                                Potwierdzenie uprawnień
                            </CardTitle>
                            <CardDescription>
                                Próbujesz {confirmAdminAction.type === 'GRANT' ? 'nadać' : 'odebrać'} rolę <strong>Administratora</strong>.
                                To krytyczna operacja dająca pełną kontrolę nad systemem.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-destructive/10 p-3 rounded text-sm text-destructive font-medium">
                                Czy na pewno chcesz wykonać tę akcję dla użytkownika #{fetchedUser?.userId} ({fetchedUser?.userName})?
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setConfirmAdminAction({...confirmAdminAction, isOpen: false})}>Anuluj</Button>
                                <Button variant="destructive" onClick={() => executeRoleUpdate(confirmAdminAction.type)}>
                                    Potwierdzam, wykonaj
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-primary" /> Panel Administratora
                    </h1>
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                </div>
            </header>

            <main className="container py-8 px-4 max-w-4xl mx-auto space-y-6">

                {/* Sekcja 1: Wyszukiwarka */}
                <Card>
                    <CardHeader>
                        <CardTitle>Znajdź użytkownika</CardTitle>
                        <CardDescription>Wprowadź ID użytkownika, aby zarządzać jego kontem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="ID Użytkownika (np. 10)"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                type="number"
                                className="max-w-xs"
                            />
                            <Button type="submit" disabled={loading || !searchId}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                Szukaj
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Sekcja 2: Wynik (Profil Usera) */}
                {notFound && (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/30">
                        <UserX className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">Nie znaleziono</h3>
                        <p className="text-muted-foreground">Użytkownik o podanym ID nie istnieje w systemie.</p>
                    </div>
                )}

                {fetchedUser && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        {/* Podgląd profilu */}
                        <Card className="border-l-4 border-l-primary shadow-sm bg-muted/10">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{fetchedUser.userName}</CardTitle>
                                        <CardDescription>{fetchedUser.userEmail}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-base px-3 py-1">ID: {fetchedUser.userId}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {fetchedUser.userRole?.map((r) => (
                                        <Badge key={r.role} variant="secondary" className="font-mono">
                                            {r.role.replace('ROLE_', '')}
                                        </Badge>
                                    ))}
                                    {(!fetchedUser.userRole || fetchedUser.userRole.length === 0) && (
                                        <span className="text-sm text-muted-foreground italic">Brak ról</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sekcja 3: Zakładki Operacyjne */}
                        <Tabs defaultValue="status" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="status">Status Konta (Blokady)</TabsTrigger>
                                <TabsTrigger value="roles">Zarządzanie Rolami</TabsTrigger>
                            </TabsList>

                            {/* ZAKŁADKA 1: BLOKADY */}
                            <TabsContent value="status">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Blokowanie dostępu</CardTitle>
                                        <CardDescription>Zablokuj użytkownikowi możliwość logowania do systemu.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 flex flex-col items-center justify-center text-center gap-2">
                                            <Lock className="h-8 w-8 text-red-500" />
                                            <h4 className="font-semibold text-red-700 dark:text-red-400">Zablokuj konto</h4>
                                            <p className="text-xs text-muted-foreground mb-2">Użytkownik zostanie wylogowany i straci dostęp.</p>
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={handleBlock}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                                                Zablokuj
                                            </Button>
                                        </div>

                                        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 flex flex-col items-center justify-center text-center gap-2">
                                            <Unlock className="h-8 w-8 text-green-600" />
                                            <h4 className="font-semibold text-green-700 dark:text-green-400">Odblokuj konto</h4>
                                            <p className="text-xs text-muted-foreground mb-2">Przywróć pełny dostęp do systemu.</p>
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                onClick={handleUnblock}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                                Odblokuj
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ZAKŁADKA 2: ROLE */}
                            <TabsContent value="roles">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Uprawnienia systemowe</CardTitle>
                                        <CardDescription>Zaznacz role, które chcesz nadać lub odebrać użytkownikowi.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">

                                        {/* Wybór ról */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {AVAILABLE_ROLES.map((role) => {
                                                const isCritical = role === 'ROLE_ADMIN'
                                                const userHasRole = fetchedUser.userRole?.some(r => r.role === role)
                                                return (
                                                    <div
                                                        key={role}
                                                        className={`flex items-center space-x-2 border p-3 rounded-md transition-colors ${selectedRoles.includes(role) ? 'bg-accent border-primary' : 'bg-background'}`}
                                                    >
                                                        <Checkbox
                                                            id={role}
                                                            checked={selectedRoles.includes(role)}
                                                            onCheckedChange={() => toggleRole(role)}
                                                        />
                                                        <Label
                                                            htmlFor={role}
                                                            className={`cursor-pointer text-sm font-mono flex items-center gap-1 ${isCritical ? 'text-destructive font-bold' : ''}`}
                                                        >
                                                            {role.replace('ROLE_', '')}
                                                            {isCritical && <AlertTriangle className="h-3 w-3" />}
                                                            {userHasRole && <CheckBadge />}
                                                        </Label>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <CheckBadge /> - Użytkownik już posiada tę rolę
                                        </div>

                                        {/* Akcje */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                            <Button
                                                className="flex-1"
                                                variant="secondary"
                                                onClick={() => handleRoleActionAttempt('GRANT')}
                                                disabled={actionLoading || selectedRoles.length === 0}
                                            >
                                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="mr-2 h-4 w-4" />}
                                                Nadaj wybrane role
                                            </Button>

                                            <Button
                                                className="flex-1"
                                                variant="outline"
                                                onClick={() => handleRoleActionAttempt('REVOKE')}
                                                disabled={actionLoading || selectedRoles.length === 0}
                                            >
                                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldMinus className="mr-2 h-4 w-4" />}
                                                Odbierz wybrane role
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </main>
        </div>
    )
}

// Mały helper UI
function CheckBadge() {
    return (
        <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-green-500" title="Użytkownik posiada tę rolę" />
    )
}

export default AdminUsersPage