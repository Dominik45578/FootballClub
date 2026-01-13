import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type MatchItem = {
    id: number
    opponent: string
    date: string
    venue: string
    source: 'external' | 'internal'
    status: string
}

const initialMock: MatchItem[] = [
    { id: 101, opponent: 'FC Placeholder', date: '2024-08-12', venue: 'Stadion Miejski', source: 'external', status: 'Zaplanowany' },
    { id: 102, opponent: 'Real Test', date: '2024-08-20', venue: 'Nasze boisko', source: 'internal', status: 'Zaplanowany' },
]

const STATUS_OPTIONS = ['Zaplanowany', 'W trakcie', 'Odwołany', 'Zakończony'] as const

export function MatchesManagementPage() {
    const navigate = useNavigate()
    const [matches, setMatches] = useState<MatchItem[]>(initialMock)
    const [query, setQuery] = useState('')
    const [editing, setEditing] = useState<MatchItem | null>(null)
    const [isAdding, setIsAdding] = useState(false)

    const emptyForm: Partial<MatchItem> = { opponent: '', date: '', venue: '', source: 'internal', status: 'Zaplanowany' }
    const [form, setForm] = useState<Partial<MatchItem>>(emptyForm)

    useEffect(() => {
        const prev = document.title
        document.title = 'Zarządzanie meczami'
        return () => { document.title = prev }
    }, [])

    const filtered = useMemo(
        () => matches.filter(m => m.opponent.toLowerCase().includes(query.toLowerCase()) || m.venue.toLowerCase().includes(query.toLowerCase())),
        [matches, query]
    )

    const openAdd = () => { setForm(emptyForm); setIsAdding(true); setEditing(null) }
    const openEdit = (m: MatchItem) => { setEditing(m); setForm(m); setIsAdding(false) }

    const save = () => {
        if (!form.opponent || !form.date) { toast.error('Podaj przeciwnika i datę'); return }
        if (!form.status) form.status = 'Zaplanowany'
        if (editing) {
            setMatches(prev => prev.map(p => p.id === editing.id ? { ...(p as MatchItem), ...(form as MatchItem) } : p))
            toast.success('Zaktualizowano mecz (mock)')
        } else {
            const nextId = matches.length ? Math.max(...matches.map(m => m.id)) + 1 : 1
            const newMatch: MatchItem = { id: nextId, opponent: form.opponent!, date: form.date!, venue: form.venue || '—', source: (form.source as any) || 'internal', status: form.status || 'Zaplanowany' }
            setMatches(prev => [newMatch, ...prev])
            toast.success('Dodano mecz (mock)')
        }
        cancelForm()
    }

    const cancelForm = () => { setEditing(null); setIsAdding(false); setForm(emptyForm) }

    const removeMatch = (id: number) => {
        if (!confirm('Usuń mecz?')) return
        setMatches(prev => prev.filter(m => m.id !== id))
        toast.info('Usunięto mecz (mock)')
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Zarządzanie meczami</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/dashboard')}>Wróć</Button>
                        <Button onClick={openAdd}>Dodaj mecz</Button>
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
                            <div className="rounded-lg border bg-card p-4">
                                <h3 className="font-semibold mb-2">{editing ? `Edycja #${editing.id}` : 'Nowy mecz'}</h3>
                                <div className="grid sm:grid-cols-3 gap-2">
                                    <Input placeholder="Przeciwnik" value={form.opponent || ''} onChange={(e) => setForm(f => ({ ...f, opponent: e.target.value }))} />
                                    <Input type="date" value={form.date || ''} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
                                    <Input placeholder="Miejsce" value={form.venue || ''} onChange={(e) => setForm(f => ({ ...f, venue: e.target.value }))} />

                                    <div>
                                        <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Wybierz status" />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="bg-white dark:bg-slate-900 text-foreground border border-border shadow-lg [&_[data-radix-select-viewport]]:bg-white dark:[&_[data-radix-select-viewport]]:bg-slate-900"
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <SelectItem key={s} value={s} className="bg-white dark:bg-slate-900 data-[state=checked]:bg-slate-200 dark:data-[state=checked]:bg-slate-800">
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Input placeholder="Status (alternatywa)" value={form.status || ''} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="hidden" />
                                    <select className="px-3 py-2 rounded border hidden" value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value as any }))}>
                                        <option value="internal">Nasza drużyna</option>
                                        <option value="external">Dane z importu</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button onClick={save}>{editing ? 'Zapisz' : 'Dodaj'}</Button>
                                    <Button variant="outline" onClick={cancelForm}>Anuluj</Button>
                                </div>
                            </div>
                        )}

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
                                        <p className="text-xs text-slate-400">Status: {m.status}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={() => navigate(`/matches/${m.id}`)}>Szczegóły</Button>
                                        <Button variant="default" onClick={() => openEdit(m)}>Edytuj</Button>
                                        <Button variant="destructive" onClick={() => removeMatch(m.id)}>Usuń</Button>
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
