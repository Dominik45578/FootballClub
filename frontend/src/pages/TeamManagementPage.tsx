import React, { useEffect, useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addMemberManually, TEAM_ROLES, approveTeamMember, removeTeamMember, getMyProfile, createTeam, getTeams, getTeamDetails, updateTeam, getTeamMembers, removeTeam } from '@/lib/userApi'
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
import TeamSearchModal from '@/components/TeamSearchModal'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog'

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
type TeamForm = { id: number; name: string; code: string; status: string; category: string; description?: string }

const mockMembers: Member[] = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    fullName: `Kandydat ${i + 1}`,
    number: 20 + i,
    status: i % 3 === 0 ? 'WAITING' : 'ACTIVE',
    roles: i % 2 === 0 ? ['PLAYER'] : ['PLAYER', 'GOALKEEPER'],
}))

const mockTeam: TeamForm = { id: 101, name: 'Mój zespół', code: 'ABC123', status: 'ACTIVE', category: 'senior', description: 'Opis zespołu (mock)' }

// Mapowania kategorii pomiędzy backendem (TeamCategory enum - np. SENIOR, U19) a frontendem (lowercase strings)
const BACKEND_TO_FRONT: Record<string, string> = {
    SENIOR: 'senior',
    U19: 'u19',
    U17: 'u17',
    JUNIOR: 'junior',
    ACADEMY: 'academy',
}
const FRONT_TO_BACK: Record<string, string> = Object.fromEntries(Object.entries(BACKEND_TO_FRONT).map(([k, v]) => [v, k])) as Record<string, string>

// prosta walidacja teamForm, zwraca mapę błędów (pole -> komunikat)
function validateTeamForm(form: TeamForm) {
    const errors: Record<string, string> = {}
    if (!form.name || form.name.trim().length < 5 || form.name.trim().length > 128) errors.name = 'Nazwa zespołu musi mieć 5–128 znaków'
    if (!form.code || form.code.trim().length < 6 || form.code.trim().length > 32) errors.code = 'Kod zespołu musi mieć 6–32 znaków'
    if (!form.category || !Object.keys(FRONT_TO_BACK).includes(form.category)) errors.category = 'Wybierz kategorię'
    if (!form.description || form.description.trim().length < 10 || form.description.trim().length > 4095) errors.description = 'Opis musi mieć 10–4095 znaków'
    if (!form.status) errors.status = 'Wybierz status'
    return errors
}

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
    // Helper do normalizacji pojedynczego wpisu roli na porównywalny, uppercase string
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

    // Wykrywa czy podana znormalizowana rola opisuje 'team player' (np. 'ROLE_TEAM_PLAYER', 'role_team_player', 'Team-Player')
    const isTeamPlayerRoleString = (roleStr: string) => {
        if (!roleStr) return false
        const s = roleStr.replace(/[^A-Z0-9_]/g, '_') // ujednolicenie separatorów
        return s.includes('TEAM') && s.includes('PLAYER')
    }

    // Normalizuje statusy: traktujemy różne warianty 'pending' jako 'WAITING'
    const normalizeStatus = (raw?: any) => {
        const rawStr = (raw ?? '').toString().toUpperCase()
        if (!rawStr) return 'UNKNOWN'
        if (rawStr.includes('WAIT') || rawStr.includes('PEND')) return 'WAITING'
        if (rawStr === 'ACTIVE' || rawStr === 'MEMBER') return 'ACTIVE'
        if (rawStr.includes('ARCHIV') || rawStr === 'ARCHIVED') return 'ARCHIVED'
        if (rawStr === 'REJECTED') return 'REJECTED'
        return rawStr
    }

    // Normalizacja statusu zespołu – mapujemy stare/różne warianty na wartości używane w formularzach
    const normalizeTeamStatus = (raw?: any) => {
        const s = (raw ?? '').toString().toUpperCase()
        if (!s) return 'ACTIVE'
        // some backends may use 'INACTIVE' – map it to 'SUSPENDED' which is accepted by createSchema
        if (s === 'INACTIVE') return 'SUSPENDED'
        // allow known values
        if (['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'CREATED'].includes(s)) return s
        // fallback to raw string uppercased
        return s
    }

    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
    const navigate = useNavigate()
    const [members, setMembers] = useState<Member[]>(mockMembers)
    const [teamForm, setTeamForm] = useState<TeamForm>(mockTeam)
    const [tab, setTab] = useState<'manual' | 'members' | 'team' | 'create'>('manual')
    const [memberAllowed, setMemberAllowed] = useState(true)
    const [memberError, setMemberError] = useState<string | null>(null)
    const [loadingDescription, setLoadingDescription] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'WAITING'>('ALL')
    // create-form validation schema and hook (live validation)
    const createSchema = z.object({
        category: z.enum(['academy', 'junior', 'senior', 'u19', 'u17'] as const),
        code: z.string().min(10, 'Kod zespołu musi mieć 10–16 znaków').max(16, 'Kod zespołu musi mieć 10–16 znaków'),
        name: z.string().min(1, 'Nazwa zespołu jest wymagana'),
        // Nie pozwalamy na wybór ARCHIVED przy tworzeniu zespołu (archiwizacja odbywa się osobnym procesem)
        status: z.enum(['ACTIVE', 'SUSPENDED', 'CREATED'] as const),
        description: z.string().min(50, 'Opis musi mieć co najmniej 50 znaków').max(4095, 'Opis może mieć maksymalnie 4095 znaków'),
    })
    type CreateFormValues = z.infer<typeof createSchema>
    const createFormHook = useForm<CreateFormValues>({
        resolver: zodResolver(createSchema) as any,
        mode: 'onChange',
        defaultValues: { category: 'academy', code: '', name: '', status: 'ACTIVE', description: '' },
    })
    const [creating, setCreating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    const filtered = useMemo(() => members
        .filter((m) => {
            if (statusFilter === 'ALL') return true
            const s = (m.status || '').toString().toUpperCase()
            // zawsze pokazuj ROLE_TEAM_PLAYER (różne formaty) niezależnie od filtra statusu
            const rolesNormalized = (m.roles || []).map((r: any) => normalizeRole(r))
            if (rolesNormalized.some(isTeamPlayerRoleString)) return true
            return s === statusFilter
        })
        .filter((m) => m.fullName.toLowerCase().includes(query.toLowerCase())), [members, query, statusFilter])

    const handleSearch = () => {
        setLoading(true)
        setTimeout(() => setLoading(false), 400)
    }

    const fetchMembers = async (status?: string) => {
        setLoading(true)
        try {
            // Jeśli wybrano konkretny zespół — pobierz jego szczegóły (zawiera pole members)
            if (selectedTeamId) {
                const details = await getTeamDetails(selectedTeamId, { forceReal: true, allowUnauth: true })
                console.debug('[TeamManagementPage] getTeamDetails response', { selectedTeamId, details })
                const rawList: any[] = (details && (details as any).members) ? (details as any).members : []
                const mappedFromDetails: Member[] = rawList.map((it: any) => {
                    const id = it.teamMemberId ?? it.memberId ?? it.id ?? 0
                    const firstName = it.firstName ?? ''
                    const lastName = it.lastName ?? ''
                    const fullName = (`${firstName} ${lastName}`).trim() || (it.fullName ?? '—')
                    const number = it.number ?? it.playerNumber ?? 0
                    const rawStatus = normalizeStatus(it.status ?? it.member?.status ?? '')
                    const roles = Array.isArray(it.roles) ? it.roles.map((r: any) => (typeof r === 'string' ? r : String(r))) : []
                    return { id, fullName, number, status: rawStatus, roles }
                })
                console.debug('[TeamManagementPage] mappedFromDetails', mappedFromDetails)
                setMembers(mappedFromDetails)
                setLoading(false)
                return
            }

            // Najpierw spróbuj użyć centralnego endpointu GET /user/team-management/get (TeamManagementController#getTeamMembers)
            try {
                const res = await getTeamMembers(status && status !== 'ALL' ? status : undefined, undefined, undefined, { allowUnauth: true })
                console.debug('[TeamManagementPage] getTeamMembers response (primary)', res)
                const items = res.items ?? []
                const mappedFromGlobal: Member[] = items.map((it: any) => {
                    const person = it.member ?? it.user ?? it
                    const id = it.teamMemberId ?? it.memberId ?? person.id ?? 0
                    const firstName = it.firstName ?? person.firstName ?? ''
                    const lastName = it.lastName ?? person.lastName ?? ''
                    const fullName = (`${firstName} ${lastName}`).trim() || (person.fullName ?? '—')
                    const number = it.number ?? it.playerNumber ?? person.number ?? person.playerNumber ?? 0
                    const rawStatus = normalizeStatus(it.status ?? person.status ?? it.memberStatus ?? '')
                    // normalize roles: handle arrays, nested person.roles and different naming conventions
                    let roles: string[] = []
                    if (Array.isArray(it.roles)) roles = it.roles.map((r: any) => (typeof r === 'string' ? r : String(r)))
                    else if (Array.isArray(person.roles)) roles = person.roles.map((r: any) => (typeof r === 'string' ? r : String(r)))
                    else if (typeof it.role === 'string') roles = [it.role]
                    else if (typeof person.role === 'string') roles = [person.role]

                    // ensure typical role variants are present in normalized form
                    const normalizedRoles = roles.map((r) => (r || '').toString())
                    return { id, fullName, number, status: rawStatus, roles: normalizedRoles }
                })
                console.debug('[TeamManagementPage] mapped members (primary getTeamMembers)', mappedFromGlobal)
                // scalmy z graczami team_player ze wszystkich zespołów
                await mergeTeamPlayersFromAllTeams(mappedFromGlobal)
                setLoading(false)
                return
            } catch (e: any) {
                // jeśli brak uprawnień (403) lub inny błąd, fallback do pobierania szczegółów per-team
                console.warn('[TeamManagementPage] getTeamMembers failed (will fallback to per-team details)', e)
            }

            // fallback: pobierz wszystkie moje zespoły, potem pobierz szczegóły każdego i połącz członków
            try {
                const teamsRes = await getTeams({ mode: 'MY_TEAMS', page: 0, size: 50 })
                const teams = teamsRes?.items ?? []
                if (Array.isArray(teams) && teams.length > 0) {
                    // równoległe pobranie szczegółów zespołów
                    const promises = teams.map((t: any) => {
                        const id = t.teamId ?? t.id
                        return id ? getTeamDetails(Number(id), { forceReal: true, allowUnauth: true }).catch((e) => {
                            console.warn('[TeamManagementPage] getTeamDetails failed for team', id, e)
                            return null
                        }) : null
                    }).filter(Boolean) as Promise<any>[]

                    const settled = await Promise.all(promises)
                    // wyciągnij wszystkich członków z details.members
                    const allRawMembers: any[] = []
                    for (const d of settled) {
                        if (!d) continue
                        const arr = (d as any).members ?? []
                        if (Array.isArray(arr)) allRawMembers.push(...arr)
                    }

                    // deduplikacja (po teamMemberId, albo memberId+teamId)
                    const seen = new Set<string>()
                    const combined: Member[] = []
                    for (const it of allRawMembers) {
                        const teamMemberId = it.teamMemberId ?? it.memberId ?? it.id
                        const teamId = it.teamId ?? it.teamId ?? null
                        const uniqueKey = teamMemberId ? `tm:${teamMemberId}` : `m:${it.memberId ?? it.id}-${teamId ?? ''}`
                        if (seen.has(uniqueKey)) continue
                        seen.add(uniqueKey)

                        const firstName = it.firstName ?? it.member?.firstName ?? ''
                        const lastName = it.lastName ?? it.member?.lastName ?? ''
                        const fullName = (`${firstName} ${lastName}`).trim() || (it.fullName ?? '—')
                        const number = it.number ?? it.playerNumber ?? it.member?.number ?? 0
                        const rawStatus = normalizeStatus(it.status ?? it.member?.status ?? '')
                        const roles = Array.isArray(it.roles) ? it.roles.map((r: any) => (typeof r === 'string' ? r : String(r))) : (Array.isArray(it.member?.roles) ? it.member.roles.map((r: any) => (typeof r === 'string' ? r : String(r))) : [])

                        // stosuj filtr status jeśli podano, ale jeśli osoba ma rolę team_player (różne warianty), pokaż ją zawsze
                        const rolesNormalized = roles.map((r: any) => normalizeRole(r))
                        const isTeamPlayer = rolesNormalized.some(isTeamPlayerRoleString)
                        if (status && status !== 'ALL' && rawStatus !== status.toString().toUpperCase() && !isTeamPlayer) continue

                        combined.push({ id: teamMemberId ?? 0, fullName, number, status: rawStatus, roles })
                    }
                    console.debug('[TeamManagementPage] combined members from all teams', combined)
                    // scalmy z graczami team_player ze wszystkich zespołów (zabezpieczenie)
                    await mergeTeamPlayersFromAllTeams(combined)
                    setLoading(false)
                    return
                }
            } catch (e) {
                console.warn('[TeamManagementPage] fetching MY_TEAMS or team details failed, falling back', e)
            }

            // Ostateczny fallback: spróbuj GET /user/team-management/get (jeśli powyższe zawiedzie)
            try {
                const res2 = await getTeamMembers(status && status !== 'ALL' ? status : undefined, undefined, undefined, { allowUnauth: true })
                console.debug('[TeamManagementPage] getTeamMembers response (final fallback)', res2)
                const items2 = res2.items ?? []
                const mapped2: Member[] = items2.map((it: any) => {
                    const person = it.member ?? it.user ?? it
                    const id = it.teamMemberId ?? it.memberId ?? person.id ?? 0
                    const firstName = it.firstName ?? person.firstName ?? ''
                    const lastName = it.lastName ?? person.lastName ?? ''
                    const fullName = (`${firstName} ${lastName}`).trim() || (person.fullName ?? '—')
                    const number = it.number ?? it.playerNumber ?? person.number ?? person.playerNumber ?? 0
                    const rawStatus = normalizeStatus(it.status ?? person.status ?? it.memberStatus ?? '')
                    let roles: string[] = []
                    if (Array.isArray(it.roles)) roles = it.roles.map((r: any) => (typeof r === 'string' ? r : String(r)))
                    else if (Array.isArray(person.roles)) roles = person.roles.map((r: any) => (typeof r === 'string' ? r : String(r)))
                    else if (typeof it.role === 'string') roles = [it.role]
                    else if (typeof person.role === 'string') roles = [person.role]
                    return { id, fullName, number, status: rawStatus, roles }
                })
                console.debug('[TeamManagementPage] mapped members (fallback getTeamMembers final)', mapped2)
                await mergeTeamPlayersFromAllTeams(mapped2)
            } catch (e2) {
                console.warn('[TeamManagementPage] final getTeamMembers fallback also failed', e2)
                setMembers([])
            }
        } catch (err: any) {
            toast.error('Nie udało się pobrać członków', { description: err?.message })
            setMembers([])
        } finally {
            setLoading(false)
        }
    }

    const approveMember = async (id: number) => {
        try {
            await approveTeamMember(id)
            toast.success('Zatwierdzono członka')
            // refetch by current filter
            await fetchMembers(statusFilter === 'ALL' ? undefined : statusFilter)
        } catch (err: any) {
            toast.error('Nie udało się zatwierdzić', { description: err?.message })
        }
    }

    const rejectMember = async (id: number) => {
        try {
            await removeTeamMember(id)
            toast.info('Odrzucono/wykluczono członka')
            await fetchMembers(statusFilter === 'ALL' ? undefined : statusFilter)
        } catch (err: any) {
            toast.error('Nie udało się odrzucić', { description: err?.message })
        }
    }

    // Fetch members when tab is active or when status filter or selectedTeamId changes
    useEffect(() => {
        if (tab === 'members') {
            // Jeśli nie mamy wybranycego zespołu, spróbuj pobrać listę moich zespołów i jeśli jest tylko 1, wybierz go automatycznie
            (async () => {
                try {
                    if (!selectedTeamId) {
                        const teamsRes = await getTeams({ mode: 'MY_TEAMS', page: 0, size: 10 })
                        const items = teamsRes?.items ?? []
                        if (items.length === 1) {
                            const found = items[0]
                            const id = found.teamId ?? (found as any).id
                            if (id) {
                                setSelectedTeamId(Number(id))
                                // fetchMembers zostanie wywołane przez useEffect change selectedTeamId
                                return
                            }
                        }
                    }
                } catch (e) {
                    // ignore — fallback to global fetch
                }
                fetchMembers(statusFilter === 'ALL' ? undefined : statusFilter)
            })()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, statusFilter, selectedTeamId])

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // When a team is selected (selectedTeamId changes), fetch its details and populate the form
    useEffect(() => {
        if (!selectedTeamId) return
        let mounted = true
        ;(async () => {
            setLoadingDescription(true)
            // clear description so mock isn't visible while loading
            setTeamForm((prev) => ({ ...prev, description: '' }))
            try {
                const details = await getTeamDetails(selectedTeamId, { forceReal: true, allowUnauth: true })
                if (!mounted) return
                setTeamForm((prev: TeamForm) => ({
                    id: details.id ?? selectedTeamId,
                    name: details.name ?? prev.name,
                    code: (details as any).code ?? prev.code,
                    status: normalizeTeamStatus((details as any).status ?? prev.status),
                    category: BACKEND_TO_FRONT[(details as any).category ?? ''] ?? prev.category,
                    description: (details as any).description ?? '',
                }))
            } catch (err: any) {
                console.warn('Failed to fetch team details for selectedTeamId', selectedTeamId, err)
                if (mounted) {
                    setTeamForm((prev) => ({ ...prev, description: '' }))
                }
                toast.error('Nie udało się pobrać szczegółów zespołu', { description: err?.message })
            } finally {
                if (mounted) setLoadingDescription(false)
            }
        })()
        return () => { mounted = false }
    }, [selectedTeamId])

    const handleSaveTeam = async () => {
        const id = teamForm.id
        if (!id) {
            toast.error('Brak wybranego zespołu do zapisu')
            return
        }
        // walidacja
        const errs = validateTeamForm(teamForm)
        setValidationErrors(errs)
        if (Object.keys(errs).length > 0) return

        try {
            const backendCategory = FRONT_TO_BACK[teamForm.category] ?? undefined
            await updateTeam({id: id, name: teamForm.name, code: teamForm.code, status: teamForm.status, category: backendCategory, description: teamForm.description })
            toast.success('Zapisano zespół', { description: `${teamForm.name || 'Bez nazwy'}` })
            // Odśwież szczegóły
            try {
                const refreshed = await getTeamDetails(id, { forceReal: true, allowUnauth: true })
                setTeamForm((prev) => ({ ...prev, name: refreshed.name ?? prev.name, code: (refreshed as any).code ?? prev.code, category: (refreshed as any).category ?? prev.category, description: (refreshed as any).description ?? prev.description }))
            } catch (_) {
                // ignore refresh failures
            }
        } catch (err: any) {
            toast.error('Nie udało się zapisać zespołu', { description: err?.message })
        }
    }
    const handleResetTeam = async () => {
        // jeśli mamy wybrany zespół — pobierz jego aktualne dane z backendu
        if (selectedTeamId) {
            try {
                const details = await getTeamDetails(selectedTeamId, { forceReal: true, allowUnauth: true })
                setTeamForm({
                    id: details.id ?? selectedTeamId,
                    name: details.name ?? '',
                    code: (details as any).code ?? '',
                    status: normalizeTeamStatus((details as any).status ?? 'ACTIVE'),
                    category: BACKEND_TO_FRONT[(details as any).category ?? ''] ?? 'academy',
                    description: (details as any).description ?? '',
                })
                setValidationErrors({})
                toast.info('Przywrócono dane z serwera')
                return
            } catch (err: any) {
                toast.error('Nie udało się pobrać danych z serwera', { description: err?.message })
            }
        }
        // fallback
        setTeamForm(mockTeam)
        setSelectedTeamId(mockTeam.id)
        setValidationErrors({})
        toast.info('Przywrócono dane lokalne')
    }

    const handleDeleteTeam = async () => {
        if (!teamForm.id) return

        setIsDeleting(true)
        try {
            await removeTeam(teamForm.id)
            toast.success('Zespół został pomyślnie usunięty')
            setIsDeleteDialogOpen(false)
            // Przekierowanie do listy zespołów lub dashboardu
            navigate('/team-management')
        } catch (error: any) {
            console.error('Failed to delete team:', error)
            const msg = error.message || 'Wystąpił błąd podczas usuwania zespołu.'
            // Obsługa błędów zgodna z resztą aplikacji (toast)
            if (error.status === 403) {
                toast.error('Brak uprawnień', { description: 'Wymagana rola COACH lub ADMIN.' })
            } else if (error.status === 404) {
                toast.error('Nie znaleziono zespołu', { description: 'Zespół mógł zostać już usunięty.' })
            } else {
                toast.error('Błąd usuwania', { description: msg })
            }
        } finally {
            setIsDeleting(false)
        }
    }

    // NOTE: Previously we returned early here when memberAllowed was false which prevented
    // the whole management UI (including 'Członkowie / oczekujące') from rendering.
    // Keep rendering the page (show a notice inside the main area) but allow fetching/listing
    // members so that team members can see their status. This is a frontend-only UX change.

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
                                    <div className="w-56">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Wszystkie" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg">
                                                <SelectItem value='ALL'>Wszystkie</SelectItem>
                                                <SelectItem value='ACTIVE'>Aktywni</SelectItem>
                                                <SelectItem value='WAITING'>Oczekujące</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                <CardDescription>Mock UI: zmiana nazwy, kodu dołączenia.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Button onClick={() => setIsSearchOpen(true)} variant="outline">Wybierz zespół do edycji</Button>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{selectedTeamId ? `Wybrano zespół ID: ${selectedTeamId}` : 'Nie wybrano zespołu'}</div>
                                </div>
                                <TeamSearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} hideArchived={true} onSelect={async (teamId) => {
                                    setIsSearchOpen(false)
                                    try {
                                        const details = await getTeamDetails(teamId, { forceReal: true, allowUnauth: true })
                                        setSelectedTeamId(teamId)
                                        setTeamForm((prev: TeamForm) => ({
                                            id: details.id ?? teamId,
                                            name: details.name ?? prev.name,
                                            code: (details as any).code ?? prev.code,
                                            status: normalizeTeamStatus((details as any).status ?? prev.status),
                                            category: BACKEND_TO_FRONT[(details as any).category ?? ''] ?? prev.category,
                                            description: (details as any).description ?? '',
                                        }))
                                    } catch (err: any) {
                                        toast.error('Nie udało się pobrać szczegółów zespołu', { description: err?.message })
                                        // ensure description is empty on failure
                                        setTeamForm((prev) => ({ ...prev, description: '' }))
                                    }
                                }} />
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
                                                <SelectItem value="SUSPENDED">Zawieszony</SelectItem>
                                                <SelectItem value="CREATED">Utworzony</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Kod dołączenia</label>
                                        <Input value={teamForm.code}
                                               onChange={(e) => setTeamForm((t: TeamForm) => ({...t, code: e.target.value}))}/>
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
                                <div className="sm:col-span-2 mt-2">
                                    <label className="text-sm font-medium">Opis zespołu</label>
                                    {loadingDescription ? (
                                        <div className="w-full rounded-md border border-border shadow-sm p-2 bg-transparent text-sm">
                                            <Skeleton className="h-20 w-full" />
                                        </div>
                                    ) : (
                                        // If server returned empty description, show placeholder so user knows it's missing from backend
                                        <>
                                            {teamForm.description === undefined || teamForm.description === '' ? (
                                                <div className="w-full rounded-md border border-border shadow-sm p-3 text-sm text-muted-foreground">Brak opisu z serwera</div>
                                            ) : (
                                                <textarea value={teamForm.description ?? ''} onChange={(e) => setTeamForm((t) => ({ ...t, description: e.target.value }))} rows={4} className="w-full rounded-md border border-border shadow-sm p-2 bg-transparent text-sm" />
                                            )}
                                        </>
                                    )}
                                    {validationErrors.description && <p className="text-destructive text-sm mt-1">{validationErrors.description}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" onClick={handleSaveTeam} disabled={Object.keys(validateTeamForm(teamForm)).length > 0}>
                                        <Wrench className="mr-2 h-4 w-4"/>Zapisz zmiany
                                    </Button>

                                    <Button type="button" variant="outline" onClick={handleResetTeam}>
                                        <RotateCw className="mr-2 h-4 w-4"/>Przywróć
                                    </Button>

                                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" disabled={isDeleting || !teamForm.id}>
                                                {isDeleting ? 'Usuwanie...' : 'Usuń zespół'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Czy na pewno chcesz usunąć ten zespół?</DialogTitle>
                                                <DialogDescription>
                                                    Ta operacja jest nieodwracalna. Zespół <b>{teamForm.name}</b> zostanie trwale usunięty wraz z historią.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">Anuluj</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeleteTeam}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Usuwanie...' : 'Potwierdź usunięcie'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
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
                                                                        <SelectItem value="SUSPENDED">Zawieszony</SelectItem>
                                                                        <SelectItem value="CREATED">Utworzony</SelectItem>
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
                        status: normalizeTeamStatus((found as any).status ?? values.status),
                        category: BACKEND_TO_FRONT[(found as any).category ?? ''] ?? values.category,
                        description: (found as any).description ?? prev.description,
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

    // Funkcja: pobierz członków z rolą team_player ze wszystkich zespołów i dołącz do aktualnej listy
    async function mergeTeamPlayersFromAllTeams(current: Member[]) {
        try {
            // Pobierz listę wszystkich zespołów (duży rozmiar, można page'ować jeśli potrzeba)
            const allTeamsRes = await getTeams({ mode: 'ALL_TEAMS', page: 0, size: 200 })
            const allTeams = allTeamsRes?.items ?? []
            if (!Array.isArray(allTeams) || allTeams.length === 0) return current

            const teamDetailsPromises = allTeams.map((t: any) => {
                const id = t.teamId ?? t.id
                return id ? getTeamDetails(Number(id), { forceReal: true, allowUnauth: true }).catch((e) => {
                    console.warn('[TeamManagementPage] getTeamDetails failed for ALL_TEAMS team', id, e)
                    return null
                }) : null
            }).filter(Boolean) as Promise<any>[]

            const settled = await Promise.all(teamDetailsPromises)
            const collected: Member[] = []
            for (const d of settled) {
                if (!d) continue
                const arr = (d as any).members ?? []
                if (!Array.isArray(arr)) continue
                for (const it of arr) {
                    // wyciągnij role i sprawdź czy to team player
                    const rawRoles: any[] = Array.isArray(it.roles) ? it.roles : (Array.isArray(it.member?.roles) ? it.member.roles : [])
                    const roles = rawRoles.map((r: any) => typeof r === 'string' ? r : (r && (r.name || r.role || r.value) ? (r.name || r.role || r.value) : String(r)))
                    const rolesNorm = roles.map(normalizeRole)
                    const isTP = rolesNorm.some(isTeamPlayerRoleString)
                    if (!isTP) continue
                    const teamMemberId = it.teamMemberId ?? it.memberId ?? it.id ?? 0
                    const firstName = it.firstName ?? it.member?.firstName ?? ''
                    const lastName = it.lastName ?? it.member?.lastName ?? ''
                    const fullName = (`${firstName} ${lastName}`).trim() || (it.fullName ?? '—')
                    const number = it.number ?? it.playerNumber ?? it.member?.number ?? 0
                    const statusNorm = normalizeStatus(it.status ?? it.member?.status ?? '')
                    collected.push({ id: teamMemberId ?? 0, fullName, number, status: statusNorm, roles })
                }
            }

            // deduplikacja: bierzemy po id (teamMemberId/memberId) i fullName fallback
            const map = new Map<string, Member>()
            // najpierw kopiujemy current
            for (const c of current) {
                const key = `id:${c.id}`
                map.set(key, c)
            }
            for (const p of collected) {
                const key = `id:${p.id}`
                if (!map.has(key)) {
                    map.set(key, p)
                }
            }

            const merged = Array.from(map.values())
            setMembers(merged)
            return merged
        } catch (e) {
            console.warn('[TeamManagementPage] mergeTeamPlayersFromAllTeams failed', e)
            return current
        }
    }
}

export default TeamManagementPage

