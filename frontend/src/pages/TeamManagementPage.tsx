import React, { useEffect, useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addMemberManually, TEAM_ROLES, approveTeamMember, removeTeamMember, getMyProfile, createTeam, getTeams } from '@/lib/userApi'
import { OFFLINE, getUserRoles, hasRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, UserCheck, UserX, Wrench, Search as SearchIcon, RotateCw, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
    teamId: z.coerce.number().int().positive('Podaj poprawne ID zespołu'),
    memberId: z.coerce.number().int().positive('Podaj poprawne ID członka'),
    role: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// categories requested by user (lowercase labels) and hover highlight on items
const TEAM_CATEGORIES = ['academy', 'junior', 'senior', 'u19', 'u17'] as const

// Types for members and team form (moved to top to be available for state initialization)
type Member = { id: number; fullName: string; number: number; status: string; roles: string[] }
type TeamForm = { id: number; name: string; code: string; city?: string; founded?: number; status: string; category: string }

const mockMembers: Member[] = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    fullName: `Kandydat ${i + 1}`,
    number: 20 + i,
    status: i % 3 === 0 ? 'WAITING' : 'ACTIVE',
    roles: i % 2 === 0 ? ['PLAYER'] : ['PLAYER', 'GOALKEEPER'],
}))

const mockTeam: TeamForm = { id: 101, name: 'Mój zespół', code: 'ABC123', city: 'City', founded: 2020, status: 'ACTIVE', category: 'Senior' }

// Top-level ErrorBoundary component so it can be used in JSX reliably
class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { error: any }> {
    constructor(props: { children?: React.ReactNode }) {
        super(props)
        this.state = { error: null }
    }
    static getDerivedStateFromError(error: any) {
        return { error }
    }
    componentDidCatch(error: any, info: any) {
        console.error('ErrorBoundary caught', error, info)
    }
    render() {
        if (this.state.error) {
            return (
                <div className="p-6 bg-red-50 text-red-800 rounded-md">
                    <h3 className="font-semibold">Wystąpił błąd podczas renderowania tej zakładki</h3>
                    <pre className="whitespace-pre-wrap text-sm mt-2">{String(this.state.error)}</pre>
                    <div className="mt-2 text-xs text-muted-foreground">Sprawdź konsolę przeglądarki dla pełnego stack trace.</div>
                </div>
            )
        }
        return this.props.children ?? null
    }
}

export function TeamManagementPage() {
    const navigate = useNavigate()
    const [members, setMembers] = useState<Member[]>(mockMembers)
    const [teamForm, setTeamForm] = useState<TeamForm>(mockTeam)
    const [tab, setTab] = useState<'manual' | 'members' | 'team' | 'create'>('manual')
    const [memberAllowed, setMemberAllowed] = useState(true)
    const [memberError, setMemberError] = useState<string | null>(null)
    // create-form validation schema and hook (live validation)
    const createSchema = z.object({
        category: z.enum(['academy', 'junior', 'senior', 'u19', 'u17'] as const),
        code: z.string().min(10, 'Kod zespołu musi mieć 10–16 znaków').max(16, 'Kod zespołu musi mieć 10–16 znaków'),
        name: z.string().min(1, 'Nazwa zespołu jest wymagana'),
        status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const),
        description: z.string().min(50, 'Opis musi mieć co najmniej 50 znaków').max(4095, 'Opis może mieć maksymalnie 4095 znaków'),
    })
    type CreateFormValues = z.infer<typeof createSchema>
    const createFormHook = useForm<CreateFormValues>({
        resolver: zodResolver(createSchema) as any,
        mode: 'onChange',
        defaultValues: { category: 'academy', code: '', name: '', status: 'ACTIVE', description: '' },
    })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        const prev = document.title
        document.title = 'Zarządzanie zespołem'
        let mounted = true
        if (OFFLINE) {
            setMemberAllowed(true)
            setMemberError(null)
            return () => { document.title = prev }
        }
        try {
            // If token already indicates ADMIN or any COACH role, grant access immediately and skip profile fetch
            if (hasRole('ADMIN') || getUserRoles().some(r => r.toUpperCase().includes('COACH'))) {
                setMemberAllowed(true)
                setMemberError(null)
                return () => { document.title = prev }
            }
        } catch (e) {
            // ignore and fallthrough to profile check
        }

        // Fallback: check profile on backend for regular members (may return 404 if not a member)
        getMyProfile({ allowUnauth: true })
            .then(() => { if (mounted) { setMemberAllowed(true); setMemberError(null) } })
            .catch((err: any) => {
                if (!mounted) return
                setMemberAllowed(false)
                setMemberError(err?.message || 'Brak dostępu — wymagana rola członka')
            })
        return () => { mounted = false; document.title = prev }
    }, [])

    const form = useForm<FormValues>({
        mode: 'onSubmit',
        resolver: zodResolver(schema) as any,
        defaultValues: { teamId: 0, memberId: 0, role: undefined },
    })

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            await addMemberManually(values.teamId, { memberId: values.memberId, initialRoles: values.role ? [values.role] : undefined })
            toast.success('Dodano członka (ręcznie)')
            form.reset()
        } catch (err: any) {
            toast.error('Nie udało się dodać', { description: err?.message || 'Spróbuj ponownie' })
        }
    }

    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const filtered = useMemo(() => members.filter((m) => m.fullName.toLowerCase().includes(query.toLowerCase())), [members, query])

    const handleSearch = () => {
        setLoading(true)
        setTimeout(() => setLoading(false), 400)
    }

    const approveMember = async (id: number) => {
        try {
            await approveTeamMember(id)
            setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status: 'ACTIVE' } : m))
            toast.success('Zatwierdzono członka')
        } catch (err: any) {
            toast.error('Nie udało się zatwierdzić', { description: err?.message })
        }
    }

    const rejectMember = async (id: number) => {
        try {
            await removeTeamMember(id)
            setMembers((prev) => prev.filter((m) => m.id !== id))
            toast.info('Odrzucono/wykluczono członka')
        } catch (err: any) {
            toast.error('Nie udało się odrzucić', { description: err?.message })
        }
    }

    const handleSaveTeam = () => {
        toast.success('Zapisano zespół (mock)', { description: `${teamForm.name || 'Bez nazwy'}, ${teamForm.city || '—'}` })
    }
    const handleResetTeam = () => {
        setTeamForm(mockTeam)
        toast.info('Mock: przywrócono dane zespołu')
    }

    if (!memberAllowed && !OFFLINE) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b bg-card">
                    <div className="container flex h-16 items-center px-4">
                        <h1 className="text-2xl font-bold">Zarządzanie zespołem</h1>
                    </div>
                </header>
                <main className="container py-8 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-md border border-amber-500 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
                        {memberError || 'Brak dostępu — wymagana rola członka. Zostań zatwierdzonym członkiem, aby zarządzać zespołem.'}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Zarządzanie zespołem</h1>
                    <div className="flex items-center gap-8">
                        <Button
                            size="lg"
                            className="group shrink-0 px-8 min-w-[190px] relative"
                            onClick={() => navigate('/matches-management')}
                        >
                            <Calendar
                                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
                            />
                            <span
                                className="w-full flex justify-center items-center leading-tight transition-transform duration-150 group-hover:translate-x-4">
                                Zarządzaj meczami
                            </span>
                        </Button>

                        <Button variant="outline" onClick={() => navigate('/dashboard')}>
                            Wróć do panelu
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container py-8 space-y-6 px-4 sm:px-6 lg:px-8">
                {!memberAllowed && !OFFLINE && (
                    <div className="rounded-md border border-amber-500 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
                        {memberError}. Zostań zatwierdzonym członkiem, aby zarządzać zespołem.
                    </div>
                )}
                <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-6">
                    <TabsList className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-transparent p-0">
                        <TabsTrigger
                            value="manual"
                            className="rounded-lg border bg-card hover:bg-card/80 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                        >
                            Ręczne dodanie
                        </TabsTrigger>
                        <TabsTrigger
                            value="members"
                            className="rounded-lg border bg-card hover:bg-card/80 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                        >
                            Członkowie / oczekujące
                        </TabsTrigger>
                        <TabsTrigger
                            value="team"
                            className="rounded-lg border bg-card hover:bg-card/80 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                        >
                            Aktualizuj zespół
                        </TabsTrigger>
                        <TabsTrigger
                            value="create"
                            className="rounded-lg border bg-card hover:bg-card/80 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                        >
                            Dodaj zespół
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <section className="w-full rounded-lg border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-semibold">Dodaj członka ręcznie</h2>
                            <p className="text-sm text-muted-foreground mb-4">Wprowadź ID zespołu oraz ID członka.
                                Opcjonalnie wybierz rolę startową.</p>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="teamId"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>ID zespołu</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode="numeric"
                                                           placeholder="np. 123" {...field}
                                                           onChange={(e) => field.onChange(Number(e.target.value))}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="memberId"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>ID członka</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode="numeric"
                                                           placeholder="np. 456" {...field}
                                                           onChange={(e) => field.onChange(Number(e.target.value))}/>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Rola (opcjonalnie)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Wybierz rolę"/>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent
                                                        position="popper"
                                                        className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg [&_[data-radix-select-viewport]]:bg-white dark:[&_[data-radix-select-viewport]]:bg-slate-900"
                                                    >
                                                        {TEAM_ROLES.map((role) => (
                                                            <SelectItem
                                                                key={role}
                                                                value={role}
                                                                className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
                                                            >
                                                                {role}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit">Dodaj członka</Button>
                                        <Button type="button" variant="outline"
                                                onClick={() => form.reset()}>Wyczyść</Button>
                                    </div>
                                </form>
                            </Form>
                        </section>
                    </TabsContent>

                    <TabsContent value="members">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Członkowie i aplikacje</CardTitle>
                                <CardDescription>Mock – zatwierdzanie/odrzucanie i podgląd profilu.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-[220px] space-y-1">
                                        <label className="text-sm font-medium">Szukaj</label>
                                        <Input value={query} onChange={(e) => setQuery(e.target.value)}
                                               placeholder="np. Jan"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSearch} disabled={loading}>
                                            <SearchIcon className="mr-2 h-4 w-4"/>Szukaj
                                        </Button>
                                        <Button variant="outline" onClick={() => {
                                            setQuery('');
                                            handleSearch()
                                        }} disabled={loading}>
                                            <RotateCw className="mr-2 h-4 w-4"/>Wyczyść
                                        </Button>
                                    </div>
                                </div>
                                <div className="rounded-lg border overflow-x-auto">
                                    <table className="w-full min-w-[620px] text-sm table-auto">
                                        <thead>
                                        <tr className="bg-muted/60">
                                            <th className="px-3 py-2 text-left rounded-tl-lg">#</th>
                                            <th className="px-3 py-2 text-left">Imię i nazwisko</th>
                                            <th className="px-3 py-2 text-left">Numer</th>
                                            <th className="px-3 py-2 text-left">Role</th>
                                            <th className="px-3 py-2 text-left">Status</th>
                                            <th className="px-3 py-2 text-left rounded-tr-lg">Akcje</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {loading && Array.from({length: 3}).map((_, i) => (
                                            <tr key={`s-${i}`} className="border-t">
                                                <td className="px-3 py-3" colSpan={6}><Skeleton className="h-4 w-full"/>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && filtered.map((m, idx) => (
                                            <tr key={m.id} className="border-t odd:bg-muted/40 hover:bg-muted/60">
                                                <td className="px-3 py-2 font-semibold">{idx + 1}</td>
                                                <td className="px-3 py-2">{m.fullName}</td>
                                                <td className="px-3 py-2">{m.number}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        {m.roles.map((r: string) => (
                                                            <Badge key={r} variant="outline">{r}</Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2"><Badge
                                                    variant={m.status === 'ACTIVE' ? 'default' : 'secondary'}>{m.status}</Badge>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline"
                                                                onClick={() => navigate(`/member/${m.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4"/>Podgląd
                                                        </Button>
                                                        {m.status === 'WAITING' && (
                                                            <>
                                                                <Button size="sm" variant="default"
                                                                        onClick={() => approveMember(m.id)}><UserCheck
                                                                    className="mr-2 h-4 w-4"/>Zatwierdź</Button>
                                                                <Button size="sm" variant="destructive"
                                                                        onClick={() => rejectMember(m.id)}><UserX
                                                                    className="mr-2 h-4 w-4"/>Odrzuć</Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={6}
                                                    className="px-3 py-4 text-center text-muted-foreground">Brak wyników
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="team">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Aktualizuj zespół</CardTitle>
                                <CardDescription>Mock UI: zmiana nazwy, miasta, kodu dołączenia.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Nazwa zespołu</label>
                                        <Input value={teamForm.name}
                                               onChange={(e) => setTeamForm((t: TeamForm) => ({...t, name: e.target.value}))}/>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Status zespołu</label>
                                        <Select value={teamForm.status}
                                                onValueChange={(v) => setTeamForm((t: TeamForm) => ({...t, status: v}))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Wybierz status" />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg [&_[data-radix-select-viewport]]:bg-white dark:[&_[data-radix-select-viewport]]:bg-slate-900"
                                            >
                                                <SelectItem value="ACTIVE">Aktywny</SelectItem>
                                                <SelectItem value="INACTIVE">Nieaktywny</SelectItem>
                                                <SelectItem value="ARCHIVED">Zarchiwizowany</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Miasto</label>
                                        <Input value={teamForm.city}
                                               onChange={(e) => setTeamForm((t: TeamForm) => ({...t, city: e.target.value}))}/>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Kod dołączenia</label>
                                        <Input value={teamForm.code}
                                               onChange={(e) => setTeamForm((t: TeamForm) => ({...t, code: e.target.value}))}/>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Rok założenia</label>
                                        <Input type="number" value={teamForm.founded}
                                               onChange={(e) => setTeamForm((t: TeamForm) => ({
                                                   ...t,
                                                   founded: Number(e.target.value || 0)
                                               }))}/>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Kategoria zespołu</label>
                                        <Select value={teamForm.category} onValueChange={(v) => setTeamForm((t: TeamForm) => ({...t, category: v}))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Wybierz kategorię" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg">
                                                {TEAM_CATEGORIES.map((c) => (
                                                    <SelectItem
                                                        key={c}
                                                        value={c}
                                                        className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700 hover:bg-accent/10"
                                                    >
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" onClick={handleSaveTeam}>
                                        <Wrench className="mr-2 h-4 w-4"/>Zapisz zmiany (mock)
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleResetTeam}>
                                        Usuń zespół (mock)
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="create">
                        <ErrorBoundary>
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Dodaj nowy zespół</CardTitle>
                                <CardDescription>Wprowadź dane zespołu (te same pola co w aktualizacji)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Form {...createFormHook}>
                                 <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <FormField
                                            control={createFormHook.control as any}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kategoria zespołu</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Wybierz kategorię" />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper" className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg">
                                                                {TEAM_CATEGORIES.map((c) => (
                                                                    <SelectItem
                                                                        key={c}
                                                                        value={c}
                                                                        className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700 hover:bg-accent/10"
                                                                    >
                                                                        {c}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <FormField
                                            control={createFormHook.control as any}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kod zespołu</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="10-16 znaków" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Nazwa zespołu</label>
                                        <FormField
                                            control={createFormHook.control as any}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <FormField
                                            control={createFormHook.control as any}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Status</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Wybierz status" />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper" className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg">
                                                                <SelectItem value="ACTIVE">Aktywny</SelectItem>
                                                                <SelectItem value="INACTIVE">Nieaktywny</SelectItem>
                                                                <SelectItem value="ARCHIVED">Zarchiwizowany</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <FormField
                                            control={createFormHook.control as any}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <textarea {...field} rows={4} className="w-full rounded-md border border-border shadow-sm p-2 bg-transparent text-sm" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" onClick={createFormHook.handleSubmit(handleCreateTeam)} disabled={creating}>
                                        {creating ? 'Tworzenie...' : 'Utwórz zespół'}
                                    </Button>
                                    <Button variant="outline" onClick={() => createFormHook.reset()}>Wyczyść</Button>
                                </div>
                                </Form>
                             </CardContent>
                         </Card>
                         </ErrorBoundary>
                     </TabsContent>
                </Tabs>
            </main>
        </div>
    )

    async function handleCreateTeam(values: CreateFormValues) {
        setCreating(true)
        try {
            const categoryMap: Record<string, string> = {
                academy: 'ACADEMY',
                junior: 'JUNIOR',
                senior: 'SENIOR',
                u19: 'U19',
                u17: 'U17',
            }
            const mappedCategory = categoryMap[values.category] ?? values.category.toUpperCase()

            await createTeam({ name: values.name.trim(), code: values.code.trim(), status: values.status, category: mappedCategory, description: values.description.trim() })

            // Refresh teams listing (attempt to find created team)
            try {
                const list = await getTeams({ mode: 'MY_TEAMS', page: 0, size: 50 })
                const found = list.items.find((t: any) => (t.teamName ?? t.name) === values.name || (t.code ?? (t as any).code) === values.code)
                if (found) {
                    const foundId = found.teamId ?? (found as any).id ?? (found as any).teamId
                    setTeamForm((prev: TeamForm) => ({
                         id: foundId,
                         name: found.teamName ?? (found as any).name ?? values.name,
                         code: (found as any).code ?? values.code ?? prev.code,
                         city: (found as any).city ?? prev.city,
                         founded: (found as any).founded ?? prev.founded,
                        status: (found as any).status ?? values.status,
                        category: (found as any).category ?? values.category,
                     }))
                 } else {
                    setTeamForm((t: TeamForm) => ({ ...t, name: values.name, code: values.code, status: values.status, category: values.category }))
                     console.warn('Utworzono zespół, ale nie znaleziono go w GET /teams (MOŻLIWE OPÓŹNIENIE indeksowania)')
                 }
             } catch (e) {
                setTeamForm((t: TeamForm) => ({ ...t, name: values.name, code: values.code, status: values.status, category: values.category }))
                 console.warn('getTeams failed after createTeam', e)
             }

            toast.success('Utworzono zespół')
            createFormHook.reset()
            setTab('team')
        } catch (err: any) {
            console.error('createTeam error', err)
            toast.error('Nie udało się utworzyć zespołu', { description: err?.message || 'Sprawdź konsolę dla szczegółów' })
        } finally {
            setCreating(false)
        }
    }
}

export default TeamManagementPage

