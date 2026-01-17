import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
    ArrowLeft, Search, ShieldAlert, Lock, Unlock,
    UserX, ShieldPlus, ShieldMinus, Loader2, AlertTriangle,
    User, Mail, CheckCircle2, XCircle, CalendarClock, Ban
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
import { cn } from '@/lib/utils'

// POPRAWIONY INTERFEJS
interface ExtendedAdminUser extends AdminUserResponse {
    nonLocked?: boolean;
}

const AVAILABLE_ROLES = [
    'ROLE_USER',
    'ROLE_MEMBER',
    'ROLE_PLAYER',
    'ROLE_COACH',
    'ROLE_ADMIN'
]

export function AdminUsersPage() {
    const navigate = useNavigate()

    // --- Stan ---
    const [searchId, setSearchId] = useState('')
    const [fetchedUser, setFetchedUser] = useState<ExtendedAdminUser | null>(null)
    const [loading, setLoading] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Role
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [confirmAdminAction, setConfirmAdminAction] = useState<{ type: 'GRANT' | 'REVOKE', isOpen: boolean }>({ type: 'GRANT', isOpen: false })

    useEffect(() => {
        document.title = 'Panel Administratora - Użytkownicy'
    }, [])

    // --- API HANDLERS ---

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!searchId) return

        setLoading(true)
        setFetchedUser(null)
        setNotFound(false)
        setSelectedRoles([])

        try {
            const user = await adminGetUser(Number(searchId))
            setFetchedUser(user as ExtendedAdminUser)
        } catch (err: any) {
            if (err?.status === 404) {
                setNotFound(true)
            } else {
                toast.error('Błąd wyszukiwania', { description: err.message })
            }
        } finally {
            setLoading(false)
        }
    }

    const refreshUserData = async () => {
        if (!fetchedUser) return
        try {
            const user = await adminGetUser(fetchedUser.userId)
            setFetchedUser(user as ExtendedAdminUser)
        } catch (e) { console.error(e) }
    }

    const handleBlock = async () => {
        if (!fetchedUser) return
        setActionLoading(true)
        try {
            await adminBlockUser(fetchedUser.userId)
            toast.success('Użytkownik zablokowany.')
            await refreshUserData()
        } catch (err: any) {
            toast.error('Błąd blokady', { description: err.message })
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnblock = async () => {
        if (!fetchedUser) return
        setActionLoading(true)
        try {
            await adminUnblockUser(fetchedUser.userId)
            toast.success('Użytkownik odblokowany.')
            await refreshUserData()
        } catch (err: any) {
            toast.error('Błąd odblokowania', { description: err.message })
        } finally {
            setActionLoading(false)
        }
    }

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        )
    }

    const executeRoleUpdate = async (type: 'GRANT' | 'REVOKE') => {
        if (!fetchedUser || selectedRoles.length === 0) return
        setConfirmAdminAction({ ...confirmAdminAction, isOpen: false })
        setActionLoading(true)

        try {
            const payload = { userId: fetchedUser.userId, roles: selectedRoles }
            if (type === 'GRANT') {
                await adminGrantRoles(payload)
                toast.success('Nadano role.')
            } else {
                await adminRevokeRoles(payload)
                toast.success('Odebrano role.')
            }
            await refreshUserData()
            setSelectedRoles([])
        } catch (err: any) {
            toast.error('Błąd ról', { description: err.message })
        } finally {
            setActionLoading(false)
        }
    }

    const handleRoleActionAttempt = (type: 'GRANT' | 'REVOKE') => {
        if (selectedRoles.includes('ROLE_ADMIN')) {
            setConfirmAdminAction({ type, isOpen: true })
        } else {
            executeRoleUpdate(type)
        }
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleString('pl-PL')
    }

    // --- LOGIKA KOLORÓW PASKA ---
    const getUserColorClass = (user: ExtendedAdminUser) => {
        const isNonLocked = user.accountNonLocked ?? user.nonLocked ?? true;
        // Jeśli zablokowany -> czerwony pasek
        // Jeśli aktywny -> zielony pasek
        return isNonLocked ? "border-l-emerald-600" : "border-l-red-700";
    }

    return (
        <div className="min-h-screen bg-background relative pb-12">

            {/* Modal bezpieczeństwa dla ROLE_ADMIN */}
            {confirmAdminAction.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <Card className="w-full max-w-md border-destructive shadow-2xl animate-in zoom-in-95">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <ShieldAlert className="h-6 w-6" /> Potwierdzenie uprawnień
                            </CardTitle>
                            <CardDescription>
                                Próbujesz {confirmAdminAction.type === 'GRANT' ? 'nadać' : 'odebrać'} rolę <strong>Administratora</strong>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">Czy na pewno chcesz kontynuować operację dla użytkownika <strong>{fetchedUser?.userName}</strong>?</p>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setConfirmAdminAction({...confirmAdminAction, isOpen: false})}>Anuluj</Button>
                                <Button variant="destructive" onClick={() => executeRoleUpdate(confirmAdminAction.type)}>Potwierdzam</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-primary" /> Panel Administratora
                    </h1>
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
                    </Button>
                </div>
            </header>

            <main className="container py-8 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* --- LEWA KOLUMNA: WYSZUKIWARKA (4/12) --- */}
                    <div className="md:col-span-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Znajdź użytkownika</CardTitle>
                                <CardDescription>Wyszukaj po ID, aby edytować.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSearch} className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="ID Użytkownika (np. 1)"
                                            value={searchId}
                                            onChange={(e) => setSearchId(e.target.value)}
                                            type="number"
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading || !searchId}>
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Wyszukaj
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {notFound && (
                            <div className="p-6 text-center border-2 border-dashed rounded-lg bg-muted/30 animate-in fade-in">
                                <UserX className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                <h3 className="font-medium">Nie znaleziono</h3>
                                <p className="text-sm text-muted-foreground">Brak użytkownika o ID: {searchId}</p>
                            </div>
                        )}
                    </div>

                    {/* --- PRAWA KOLUMNA: DANE I AKCJE (8/12) --- */}
                    <div className="md:col-span-8 space-y-6">
                        {fetchedUser ? (
                            (() => {
                                // Logika statusów
                                const isNonLocked = fetchedUser.accountNonLocked ?? fetchedUser.nonLocked ?? true;
                                const isEnabled = fetchedUser.enabled;

                                return (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

                                        {/* 1. KARTA GŁÓWNA UŻYTKOWNIKA (Kompaktowa) */}
                                        <Card className={cn(
                                            "overflow-hidden border-l-[6px] shadow-sm transition-colors bg-card p-0",
                                            getUserColorClass(fetchedUser)
                                        )}>
                                            <CardContent className="p-0">
                                                <div className="flex flex-col sm:flex-row min-h-[100px]">

                                                    {/* Lewa część: Dane */}
                                                    <div className="flex-1 p-4 space-y-3">

                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border shadow-sm shrink-0">
                                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-foreground leading-none">
                                                                        {fetchedUser.userName}
                                                                    </h3>
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                                        <Mail className="h-3 w-3" /> {fetchedUser.userEmail}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Badges Statusu - CIEMNE ODCIENIE */}
                                                            <div className="flex flex-col items-end gap-1.5">
                                                                {/* Weryfikacja */}
                                                                {isEnabled ? (
                                                                    <Badge className="bg-emerald-950 text-emerald-50 hover:bg-emerald-900 border-emerald-800 gap-1 px-2 py-0.5 text-[10px]">
                                                                        <CheckCircle2 className="h-3 w-3" /> Zweryfikowany
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-red-950 text-red-50 hover:bg-red-900 border-red-900 gap-1 px-2 py-0.5 text-[10px]">
                                                                        <XCircle className="h-3 w-3" /> Niezweryfikowany
                                                                    </Badge>
                                                                )}

                                                                {/* Blokada */}
                                                                {isNonLocked ? (
                                                                    <Badge className="bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700 gap-1 px-2 py-0.5 text-[10px]">
                                                                        Aktywny
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-red-900 text-white hover:bg-red-800 border-red-800 gap-1 px-2 py-0.5 text-[10px]">
                                                                        <Ban className="h-3 w-3" /> Zablokowany
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Separator className="my-2" />

                                                        {/* Dolna linia: Info + Role */}
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                                                <span className="bg-muted px-1.5 py-0.5 rounded font-mono border">ID: {fetchedUser.userId}</span>
                                                                <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {formatDate(fetchedUser.createdAt)}</span>
                                                            </div>

                                                            {/* Aktywne Role */}
                                                            <div className="flex flex-wrap gap-1">
                                                                {fetchedUser.userRole && fetchedUser.userRole.length > 0 ? (
                                                                    fetchedUser.userRole.map((r) => (
                                                                        <Badge key={r.role} variant="secondary" className="px-2 py-0 font-mono text-[10px] border">
                                                                            {r.role.replace('ROLE_', '')}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[10px] text-muted-foreground italic">Brak ról</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Prawy Panel Akcji (Blokada) */}
                                                    <div className="flex flex-col items-center justify-center p-3 border-t sm:border-t-0 sm:border-l bg-muted/10 min-w-[110px] gap-2">
                                                        {!isNonLocked ? (
                                                            <Button
                                                                onClick={handleUnblock}
                                                                disabled={actionLoading}
                                                                size="sm"
                                                                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm h-8 text-xs gap-1.5"
                                                            >
                                                                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                                                                Odblokuj
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="destructive"
                                                                onClick={handleBlock}
                                                                disabled={actionLoading}
                                                                size="sm"
                                                                className="w-full h-8 text-xs shadow-sm gap-1.5"
                                                            >
                                                                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                                                                Zablokuj
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* 2. KARTA ZARZĄDZANIA ROLAMI */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base">Zarządzanie Uprawnieniami</CardTitle>
                                                <CardDescription className="text-xs">Zaznacz role, aby je nadać lub odebrać.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {AVAILABLE_ROLES.map((role) => {
                                                        const isCritical = role === 'ROLE_ADMIN'
                                                        const hasRole = fetchedUser.userRole?.some(r => r.role === role)
                                                        const isSelected = selectedRoles.includes(role)

                                                        return (
                                                            <div
                                                                key={role}
                                                                className={cn(
                                                                    "flex items-center space-x-2 border p-2 rounded-md transition-all cursor-pointer select-none h-8",
                                                                    isSelected && "bg-primary/5 border-primary ring-1 ring-primary/20",
                                                                    hasRole && !isSelected && "opacity-60 bg-muted/20 border-dashed"
                                                                )}
                                                                onClick={() => toggleRole(role)}
                                                            >
                                                                <Checkbox
                                                                    id={role}
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleRole(role)}
                                                                    className="h-3.5 w-3.5"
                                                                />
                                                                <Label className={cn("cursor-pointer font-mono text-[10px] sm:text-xs flex items-center gap-1 w-full", isCritical && "text-destructive font-bold")}>
                                                                    {role.replace('ROLE_', '')}
                                                                    {isCritical && <AlertTriangle className="h-3 w-3" />}
                                                                    {hasRole && <CheckCircle2 className="h-3 w-3 text-emerald-600 ml-auto" />}
                                                                </Label>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                                                    <Button
                                                        className="flex-1 gap-1 h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                                                        onClick={() => handleRoleActionAttempt('GRANT')}
                                                        disabled={actionLoading || selectedRoles.length === 0}
                                                    >
                                                        {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldPlus className="h-3 w-3" />}
                                                        Nadaj wybrane
                                                    </Button>

                                                    <Button
                                                        className="flex-1 gap-1 h-8 text-xs"
                                                        variant="outline"
                                                        onClick={() => handleRoleActionAttempt('REVOKE')}
                                                        disabled={actionLoading || selectedRoles.length === 0}
                                                    >
                                                        {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldMinus className="h-3 w-3" />}
                                                        Odbierz wybrane
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                    </div>
                                )
                            })()
                        ) : (
                            // STAN POCZĄTKOWY (Empty State)
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10 min-h-[300px]">
                                <Search className="h-12 w-12 mb-3 opacity-20" />
                                <h3 className="text-lg font-medium text-foreground">Wybierz użytkownika</h3>
                                <p className="max-w-xs mx-auto mt-1 text-sm">Wyszukaj użytkownika po ID w panelu po lewej stronie, aby zarządzać jego kontem.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AdminUsersPage