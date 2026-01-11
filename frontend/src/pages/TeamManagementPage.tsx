import { useEffect, useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addMemberManually, TEAM_ROLES } from '@/lib/userApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, UserCheck, UserX, Wrench, Search as SearchIcon, RotateCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
    teamId: z.coerce.number().int().positive('Podaj poprawne ID zespołu'),
    memberId: z.coerce.number().int().positive('Podaj poprawne ID członka'),
    role: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const mockMembers = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    fullName: `Kandydat ${i + 1}`,
    number: 20 + i,
    status: i % 3 === 0 ? 'WAITING' : 'ACTIVE',
    roles: i % 2 === 0 ? ['PLAYER'] : ['PLAYER', 'GOALKEEPER'],
}))

const mockTeam = { id: 101, name: 'Mój zespół', code: 'ABC123', city: 'City', founded: 2020 }

export function TeamManagementPage() {
    const navigate = useNavigate()
    const [members, setMembers] = useState(mockMembers)
    const [teamForm, setTeamForm] = useState(mockTeam)
    const [tab, setTab] = useState<'manual' | 'members' | 'team'>('manual')
    useEffect(() => {
        const prev = document.title
        document.title = 'Zarządzanie zespołem'
        return () => { document.title = prev }
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

    const approveMember = (id: number) => {
        setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status: 'ACTIVE' } : m))
        toast.success('Zatwierdzono członka (mock)')
    }

    const rejectMember = (id: number) => {
        setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status: 'REJECTED' } : m))
        toast.info('Odrzucono/wykluczono członka (mock)')
    }

    const handleSaveTeam = () => {
        toast.success('Zapisano zespół (mock)', { description: `${teamForm.name || 'Bez nazwy'}, ${teamForm.city || '—'}` })
    }
    const handleResetTeam = () => {
        setTeamForm(mockTeam)
        toast.info('Mock: przywrócono dane zespołu')
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Zarządzanie zespołem</h1>
                </div>
            </header>
            <main className="container py-8 space-y-6 px-4 sm:px-6 lg:px-8">
                <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="manual">Ręczne dodanie</TabsTrigger>
                        <TabsTrigger value="members">Członkowie / oczekujące</TabsTrigger>
                        <TabsTrigger value="team">Aktualizuj zespół</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <section className="w-full rounded-lg border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-semibold">Dodaj członka ręcznie</h2>
                            <p className="text-sm text-muted-foreground mb-4">Wprowadź ID zespołu oraz ID członka. Opcjonalnie wybierz rolę startową.</p>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="teamId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID zespołu</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode="numeric" placeholder="np. 123" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="memberId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID członka</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode="numeric" placeholder="np. 456" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rola (opcjonalnie)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Wybierz rolę" />
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
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit">Dodaj członka</Button>
                                        <Button type="button" variant="outline" onClick={() => form.reset()}>Wyczyść</Button>
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
                                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="np. Jan" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSearch} disabled={loading}>
                                            <SearchIcon className="mr-2 h-4 w-4" />Szukaj
                                        </Button>
                                        <Button variant="outline" onClick={() => { setQuery(''); handleSearch() }} disabled={loading}>
                                            <RotateCw className="mr-2 h-4 w-4" />Wyczyść
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
                                            {loading && Array.from({ length: 3 }).map((_, i) => (
                                                <tr key={`s-${i}`} className="border-t"><td className="px-3 py-3" colSpan={6}><Skeleton className="h-4 w-full" /></td></tr>
                                            ))}
                                            {!loading && filtered.map((m, idx) => (
                                                <tr key={m.id} className="border-t odd:bg-muted/40 hover:bg-muted/60">
                                                    <td className="px-3 py-2 font-semibold">{idx + 1}</td>
                                                    <td className="px-3 py-2">{m.fullName}</td>
                                                    <td className="px-3 py-2">{m.number}</td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            {m.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2"><Badge variant={m.status === 'ACTIVE' ? 'default' : 'secondary'}>{m.status}</Badge></td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => navigate(`/member/${m.id}`)}>
                                                                <Eye className="mr-2 h-4 w-4" />Podgląd
                                                            </Button>
                                                            {m.status === 'WAITING' && (
                                                                <>
                                                                    <Button size="sm" variant="default" onClick={() => approveMember(m.id)}><UserCheck className="mr-2 h-4 w-4" />Zatwierdź</Button>
                                                                    <Button size="sm" variant="destructive" onClick={() => rejectMember(m.id)}><UserX className="mr-2 h-4 w-4" />Odrzuć</Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!loading && filtered.length === 0 && (
                                                <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Brak wyników</td></tr>
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
                                        <Input value={teamForm.name} onChange={(e) => setTeamForm((t) => ({ ...t, name: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Miasto</label>
                                        <Input value={teamForm.city} onChange={(e) => setTeamForm((t) => ({ ...t, city: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Kod dołączenia</label>
                                        <Input value={teamForm.code} onChange={(e) => setTeamForm((t) => ({ ...t, code: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Rok założenia</label>
                                        <Input type="number" value={teamForm.founded} onChange={(e) => setTeamForm((t) => ({ ...t, founded: Number(e.target.value || 0) }))} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" onClick={handleSaveTeam}>
                                        <Wrench className="mr-2 h-4 w-4" />Zapisz zmiany (mock)
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleResetTeam}>
                                        Usuń zespół (mock)
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}

export default TeamManagementPage
