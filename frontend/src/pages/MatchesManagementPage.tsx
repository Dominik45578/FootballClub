import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DateInput from '@/components/DateInput'
import ErrorBoundary from '@/components/ErrorBoundary'
import { getToken, authHeader } from '@/lib/auth'
import { canManageMatches, createMatch, updateMatch, deleteMatch, getMyTeamsForSelect, getExternalTeams, getMyMatches, getAllMatches } from '@/lib/matchesApi'
import { ArrowLeft } from 'lucide-react'
const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? '/api').replace(/\/$/, '')

type MatchItem = {
    id: number
    opponent: string
    date: string | null
    venue: string
    source: 'external' | 'internal'
    status: string
    internalTeamId?: number
    externalTeamId?: number
}

const initialMock: MatchItem[] = [
    { id: 101, opponent: 'FC Placeholder', date: '2024-08-12', venue: 'Stadion Miejski', source: 'external', status: 'SCHEDULED' },
    { id: 102, opponent: 'Real Test', date: '2024-08-20', venue: 'Nasze boisko', source: 'internal', status: 'SCHEDULED' },
]

const STATUS_OPTIONS = [
    { value: 'SCHEDULED', label: 'Zaplanowany' },
    { value: 'LIVE', label: 'W trakcie' },
    { value: 'CANCELLED', label: 'Odwołany' },
    { value: 'FINISHED', label: 'Zakończony' },
] as const

export function MatchesManagementPage() {
    const navigate = useNavigate()
    const [matches, setMatches] = useState<MatchItem[]>(initialMock)
    const [query, setQuery] = useState('')
    const [editing, setEditing] = useState<MatchItem | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [myTeamsOptions, setMyTeamsOptions] = useState<Array<{ value: number; label: string }>>([])
    const [externalTeamsOptions, setExternalTeamsOptions] = useState<Array<{ id: number; name: string }>>([])
    const [loadingTeams, setLoadingTeams] = useState(false)
    const [loadingMatches, setLoadingMatches] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [infoMessage, setInfoMessage] = useState<string | null>(null)
    const [lastRequest, setLastRequest] = useState<{ url: string; headers?: Record<string, string | undefined>; status?: number | null; body?: string | null } | null>(null)

    const emptyForm: Partial<MatchItem> = { opponent: '', date: null, venue: '', source: 'internal', status: 'SCHEDULED' }
    const [form, setForm] = useState<Partial<MatchItem>>(emptyForm)
    const [externalTeamName, setExternalTeamName] = useState<string>('')

    // map backend MatchResponse -> local MatchItem (shared helper)
    const mapResponse = (m: any): MatchItem => {
        const isHomeInternal = !!m.homeTeam?.isInternal
        const opponent = isHomeInternal ? (m.awayTeam?.name ?? '—') : (m.homeTeam?.name ?? '—')
        const source = isHomeInternal ? 'internal' : 'external'
        const date = m.matchDate ? m.matchDate.split('T')[0] : null
        const internalTeamId = m.homeTeam?.isInternal ? m.homeTeam.id : (m.awayTeam?.isInternal ? m.awayTeam.id : undefined)
        const externalTeamId = m.homeTeam?.isInternal ? m.awayTeam?.id : (m.awayTeam?.isInternal ? m.homeTeam?.id : undefined)
        return { id: m.matchId, opponent, date, venue: '—', source, status: m.status, internalTeamId, externalTeamId }
    }

    function getStatusLabel(val: string | undefined) {
        if (!val) return ''
        const found = (STATUS_OPTIONS as any).find((s: any) => s.value === val)
        if (found) return found.label
        // maybe already a label
        const foundLabel = (STATUS_OPTIONS as any).find((s: any) => s.label === val)
        if (foundLabel) return foundLabel.label
        return val
    }

    useEffect(() => {
        const prev = document.title
        document.title = 'Zarządzanie meczami'
        return () => { document.title = prev }
    }, [])

    // Pobierz opcje drużyn (moich i zewnętrznych)
    useEffect(() => {
        let mounted = true
        setLoadingTeams(true)
        Promise.all([getMyTeamsForSelect(), getExternalTeams()])
            .then(([my, external]) => {
                if (!mounted) return
                setMyTeamsOptions(my)
                setExternalTeamsOptions(external.map(e => ({ id: e.id, name: e.name })))
            })
            .catch((e) => { console.warn('[matches] failed to load team options', e) })
            .finally(() => { if (mounted) setLoadingTeams(false) })
        return () => { mounted = false }
    }, [])

    // Load matches from API on mount: prefer all matches, fallback to my-matches, then mock
    useEffect(() => {
        let mounted = true
        setLoadingMatches(true)

        // Try all matches first
        getAllMatches(0, 50)
            .then(page => {
                if (!mounted) return
                const mapped = page.content.map(mapResponse)
                if (mapped.length) {
                    setMatches(mapped)
                    setErrorMessage(null)
                    setInfoMessage(null)
                    return
                }
                // if empty, fallthrough to try my-matches
                return Promise.reject({ fallbackToMy: true })
            })
            .catch(async (err) => {
                // if server returned 403 or explicit fallback request, try my-matches
                if (err && (err.status === 403 || String(err).includes('403') || err?.fallbackToMy)) {
                    try {
                        const page = await getMyMatches(0, 50)
                        if (!mounted) return
                        const mapped = page.content.map(mapResponse)
                        if (mapped.length) {
                            setMatches(mapped)
                            setErrorMessage(null)
                            setInfoMessage(null)
                            return
                        }
                    } catch (e2) {
                        console.error('[matches] getMyMatches also failed', e2)
                        const status = (e2 as any)?.status ?? ''
                        setErrorMessage(`getMyMatches failed ${status}: ${String((e2 as any)?.message ?? e2)}`)
                    }
                } else {
                    console.error('[matches] getAllMatches failed', err)
                    const status = (err as any)?.status ?? ''
                    setErrorMessage(`getAllMatches failed ${status}: ${String((err as any)?.message ?? err)}`)
                }
                // As a last resort, try anonymous fetch to /api/match/all (no Authorization header)
                try {
                    const anonUrl = `${API_PREFIX}/match/all?page=0&size=50`
                    const headers = { ...(authHeader() || {}) }
                    setLastRequest({ url: anonUrl, headers })
                    const resp = await fetch(anonUrl, { method: 'GET', credentials: 'include', headers })
                    if (resp.ok) {
                        const data = await resp.json()
                        const mappedAnon = data.content.map(mapResponse)
                        if (mappedAnon.length) {
                            setMatches(mappedAnon)
                            setErrorMessage(null)
                            return
                        }
                    } else {
                        const txt = await resp.text().catch(() => '')
                        console.error('[matches] anonymous fetch returned', resp.status, txt)
                        setLastRequest(prev => ({ url: prev?.url ?? anonUrl, headers: prev?.headers ?? headers, status: resp.status, body: txt }))
                        setErrorMessage(`Anonymous fetch failed ${resp.status}: ${txt || resp.statusText}`)
                    }
                } catch (anonErr) {
                    console.error('[matches] anonymous fetch failed', anonErr)
                    setLastRequest(prev => ({ url: prev?.url ?? (API_PREFIX + '/match/all?page=0&size=50'), headers: prev?.headers ?? (authHeader() || {}), status: null, body: String((anonErr as any)?.message ?? anonErr) }))
                    setErrorMessage(`Anonymous fetch error: ${String((anonErr as any)?.message ?? anonErr)}`)
                }
                // keep existing mock if both fail
            })
            .finally(() => { if (mounted) setLoadingMatches(false) })

        return () => { mounted = false }
    }, [])

    // Ręczne przeładowanie: spróbuj relatywnie, potem pełnym URL-em do gateway (jeśli VITE_GATEWAY_URL ustawione)
    const reloadMatches = async () => {
        setLoadingMatches(true)
        setErrorMessage(null)
        setInfoMessage(null)
        const token = getToken()
        try {
            const all = await getAllMatches(0, 50)
            const mapped = all.content.map(mapResponse)
            if (mapped.length) { setMatches(mapped); setLoadingMatches(false); return }
        } catch (e: any) {
            console.error('[matches.reload] getAllMatches failed', e)
             // jeśli mamy gateway URL spróbuj bezpośrednio
             const gateway = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:12001'
             const apiPrefix = import.meta.env.VITE_API_PREFIX ?? '/api'
             if (gateway && token) {
                const full = `${gateway.replace(/\/$/, '')}${apiPrefix}/match/all?page=0&size=50`
                try {
                    console.info('[matches.reload] trying full gateway URL', full)
                    const headers = { 'Authorization': `Bearer ${token}` }
                    setLastRequest({ url: full, headers })
                    const resp = await fetch(full, { method: 'GET', headers, credentials: 'include' })
                     if (resp.ok) {
                         const data = await resp.json()
                         const mapped = data.content.map(mapResponse)
                         setMatches(mapped)
                         setLoadingMatches(false)
                         setErrorMessage(null)
                         return
                     }
                     const txt = await resp.text().catch(() => '')
                     setLastRequest(prev => ({ url: prev?.url ?? full, headers: prev?.headers ?? headers, status: resp.status, body: txt }))
                     setErrorMessage(`Server returned ${resp.status}: ${txt || resp.statusText}`)
                 } catch (err2) {
                     console.error('[matches.reload] full gateway fetch failed', err2)
                     const status2 = (err2 as any)?.status ?? ''
                     setLastRequest(prev => ({ url: prev?.url ?? full, headers: prev?.headers ?? ( { 'Authorization': `Bearer ${token}` } ), status: status2, body: String((err2 as any)?.message ?? err2) }))
                     setErrorMessage(`Gateway fetch failed ${status2}: ${String((err2 as any)?.message ?? err2)}`)
                 }
             }
            // Try anonymous relative fetch as a last fallback
            try {
                const anonUrl = `${API_PREFIX}/match/all?page=0&size=50`
                const headers = { ...(authHeader() || {}) }
                setLastRequest({ url: anonUrl, headers })
                const respAnon = await fetch(anonUrl, { method: 'GET', credentials: 'include', headers })
                if (respAnon.ok) {
                    const data = await respAnon.json()
                    const mapped = data.content.map(mapResponse)
                    setMatches(mapped)
                    setErrorMessage(null)
                    return
                } else {
                    const txt = await respAnon.text().catch(() => '')
                    console.error('[matches.reload] anonymous fetch returned', respAnon.status, txt)
                    setLastRequest(prev => ({ url: prev?.url ?? anonUrl, headers: prev?.headers ?? headers, status: respAnon.status, body: txt }))
                    setErrorMessage(`Anonymous fetch failed ${respAnon.status}: ${txt || respAnon.statusText}`)
                }
            } catch (anonErr) {
                console.error('[matches.reload] anonymous fetch failed', anonErr)
                setLastRequest(prev => ({ url: prev?.url ?? (API_PREFIX + '/match/all?page=0&size=50'), headers: prev?.headers ?? (authHeader() || {}), status: null, body: String((anonErr as any)?.message ?? anonErr) }))
                setErrorMessage(`Anonymous fetch error: ${String((anonErr as any)?.message ?? anonErr)}`)
            }
         } finally {
             setLoadingMatches(false)
         }
     }

    // Show token helper for debugging in UI
    const showToken = () => {
        const token = getToken()
        const payload = token ? (() => { try { return JSON.stringify(((s: string) => { try { const p = s.split('.')[1]; return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))) } catch { return null } })(token), null, 2) } catch { return null } })() : null
        alert(`Token (short): ${token ? token.slice(0, 30) + '...' : '<brak>'}\nPayload:\n${payload ?? '<brak payload>'}`)
    }

    const filtered = useMemo(
        () => matches.filter(m => m.opponent.toLowerCase().includes(query.toLowerCase()) || m.venue.toLowerCase().includes(query.toLowerCase())),
        [matches, query]
    )

    const openAdd = () => { setForm(emptyForm); setIsAdding(true); setEditing(null) }
    const openEditWithPrefill = (m: MatchItem) => {
        const prefilled: Partial<MatchItem> = { ...m }
        // if m has internalTeamId/externalTeamId (from API mapping), keep them
        setEditing(m)
        setForm(prefilled)
        setIsAdding(false)
    }

    // If user opened 'Add' and teams loaded, prefill internalTeamId
    useEffect(() => {
        if (!isAdding) return
        if (myTeamsOptions.length > 0 && !(form as any).internalTeamId) {
            setForm(f => ({ ...f, internalTeamId: myTeamsOptions[0].value }))
        }
    }, [isAdding, myTeamsOptions])

    // keep externalTeamName in sync with selected id
    useEffect(() => {
        const id = (form as any).externalTeamId
        if (!id) { setExternalTeamName(''); return }
        const found = externalTeamsOptions.find(t => t.id === id)
        if (found) setExternalTeamName(found.name)
    }, [form.externalTeamId, externalTeamsOptions])

    const save = async () => {
        if (!form.opponent || !form.date) { toast.error('Podaj przeciwnika i datę'); return }
        // validate date not in past (compare by YYYY-MM-DD)
        try {
            const input = new Date(form.date!)
            const today = new Date()
            today.setHours(0,0,0,0)
            input.setHours(0,0,0,0)
            if (input < today) { toast.error('Data meczu nie może być w przeszłości'); setSaving(false); return }
        } catch (e) {
            // invalid date
            toast.error('Nieprawidłowa data')
            setSaving(false)
            return
        }
        if (!form.status) form.status = 'SCHEDULED'
        setSaving(true)
        try {
            // Przygotuj payload i wartości pomocnicze
            const myTeams = await getMyTeamsForSelect().catch(() => [])
            const internalTeamId = (form as any).internalTeamId ?? (myTeams[0]?.value ?? null)
            const externalTeamId = (form as any).externalTeamId ?? null

            if (editing) {
                // Local optimistic update
                setMatches(prev => prev.map(p => p.id === editing.id ? { ...(p as MatchItem), ...(form as MatchItem) } : p))
                toast.success('Zaktualizowano mecz (lokalnie)')

                // Wyślij update do backendu (jeśli mamy internalTeamId lub backend istnieje)
                const payload: any = {}
                if (form.date) payload.matchDate = new Date(form.date).toISOString()
                if (form.status) payload.status = form.status // already backend enum value
                if (typeof (form as any).source !== 'undefined') payload.isHome = (form as any).source === 'internal'

                try {
                    await updateMatch(editing.id, payload)
                    toast.success('Zaktualizowano mecz na serwerze')
                } catch (err: any) {
                    if (err?.status === 404) {
                        console.warn('[matches] updateMatch returned 404 — keeping local changes')
                        toast.warning('Backend nie obsługuje jeszcze aktualizacji meczów — zmiany tylko lokalne')
                    } else {
                        console.error(err)
                        toast.error('Błąd aktualizacji na serwerze — zmiany lokalne')
                    }
                }
            } else {
                const nextId = matches.length ? Math.max(...matches.map(m => m.id)) + 1 : 1
                const newMatch: MatchItem = { id: nextId, opponent: form.opponent!, date: form.date!, venue: form.venue || '—', source: (form.source as any) || 'internal', status: form.status || 'SCHEDULED' }
                // Optimistic local add
                setMatches(prev => [newMatch, ...prev])
                toast.success('Dodano mecz (lokalnie)')

                // Spróbuj utworzyć na backendzie jeśli mamy internalTeamId lub externalTeamId
                if (internalTeamId || externalTeamId) {
                    try {
                        const payload: any = {
                            internalTeamId: internalTeamId ?? 0,
                            externalTeamId: externalTeamId ?? 0,
                            matchDate: new Date(form.date!).toISOString(),
                            isHome: (form.source || 'internal') === 'internal'
                        }
                        const created = await createMatch(payload)
                        // Zastąp lokalny element realnym wynikiem (jeśli backend zwrócił dane)
                        setMatches(prev => prev.map(m => m.id === nextId ? ({ id: created.matchId, opponent: created.awayTeam?.name ?? newMatch.opponent, date: created.matchDate.split('T')[0], venue: newMatch.venue, source: created.homeTeam?.isInternal ? 'internal' : 'external', status: created.status }) : m))
                        toast.success('Utworzono mecz na serwerze')
                    } catch (err: any) {
                        if (err?.status === 404) {
                            console.warn('[matches] createMatch returned 404 — fallback to local mock')
                            toast.warning('Backend nie obsługuje jeszcze tworzenia meczów — zmiany tylko lokalne')
                        } else {
                            console.error(err)
                            toast.error('Błąd tworzenia meczu na serwerze — zmiany tylko lokalne')
                        }
                    }
                } else {
                    console.warn('[matches] brak dostępnych teamId; pomijam wywołanie createMatch')
                    toast.info('Mecz dodany lokalnie; aby zapisać na serwerze dodaj drużynę lub skonfiguruj backend')
                }
            }
        } catch (e) {
            console.error(e)
            toast.error('Błąd podczas zapisu meczu')
        } finally {
            setSaving(false)
            cancelForm()
        }
    }

    const cancelForm = () => { setEditing(null); setIsAdding(false); setForm(emptyForm) }

    const removeMatch = async (id: number) => {
        if (!confirm('Usuń mecz?')) return
        // Optimistic remove
        const before = matches
        setMatches(prev => prev.filter(m => m.id !== id))
        setDeletingId(id)
        try {
            await deleteMatch(id)
            toast.info('Usunięto mecz')
        } catch (err: any) {
            if (err?.status === 404) {
                console.warn('[matches] deleteMatch returned 404 — assuming local-only list')
                toast.info('Usunięto mecz lokalnie (backend nieobsługiwany)')
            } else {
                console.error(err)
                // rollback
                setMatches(before)
                toast.error('Błąd usuwania meczu na serwerze; przywracam lokalną listę')
            }
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Zarządzanie meczami</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/team-management')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
                        </Button>
                        <Button onClick={openAdd} disabled={!canManageMatches()}>Dodaj mecz</Button>
                        <Button variant="outline" onClick={reloadMatches}>Przeładuj z serwera</Button>
                    </div>
                </div>
            </header>

            <main className="container py-8 space-y-6 px-4 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Lista meczów</CardTitle>
                                <CardDescription>Dodawaj, edytuj lub usuwaj mecze (mock).</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <Input placeholder="Szukaj po przeciwniku lub miejscu" value={query} onChange={(e) => setQuery(e.target.value)} />
                        </div>

                        { (isAdding || editing) && (
                             <ErrorBoundary>
                             <div className="rounded-lg border bg-card p-4">
                                <h3 className="font-semibold mb-2">{editing ? `Edycja #${editing.id}` : 'Nowy mecz'}</h3>
                                <div className="grid sm:grid-cols-3 gap-2 items-start">
                                    <Input disabled={saving || loadingTeams} placeholder="Przeciwnik" value={form.opponent || ''} onChange={(e) => setForm(f => ({ ...f, opponent: e.target.value }))} />
                                    <DateInput includeTime={false} inputClassName={saving || loadingTeams ? 'opacity-50 pointer-events-none' : ''} value={form.date ?? null} onChange={(v) => setForm(f => ({ ...f, date: v ?? null }))} id="matchDate" placeholder="Wybierz datę" />
                                    <Input disabled={saving || loadingTeams} placeholder="Miejsce" value={form.venue || ''} onChange={(e) => setForm(f => ({ ...f, venue: e.target.value }))} />

                                    <div>
                                        <Select disabled={saving || loadingTeams} value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Wybierz status" />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg [&_[data-radix-select-viewport]]:bg-white dark:[&_[data-radix-select-viewport]]:bg-slate-900"
                                            >
                                                {(STATUS_OPTIONS as any).map((s: any) => (
                                                    <SelectItem key={s.value} value={s.value} className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800">
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* wybór internal/external team (opcjonalne) */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Nasza drużyna</label>
                                        <Select disabled={saving || loadingTeams} value={String((form as any).internalTeamId ?? '')} onValueChange={(v) => setForm(f => ({ ...f, internalTeamId: v && v !== '__none' ? Number(v) : undefined }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={loadingTeams ? 'Ładowanie…' : 'Wybierz drużynę'} />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg">
                                                {myTeamsOptions.length === 0 && <SelectItem value="__none">Brak drużyn</SelectItem>}
                                                {myTeamsOptions.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-muted-foreground">Drużyna z importu</label>
                                        <input
                                            list="external-teams-list"
                                            className="w-full px-3 py-2 text-sm rounded-md border border-border"
                                            placeholder={loadingTeams ? 'Ładowanie…' : 'Wyszukaj drużynę z importu'}
                                            value={externalTeamName}
                                            onChange={(e) => {
                                                const v = e.target.value
                                                setExternalTeamName(v)
                                                const found = externalTeamsOptions.find(t => t.name.toLowerCase() === v.toLowerCase())
                                                if (found) setForm(f => ({ ...f, externalTeamId: found.id }))
                                                else setForm(f => ({ ...f, externalTeamId: undefined }))
                                            }}
                                            disabled={saving || loadingTeams}
                                        />
                                        <datalist id="external-teams-list">
                                            {externalTeamsOptions.map(t => <option key={t.id} value={t.name} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button onClick={save} disabled={saving}>{saving ? 'Trwa zapis...' : (editing ? 'Zapisz' : 'Dodaj')}</Button>
                                    <Button variant="outline" onClick={cancelForm} disabled={saving}>Anuluj</Button>
                                </div>
                            </div>
                            </ErrorBoundary>
                        )}

                        {loadingMatches && <div className="text-sm text-muted-foreground">Ładowanie meczów…</div>}
                        {errorMessage && (
                            <div className="rounded-lg border bg-red-600/10 text-red-600 p-4">
                                <p className="text-sm">{errorMessage}</p>
                                <div className="flex gap-2 mt-2">
                                    <Button variant="outline" onClick={reloadMatches} disabled={loadingMatches}>
                                        {loadingMatches ? 'Trwa przeładowanie...' : 'Spróbuj ponownie'}
                                    </Button>
                                    <Button variant="link" onClick={showToken}>Pokaż token</Button>
                                </div>
                                {lastRequest && (
                                    <div className="mt-3 text-xs text-muted-foreground bg-white/5 p-2 rounded">
                                        <div><strong>Last request:</strong></div>
                                        <div>URL: <code className="break-all">{lastRequest.url}</code></div>
                                        <div>Authorization: {lastRequest.headers?.Authorization ? <span className="font-mono">{String(lastRequest.headers.Authorization).slice(0,40)}...</span> : <em>brak</em>}</div>
                                        <div>Status: {lastRequest.status ?? '—'}</div>
                                        {lastRequest.body && <div className="mt-1">Body: <pre className="whitespace-pre-wrap break-all text-[11px]">{lastRequest.body}</pre></div>}
                                    </div>
                                )}
                            </div>
                        )}
                        {infoMessage && <div className="rounded-lg border bg-green-600/10 text-green-600 p-4 text-sm">{infoMessage}</div>}
                        <div className="space-y-3">
                            {filtered.map(m => (
                                <div key={m.id} className="rounded-lg border bg-slate-900/60 text-slate-100 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                     <div className="space-y-1">
                                         <div className="flex items-center gap-2">
                                             <h3 className="text-lg font-semibold">{m.opponent}</h3>
                                             <Badge variant={m.source === 'external' ? 'secondary' : 'default'}>
                                                 {m.source === 'external' ? 'Dane z importu' : 'Nasza drużyna'}
                                             </Badge>
                                         </div>
                                         <p className="text-sm text-slate-200/80">{m.date} • {m.venue}</p>
                                         <p className="text-xs text-slate-400">Status: {getStatusLabel(m.status)}</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <Button variant="outline" onClick={() => navigate(`/matches/${m.id}`)}>Szczegóły</Button>
                                        <Button variant="default" onClick={() => openEditWithPrefill(m)} disabled={!canManageMatches()}>Edytuj</Button>
                                        <Button variant="destructive" onClick={() => removeMatch(m.id)} disabled={!canManageMatches() || deletingId === m.id}>{deletingId === m.id ? 'Usuwanie...' : 'Usuń'}</Button>
                                     </div>
                                 </div>
                             ))}
                            {filtered.length === 0 && <div className="rounded-lg border bg-card p-4 text-sm">Brak meczów (filtr lub lista pusta).</div>}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

export default MatchesManagementPage
