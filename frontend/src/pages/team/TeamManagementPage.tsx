import React, { useEffect, useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    addMemberManually,
    TEAM_ROLES,
    removeTeamMember,
    getMyProfile,
    createTeam,
    getTeamDetails,
    updateTeam,
    getTeamMembers,
    getTeamMember,
    removeTeam,
    getMemberProfile,
    type TeamDetails,
    type MemberProfile
} from '@/lib/userApi.ts'
import { getUserRoles, hasRole } from '@/lib/auth.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import {
    Eye,
    Wrench,
    Search as SearchIcon,
    RotateCw,
    Calendar,
    UserMinus,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Edit3,
    User as UserIcon
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { useNavigate } from 'react-router-dom'
import TeamSearchModal from '@/components/TeamSearchModal.tsx'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog.tsx'
import { cn } from '@/lib/utils.ts'

// --- SCHEMAS ---

const addMemberSchema = z.object({
    teamId: z.coerce.number().min(1, 'Podaj poprawne ID zespołu'),
    memberId: z.coerce.number().min(1, 'Podaj poprawne ID członka'),
    role: z.string().optional(),
})

const removeMemberSchema = z.object({
    teamMemberId: z.coerce.number().min(1, 'Podaj poprawne ID członka zespołu (TeamMemberID)'),
})

type AddMemberValues = z.infer<typeof addMemberSchema>
type RemoveMemberValues = z.infer<typeof removeMemberSchema>

const createSchema = z.object({
    category: z.enum(['academy', 'junior', 'senior', 'u19', 'u17'] as const),
    code: z.string().min(10, 'Kod zespołu musi mieć 10–16 znaków').max(16, 'Kod zespołu musi mieć 10–16 znaków'),
    name: z.string().min(1, 'Nazwa zespołu jest wymagana'),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'CREATED'] as const),
    description: z.string().min(50, 'Opis musi mieć co najmniej 50 znaków').max(4095, 'Opis może mieć maksymalnie 4095 znaków'),
})
type CreateFormValues = z.infer<typeof createSchema>

// --- CONSTANTS & HELPERS ---

const TEAM_CATEGORIES = ['academy', 'junior', 'senior', 'u19', 'u17'] as const

const BACKEND_TO_FRONT: Record<string, string> = {
    SENIOR: 'senior', U19: 'u19', U17: 'u17', JUNIOR: 'junior', ACADEMY: 'academy',
}
const FRONT_TO_BACK: Record<string, string> = Object.fromEntries(Object.entries(BACKEND_TO_FRONT).map(([k, v]) => [v, k])) as Record<string, string>

type Member = { id: number; fullName: string; number: number; status: string; roles: string[] }
type TeamForm = { id: number; name: string; code: string; status: string; category: string; description?: string }

function validateTeamForm(form: TeamForm) {
    const errors: Record<string, string> = {}
    if (!form.name || form.name.trim().length < 5 || form.name.trim().length > 128) errors.name = 'Nazwa zespołu musi mieć 5–128 znaków'
    if (!form.code || form.code.trim().length < 6 || form.code.trim().length > 32) errors.code = 'Kod zespołu musi mieć 6–32 znaków'
    if (!form.category || !Object.keys(FRONT_TO_BACK).includes(form.category)) errors.category = 'Wybierz kategorię'
    if (!form.description || form.description.trim().length < 10 || form.description.trim().length > 4095) errors.description = 'Opis musi mieć 10–4095 znaków'
    if (!form.status) errors.status = 'Wybierz status'
    return errors
}

const normalizeRole = (r: any) => {
    if (!r && r !== 0) return ''
    if (typeof r === 'string') return r.toString().toUpperCase()
    if (typeof r === 'number') return String(r).toUpperCase()
    if (typeof r === 'object') {
        if (typeof r.name === 'string') return r.name.toUpperCase()
        if (typeof r.role === 'string') return r.role.toUpperCase()
        if (typeof r.value === 'string') return r.value.toUpperCase()
        try { return JSON.stringify(r).toUpperCase() } catch { return String(r).toUpperCase() }
    }
    return String(r).toUpperCase()
}

const isTeamPlayerRoleString = (roleStr: string) => {
    if (!roleStr) return false
    const s = roleStr.replace(/[^A-Z0-9_]/g, '_')
    return s.includes('TEAM') && s.includes('PLAYER')
}

const normalizeStatus = (raw?: any) => {
    const rawStr = (raw ?? '').toString().toUpperCase()
    if (!rawStr) return 'UNKNOWN'
    if (rawStr.includes('WAIT') || rawStr.includes('PEND')) return 'WAITING'
    if (rawStr === 'ACTIVE' || rawStr === 'MEMBER') return 'ACTIVE'
    if (rawStr.includes('ARCHIV') || rawStr === 'ARCHIVED') return 'ARCHIVED'
    if (rawStr === 'REJECTED') return 'REJECTED'
    return rawStr
}

const normalizeTeamStatus = (raw?: any) => {
    const s = (raw ?? '').toString().toUpperCase()
    if (!s) return 'ACTIVE'
    if (s === 'INACTIVE') return 'SUSPENDED'
    if (['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'CREATED'].includes(s)) return s
    return s
}

// Helper styli dla przycisków "pastylek"
const pillButtonClass = (isActive: boolean, variant: 'default' | 'danger' = 'default') => cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isActive
        ? (variant === 'danger' ? "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90" : "bg-primary text-primary-foreground shadow-md hover:bg-primary/90")
        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
)

// --- COMPONENTS ---

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
                </div>
            )
        }
        return this.props.children ?? null
    }
}

export function TeamManagementPage() {
    const navigate = useNavigate()
    const [tab, setTab] = useState<'manual' | 'members' | 'team' | 'create'>('manual')
    const [memberAllowed, setMemberAllowed] = useState(true)
    const [memberError, setMemberError] = useState<string | null>(null)

    // Manual Action State (Members)
    const [manualSubTab, setManualSubTab] = useState<'ADD' | 'REMOVE'>('ADD')

    // Team Action State (Teams)
    const [teamSubTab, setTeamSubTab] = useState<'EDIT' | 'DELETE'>('EDIT')

    // Add Member State
    const [manualTeamPreview, setManualTeamPreview] = useState<TeamDetails | null>(null)
    const [manualMemberPreview, setManualMemberPreview] = useState<MemberProfile | null>(null)
    const [manualTeamError, setManualTeamError] = useState<string | null>(null)
    const [manualMemberError, setManualMemberError] = useState<string | null>(null)

    // Remove Member State
    const [removeTeamMemberPreview, setRemoveTeamMemberPreview] = useState<any | null>(null)
    const [removeTeamMemberError, setRemoveTeamMemberError] = useState<string | null>(null)

    const [isExecutingManual, setIsExecutingManual] = useState(false)

    // Members Tab State
    const [members, setMembers] = useState<Member[]>([])
    const [query, setQuery] = useState('')
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'WAITING' | 'ARCHIVED'>('ALL')

    // Team Update State
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
    const [loadingDescription, setLoadingDescription] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [teamForm, setTeamForm] = useState<TeamForm>({
        id: 0, name: '', code: '', status: 'ACTIVE', category: 'academy', description: ''
    })
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Create Team State
    const [creating, setCreating] = useState(false)

    // --- FORMS ---

    const addMemberForm = useForm<AddMemberValues>({
        mode: 'onSubmit',
        resolver: zodResolver(addMemberSchema) as any,
        defaultValues: { teamId: 0, memberId: 0, role: undefined },
    })

    const removeMemberForm = useForm<RemoveMemberValues>({
        mode: 'onSubmit',
        resolver: zodResolver(removeMemberSchema) as any,
        defaultValues: { teamMemberId: 0 },
    })

    const createFormHook = useForm<CreateFormValues>({
        resolver: zodResolver(createSchema),
        mode: 'onChange',
        defaultValues: { category: 'academy', code: '', name: '', status: 'ACTIVE', description: '' },
    })

    // --- INITIALIZATION ---
    useEffect(() => {
        const prev = document.title
        document.title = 'Zarządzanie zespołem'
        let mounted = true

        const checkAccess = async () => {
            try {
                if (hasRole('ADMIN') || getUserRoles().some(r => r.toUpperCase().includes('COACH'))) {
                    if (mounted) { setMemberAllowed(true); setMemberError(null); }
                    return;
                }
                await getMyProfile({ allowUnauth: true })
                if (mounted) { setMemberAllowed(true); setMemberError(null); }
            } catch (err: any) {
                if (!mounted) return
                setMemberAllowed(false)
                setMemberError(err?.message || 'Brak dostępu — wymagana rola członka')
            }
        }
        checkAccess()
        return () => { mounted = false; document.title = prev }
    }, [])

    // --- LOGIC: MANUAL ADD ACTION ---
    const handleManualTeamBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!val || isNaN(val)) {
            setManualTeamPreview(null); setManualTeamError(null); return
        }
        try {
            const data = await getTeamDetails(val, { forceReal: true, allowUnauth: true })
            setManualTeamPreview(data); setManualTeamError(null)
        } catch (err: any) {
            setManualTeamPreview(null); setManualTeamError('Nie znaleziono zespołu o podanym ID.')
        }
    }

    const handleManualMemberBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!val || isNaN(val)) {
            setManualMemberPreview(null); setManualMemberError(null); return
        }
        try {
            const data = await getMemberProfile(val, { allowUnauth: true })
            if (!data || !data.firstName) throw new Error('Not found')
            setManualMemberPreview(data);
            setManualMemberError(null)
        } catch (err: any) {
            setManualMemberPreview(null); setManualMemberError('Nie znaleziono członka o podanym ID.')
        }
    }

    const onAddMemberSubmit: SubmitHandler<AddMemberValues> = async (values) => {
        if (manualTeamError || manualMemberError || !manualTeamPreview || !manualMemberPreview) {
            toast.error('Popraw błędy formularza przed wysłaniem.'); return
        }
        setIsExecutingManual(true)
        try {
            // FIX: Pobieramy ID z zapisanego stanu manualMemberPreview (dane z API)
            const targetMemberId = manualMemberPreview.id ?? (manualMemberPreview as any).userId ?? values.memberId;

            await addMemberManually(values.teamId, {
                memberId: targetMemberId,
                initialRoles: values.role ? [values.role] : undefined
            })
            toast.success(`Pomyślnie dodano ${manualMemberPreview.firstName} ${manualMemberPreview.lastName} do zespołu.`)
            addMemberForm.reset()
            setManualTeamPreview(null); setManualMemberPreview(null)
        } catch (err: any) {
            toast.error(err?.message || 'Wystąpił nieoczekiwany błąd.')
        } finally {
            setIsExecutingManual(false)
        }
    }

    // --- LOGIC: MANUAL REMOVE ACTION ---

    const handleManualRemoveBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!val || isNaN(val)) {
            setRemoveTeamMemberPreview(null); setRemoveTeamMemberError(null); return
        }
        try {
            const data = await getTeamMember(val)
            if (!data) throw new Error('Not found')
            setRemoveTeamMemberPreview(data)
            setRemoveTeamMemberError(null)
        } catch (err: any) {
            setRemoveTeamMemberPreview(null)
            setRemoveTeamMemberError('Nie znaleziono członka zespołu o tym ID.')
        }
    }

    const onRemoveMemberSubmit: SubmitHandler<RemoveMemberValues> = async () => {
        if (!removeTeamMemberPreview || !removeTeamMemberPreview.teamMemberId) {
            toast.error('Najpierw wprowadź poprawne ID i poczekaj na podgląd.')
            return
        }

        const idToDelete = removeTeamMemberPreview.teamMemberId
        setIsExecutingManual(true)

        try {
            await removeTeamMember(idToDelete)
            toast.success(`Pomyślnie usunięto członka: ${removeTeamMemberPreview.firstName} ${removeTeamMemberPreview.lastName}`)
            removeMemberForm.reset()
            setRemoveTeamMemberPreview(null)
        } catch(e: any) {
            toast.error(e?.message || 'Błąd usuwania członka')
        } finally {
            setIsExecutingManual(false)
        }
    }

    // --- LOGIC: MEMBERS TAB ---
    const filteredMembers = useMemo(() => members
        .filter((m) => {
            if (statusFilter === 'ALL') return true
            const s = (m.status || '').toString().toUpperCase()
            const rolesNormalized = (m.roles || []).map((r: any) => normalizeRole(r))
            if (rolesNormalized.some(isTeamPlayerRoleString)) return true
            return s === statusFilter
        })
        .filter((m) => m.fullName.toLowerCase().includes(query.toLowerCase())), [members, query, statusFilter])

    const fetchMembersData = async (status?: string) => {
        setLoadingMembers(true)
        try {
            if (selectedTeamId) {
                const details = await getTeamDetails(selectedTeamId, { forceReal: true, allowUnauth: true })
                const rawList: any[] = (details && (details as any).members) ? (details as any).members : []
                const mapped = rawList.map((it: any) => ({
                    id: it.teamMemberId ?? it.memberId ?? 0,
                    fullName: (`${it.firstName ?? ''} ${it.lastName ?? ''}`).trim() || (it.fullName ?? '—'),
                    number: it.number ?? it.playerNumber ?? 0,
                    status: normalizeStatus(it.status ?? ''),
                    roles: Array.isArray(it.roles) ? it.roles.map((r: any) => String(r)) : []
                }))
                setMembers(mapped)
            } else {
                const res = await getTeamMembers(status && status !== 'ALL' ? status : undefined, undefined, undefined, { allowUnauth: true })
                const items = res.items ?? []
                const mapped = items.map((it: any) => {
                    const person = it.member ?? it.user ?? it
                    const id = it.teamMemberId ?? it.memberId ?? person.id ?? 0
                    const fullName = (`${person.firstName ?? ''} ${person.lastName ?? ''}`).trim() || (person.fullName ?? '—')
                    const rawStatus = normalizeStatus(it.status ?? person.status ?? '')
                    const roles = Array.isArray(it.roles) ? it.roles.map((r: any) => String(r)) : []
                    return { id, fullName, number: 0, status: rawStatus, roles }
                })
                setMembers(mapped)
            }
        } catch (err: any) {
            toast.error('Nie udało się pobrać członków', { description: err?.message })
            setMembers([])
        } finally {
            setLoadingMembers(false)
        }
    }

    const handleSearch = () => {
        fetchMembersData(statusFilter === 'ALL' ? undefined : statusFilter)
    }

    // --- LOGIC: TEAM ACTIONS ---
    const handleSaveTeam = async () => {
        if (!teamForm.id) return toast.error('Brak wybranego zespołu')
        const errs = validateTeamForm(teamForm)
        setValidationErrors(errs)
        if (Object.keys(errs).length > 0) return

        try {
            const backendCategory = FRONT_TO_BACK[teamForm.category] ?? undefined
            await updateTeam({ ...teamForm, category: backendCategory })
            toast.success('Zapisano zespół')
        } catch (err: any) {
            toast.error(err?.message || 'Nie udało się zapisać zespołu')
        }
    }

    const handleDeleteTeam = async () => {
        if (!teamForm.id) return
        setIsDeleting(true)
        try {
            await removeTeam(teamForm.id)
            toast.success('Zespół został usunięty')
            setIsDeleteDialogOpen(false)
            setTeamForm({ id: 0, name: '', code: '', status: 'ACTIVE', category: 'academy', description: '' })
            setSelectedTeamId(null)
        } catch (error: any) {
            toast.error(error.message || 'Błąd usuwania')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCreateTeam = async (values: CreateFormValues) => {
        setCreating(true)
        try {
            const mappedCategory = FRONT_TO_BACK[values.category] ?? values.category.toUpperCase()
            await createTeam({ ...values, category: mappedCategory })
            toast.success('Utworzono zespół')
            createFormHook.reset()
            setTab('team')
        } catch (err: any) {
            toast.error(err?.message || 'Nie udało się utworzyć zespołu')
        } finally {
            setCreating(false)
        }
    }

    // Effect for updating team details form
    useEffect(() => {
        if (!selectedTeamId) return
        let mounted = true
        ;(async () => {
            setLoadingDescription(true)
            try {
                const details = await getTeamDetails(selectedTeamId, { forceReal: true, allowUnauth: true })
                if (!mounted) return
                setTeamForm({
                    id: details.id ?? selectedTeamId,
                    name: details.name ?? '',
                    code: (details as any).code ?? '',
                    status: normalizeTeamStatus((details as any).status),
                    category: BACKEND_TO_FRONT[(details as any).category ?? ''] ?? 'academy',
                    description: (details as any).description ?? '',
                })
            } catch (err) { console.error(err) }
            finally { if (mounted) setLoadingDescription(false) }
        })()
        return () => { mounted = false }
    }, [selectedTeamId])

    // Effect for members fetch
    useEffect(() => {
        if (tab === 'members') fetchMembersData(statusFilter === 'ALL' ? undefined : statusFilter)
    }, [tab, statusFilter, selectedTeamId])


    // --- RENDER ---

    return (
        <div className="min-h-screen bg-background">
            {/*<header className="border-b bg-card">*/}
            {/*    <div className="container flex h-16 items-center justify-between px-4">*/}
            {/*        <div className="flex items-center gap-3">*/}
            {/*            <img src="/favicon.png" alt="Logo" className="h-8 w-8 object-contain" />*/}
            {/*            <h1 className="text-2xl font-bold">Zarządzanie zespołem</h1>*/}
            {/*        </div>*/}
            {/*        <div className="flex items-center gap-8">*/}
            {/*            <Button*/}
            {/*                size="lg"*/}
            {/*                className="group shrink-0 px-8 min-w-[190px] relative"*/}
            {/*                onClick={() => navigate('/matches-management')}*/}
            {/*            >*/}
            {/*                <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" />*/}
            {/*                <span className="w-full flex justify-center items-center leading-tight transition-transform duration-150 group-hover:translate-x-4">*/}
            {/*                    Zarządzaj meczami*/}
            {/*                </span>*/}
            {/*            </Button>*/}
            {/*            <Button variant="outline" onClick={() => navigate('/dashboard')}>Wróć do panelu</Button>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</header>*/}

            <header className="border-b bg-card bg-[#0f172a]">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-lg bg-white p-1 border shadow-sm">
                        <img
                            src="/favicon.png"
                            alt="Club Logo"
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Centrum Meczowe</h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">Zarządzanie rozgrywkami</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                                <Button
                                    size="lg"
                                    className="group shrink-0 px-8 min-w-[190px] relative"
                                    onClick={() => navigate('/matches-management')}
                                >
                                    <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" />
                                    <span className="w-full flex justify-center items-center leading-tight transition-transform duration-150 group-hover:translate-x-4">
                                        Zarządzaj meczami
                                    </span>
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/dashboard')}>Wróć do panelu</Button>
                            </div>
            </div>
                </header>
            <main className="container py-8 space-y-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                {!memberAllowed && (
                    <div className="rounded-md border border-amber-500 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
                        {memberError}. Zostań zatwierdzonym członkiem, aby zarządzać zespołem.
                    </div>
                )}

                <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-8">
                    {/* Centered, Pill-shaped Tabs Main Menu */}
                    <div className="flex justify-center w-full">
                        <TabsList className="inline-flex h-auto w-auto items-center justify-center rounded-full bg-muted/30 p-1.5 shadow-sm">
                            {[
                                { val: 'manual', label: 'Ręczne akcje', icon: Wrench },
                                { val: 'members', label: 'Lista członków', icon: Eye },
                                { val: 'team', label: 'Zarządzaj zespołem', icon: RotateCw },
                                { val: 'create', label: 'Nowy zespół', icon: UserPlus },
                            ].map((item) => (
                                <TabsTrigger
                                    key={item.val}
                                    value={item.val}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:text-foreground"
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* MANUAL ACTION TAB */}
                    <TabsContent value="manual">
                        <div className="flex justify-center">
                            <Card className="w-full max-w-2xl border-none shadow-lg bg-slate-50 dark:bg-slate-900/50">
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-xl">Zarządzanie ręczne członkami</CardTitle>
                                    <CardDescription>
                                        Wybierz operację, aby dodać lub usunąć członka zespołu.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Sub-menu (Pills) with distinct active/hover state */}
                                    <div className="flex justify-center pb-4">
                                        <div className="inline-flex gap-2 p-1">
                                            <button
                                                type="button"
                                                onClick={() => setManualSubTab('ADD')}
                                                className={pillButtonClass(manualSubTab === 'ADD')}
                                            >
                                                <UserPlus className="mr-2 h-4 w-4" /> Dodaj członka
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setManualSubTab('REMOVE')}
                                                className={pillButtonClass(manualSubTab === 'REMOVE', 'danger')}
                                            >
                                                <UserMinus className="mr-2 h-4 w-4" /> Usuń członka
                                            </button>
                                        </div>
                                    </div>

                                    {/* FORM ADD MEMBER */}
                                    {manualSubTab === 'ADD' && (
                                        <Form {...addMemberForm}>
                                            <form onSubmit={addMemberForm.handleSubmit(onAddMemberSubmit)} className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <FormField
                                                        control={addMemberForm.control}
                                                        name="teamId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>ID Zespołu</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="np. 123"
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                                        onBlur={(e) => { field.onBlur(); handleManualTeamBlur(e); }}
                                                                        className="bg-background"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {manualTeamError && (
                                                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                                            <AlertCircle className="h-4 w-4" /> {manualTeamError}
                                                        </div>
                                                    )}
                                                    {manualTeamPreview && (
                                                        <div className="flex items-center gap-3 rounded-md border bg-background p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                                <RotateCw className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{manualTeamPreview.name}</p>
                                                                <p className="text-xs text-muted-foreground">Kategoria: {manualTeamPreview.category} | Członków: {manualTeamPreview.members?.length || 0}</p>
                                                            </div>
                                                            <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <FormField
                                                        control={addMemberForm.control}
                                                        name="memberId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>ID Członka (User ID)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="np. 456"
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                                        onBlur={(e) => { field.onBlur(); handleManualMemberBlur(e); }}
                                                                        className="bg-background"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {manualMemberError && (
                                                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                                            <AlertCircle className="h-4 w-4" /> {manualMemberError}
                                                        </div>
                                                    )}
                                                    {manualMemberPreview && (
                                                        <div className="flex items-center gap-3 rounded-md border bg-background p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                                <SearchIcon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{manualMemberPreview.firstName} {manualMemberPreview.lastName}</p>
                                                                <p className="text-xs text-muted-foreground">Wiek: {manualMemberPreview.age ?? '?'} lat</p>
                                                            </div>
                                                            <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>

                                                <FormField
                                                    control={addMemberForm.control}
                                                    name="role"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Rola startowa (opcjonalnie)</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-background">
                                                                        <SelectValue placeholder="Wybierz rolę" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="z-[9999]">
                                                                    {TEAM_ROLES.map((role) => (
                                                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <Button
                                                    type="submit"
                                                    className="w-full"
                                                    disabled={isExecutingManual || !!manualTeamError || !!manualMemberError || !manualTeamPreview || !manualMemberPreview}
                                                >
                                                    {isExecutingManual ? 'Przetwarzanie...' : 'Dodaj do zespołu'}
                                                </Button>
                                            </form>
                                        </Form>
                                    )}

                                    {/* FORM REMOVE MEMBER */}
                                    {manualSubTab === 'REMOVE' && (
                                        <Form {...removeMemberForm}>
                                            <form onSubmit={removeMemberForm.handleSubmit(onRemoveMemberSubmit)} className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                                <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground mb-4 border border-dashed border-muted-foreground/25">
                                                    Wprowadź <strong>TeamMemberID</strong>, aby załadować podgląd i usunąć członka.
                                                </div>

                                                <div className="space-y-2">
                                                    <FormField
                                                        control={removeMemberForm.control}
                                                        name="teamMemberId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>ID Członka Zespołu (TeamMemberID)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="np. 999"
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                                        onBlur={(e) => { field.onBlur(); handleManualRemoveBlur(e); }}
                                                                        className="bg-background"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Preview for Removal */}
                                                    {removeTeamMemberError && (
                                                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                                            <AlertCircle className="h-4 w-4" /> {removeTeamMemberError}
                                                        </div>
                                                    )}

                                                    {removeTeamMemberPreview && (
                                                        <div className="flex items-center gap-3 rounded-md border bg-destructive/5 p-3 shadow-sm animate-in fade-in slide-in-from-top-2 border-l-4 border-l-destructive">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                                                <UserIcon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{removeTeamMemberPreview.firstName} {removeTeamMemberPreview.lastName}</p>
                                                                <p className="text-xs text-muted-foreground">ID Relacji: {removeTeamMemberPreview.teamMemberId}</p>
                                                            </div>
                                                            <div className="ml-auto text-xs text-destructive font-medium">Do usunięcia</div>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    type="submit"
                                                    variant="destructive"
                                                    className="w-full"
                                                    disabled={isExecutingManual || !removeTeamMemberPreview}
                                                >
                                                    {isExecutingManual ? 'Przetwarzanie...' : 'Potwierdź usunięcie'}
                                                </Button>
                                            </form>
                                        </Form>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* MEMBERS LIST TAB */}
                    <TabsContent value="members">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Członkowie i aplikacje</CardTitle>
                                <CardDescription>Zatwierdzanie/odrzucanie i podgląd profilu.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-[220px] space-y-1">
                                        <label className="text-sm font-medium">Szukaj</label>
                                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="np. Jan" />
                                    </div>
                                    <div className="w-56">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Wszystkie" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[9999]">
                                                <SelectItem value='ALL'>Wszystkie</SelectItem>
                                                <SelectItem value='ACTIVE'>Aktywni</SelectItem>
                                                <SelectItem value='WAITING'>Oczekujące</SelectItem>
                                                <SelectItem value='ARCHIVED'>Zarchiwizowane</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleSearch()} disabled={loadingMembers}>
                                            <SearchIcon className="mr-2 h-4 w-4" />Szukaj
                                        </Button>
                                        <Button variant="outline" onClick={() => { setQuery(''); handleSearch() }} disabled={loadingMembers}>
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
                                        {loadingMembers && Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={`s-${i}`} className="border-t"><td className="px-3 py-3" colSpan={6}><Skeleton className="h-4 w-full" /></td></tr>
                                        ))}
                                        {!loadingMembers && filteredMembers.map((m, idx) => (
                                            <tr key={m.id} className="border-t odd:bg-muted/40 hover:bg-muted/60 transition-colors">
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
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loadingMembers && filteredMembers.length === 0 && (
                                            <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Brak wyników</td></tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TEAM TAB (UPDATE/DELETE) */}
                    <TabsContent value="team">
                        <div className="flex justify-center">
                            <Card className="w-full max-w-2xl border-none shadow-lg bg-slate-50 dark:bg-slate-900/50">
                                <CardHeader className="text-center pb-2">
                                    <CardTitle>Zarządzaj zespołem</CardTitle>
                                    <CardDescription>Edytuj dane zespołu lub usuń zespół całkowicie.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Sub-menu (Pills) for Team */}
                                    <div className="flex justify-center pb-2">
                                        <div className="inline-flex gap-2 p-1">
                                            <button
                                                type="button"
                                                onClick={() => setTeamSubTab('EDIT')}
                                                className={pillButtonClass(teamSubTab === 'EDIT')}
                                            >
                                                <Edit3 className="mr-2 h-4 w-4" /> Edytuj dane
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTeamSubTab('DELETE')}
                                                className={pillButtonClass(teamSubTab === 'DELETE', 'danger')}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Usuń zespół
                                            </button>
                                        </div>
                                    </div>

                                    {/* Common Team Selection */}
                                    <div className="flex flex-col items-center gap-2 border-b pb-4">
                                        <div className="flex gap-2 items-center w-full justify-center">
                                            <Button onClick={() => setIsSearchOpen(true)} variant="outline" className="w-full sm:w-auto">
                                                <SearchIcon className="mr-2 h-4 w-4" /> Wybierz zespół
                                            </Button>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {selectedTeamId ? `Wybrano ID: ${selectedTeamId}` : 'Nie wybrano zespołu'}
                                        </div>
                                    </div>
                                    <TeamSearchModal
                                        open={isSearchOpen}
                                        onOpenChange={setIsSearchOpen}
                                        hideArchived={true}
                                        onSelect={(id) => { setIsSearchOpen(false); setSelectedTeamId(id); }}
                                    />

                                    {/* EDIT VIEW */}
                                    {teamSubTab === 'EDIT' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium">Nazwa zespołu</label>
                                                    <Input value={teamForm.name} onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))} />
                                                    {validationErrors.name && <p className="text-xs text-destructive">{validationErrors.name}</p>}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium">Status</label>
                                                    <Select value={teamForm.status} onValueChange={(v) => setTeamForm(prev => ({ ...prev, status: v }))}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent className="z-[9999]">
                                                            <SelectItem value="ACTIVE">Aktywny</SelectItem>
                                                            <SelectItem value="SUSPENDED">Zawieszony</SelectItem>
                                                            <SelectItem value="CREATED">Utworzony</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium">Kod dołączenia</label>
                                                    <Input value={teamForm.code} onChange={(e) => setTeamForm(prev => ({ ...prev, code: e.target.value }))} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium">Kategoria</label>
                                                    <Select value={teamForm.category} onValueChange={(v) => setTeamForm(prev => ({ ...prev, category: v }))}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent className="z-[9999]">
                                                            {TEAM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">Opis</label>
                                                {loadingDescription ? <Skeleton className="h-24 w-full" /> : (
                                                    <Textarea
                                                        rows={4}
                                                        value={teamForm.description}
                                                        onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                                                    />
                                                )}
                                            </div>
                                            <div className="pt-2 text-center">
                                                <Button onClick={handleSaveTeam} className="w-full sm:w-auto"><Wrench className="mr-2 h-4 w-4" />Zapisz zmiany</Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* DELETE VIEW */}
                                    {teamSubTab === 'DELETE' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                                                <h3 className="text-lg font-semibold text-destructive flex items-center mb-2">
                                                    <AlertCircle className="mr-2 h-5 w-5" /> Strefa niebezpieczna
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Usunięcie zespołu jest operacją nieodwracalną. Wszystkie dane powiązane z zespołem
                                                    (w tym historia meczów i przypisania członków) zostaną trwale usunięte.
                                                </p>
                                            </div>

                                            {selectedTeamId ? (
                                                <div className="flex flex-col gap-4 items-center justify-center p-6 border rounded-lg bg-card">
                                                    <div className="text-center">
                                                        <p className="text-lg font-medium">Wybrano do usunięcia:</p>
                                                        <p className="text-2xl font-bold mt-1">{teamForm.name || `ID: ${selectedTeamId}`}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">Kod: {teamForm.code}</p>
                                                    </div>

                                                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="lg" disabled={isDeleting}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Usuń ten zespół
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Potwierdź usunięcie</DialogTitle>
                                                                <DialogDescription>
                                                                    Czy na pewno chcesz usunąć zespół <b>{teamForm.name}</b>? Tej operacji nie można cofnąć.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <DialogClose asChild><Button variant="outline">Anuluj</Button></DialogClose>
                                                                <Button variant="destructive" onClick={handleDeleteTeam} disabled={isDeleting}>Potwierdź usunięcie</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
                                                    <SearchIcon className="h-10 w-10 mb-2 opacity-50" />
                                                    <p>Najpierw wybierz zespół z listy powyżej.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* CREATE TEAM TAB */}
                    <TabsContent value="create">
                        <ErrorBoundary>
                            <div className="flex justify-center">
                                <Card className="w-full max-w-2xl border-none shadow-lg bg-slate-50 dark:bg-slate-900/50">
                                    <CardHeader className="text-center">
                                        <CardTitle>Dodaj nowy zespół</CardTitle>
                                        <CardDescription>Wypełnij formularz, aby utworzyć nową drużynę.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Form {...createFormHook}>
                                            <form className="space-y-4">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <FormField
                                                        control={createFormHook.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Nazwa</FormLabel>
                                                                <FormControl><Input {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={createFormHook.control}
                                                        name="category"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Kategoria</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl><SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger></FormControl>
                                                                    <SelectContent className="z-[9999]">
                                                                        {TEAM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={createFormHook.control}
                                                        name="code"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Kod</FormLabel>
                                                                <FormControl><Input {...field} placeholder="10-16 znaków" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={createFormHook.control}
                                                        name="status"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Status</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                    <SelectContent className="z-[9999]">
                                                                        <SelectItem value="ACTIVE">Aktywny</SelectItem>
                                                                        <SelectItem value="SUSPENDED">Zawieszony</SelectItem>
                                                                        <SelectItem value="CREATED">Utworzony</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <FormField
                                                    control={createFormHook.control}
                                                    name="description"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Opis</FormLabel>
                                                            <FormControl>
                                                                <Textarea {...field} rows={4} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex gap-2">
                                                    <Button type="button" onClick={createFormHook.handleSubmit(handleCreateTeam)} disabled={creating}>
                                                        {creating ? 'Tworzenie...' : 'Utwórz zespół'}
                                                    </Button>
                                                    <Button variant="outline" onClick={() => createFormHook.reset()}>Wyczyść</Button>
                                                </div>
                                            </form>
                                        </Form>
                                    </CardContent>
                                </Card>
                            </div>
                        </ErrorBoundary>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}

export default TeamManagementPage