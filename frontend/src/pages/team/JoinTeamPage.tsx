import React, { useState, useEffect } from 'react';
import { joinTeam } from '@/lib/userApi.ts'
import { toast } from 'sonner'
import { Users, ArrowLeft, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card.tsx'

export function JoinTeamPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Dołącz do zespołu'
        return () => { document.title = prev }
    }, [])

    const navigate = useNavigate()
    const [teamCode, setTeamCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function validateCode(code: string) {
        if (!code || code.trim().length === 0) return 'Podaj kod zespołu'
        const len = code.trim().length
        if (len < 6) return 'Kod jest za krótki (min 6 znaków)'
        if (len > 32) return 'Kod jest za długi (max 32 znaki)'
        return null
    }

    const handleJoinTeam = async (event?: React.FormEvent) => {
        event?.preventDefault()
        const v = validateCode(teamCode)
        setError(v)
        if (v) return
        setSubmitting(true)
        try {
            await joinTeam(teamCode)
            toast.success('Wysłano prośbę dołączenia do zespołu')
            navigate('/dashboard')
        } catch (err: any) {
            const msg = err?.message || 'Nie udało się dołączyć do zespołu'
            setError(msg)
            toast.error('Błąd', { description: msg })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-start justify-center py-12">
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary-foreground" />
                        <div>
                            <CardTitle>Dołącz do zespołu</CardTitle>
                            <CardDescription>Wpisz kod zespołu, aby poprosić o dołączenie.</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleJoinTeam} className="space-y-4">
                        <div>
                            <label htmlFor="teamCode" className="block text-sm font-medium text-gray-300">Kod zespołu</label>
                            <input id="teamCode" value={teamCode} onChange={(e) => { setTeamCode(e.target.value); setError(null) }} placeholder="Wpisz kod zespołu" className="mt-1 block w-full rounded-md border border-border shadow-sm p-2" />
                            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Anuluj
                                </Button>
                            </div>

                            <div>
                                <Button type="submit" disabled={submitting} className="group px-8 relative">
                                    <span className="block w-full text-center">
                                        <span className={`inline-block transform transition-transform duration-200 ${submitting ? '' : 'group-hover:-translate-x-2'}`}>
                                            {submitting ? 'Wysyłanie...' : 'Wyślij prośbę'}
                                        </span>
                                    </span>
                                    {/* absolutnie pozycjonowana ikona po prawej; nie wpływa na pozycjonowanie tekstu */}
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-200 pointer-events-none ${submitting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <Send className="h-4 w-4 text-primary-foreground" />
                                    </span>
                                </Button>
                             </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default JoinTeamPage;
