import React, { useState, useEffect } from 'react'
import { addMember } from '@/lib/userApi'
import { toast } from 'sonner'
import { UserPlus, Info, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import DateInput from '@/components/DateInput'

export function MemberApplyPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Wniosek o członkostwo'
        return () => { document.title = prev }
    }, [])

    const navigate = useNavigate()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [pesel, setPesel] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [height, setHeight] = useState<number | ''>('')
    const [weight, setWeight] = useState<number | ''>('')
    const [errors, setErrors] = useState<Record<string,string>>({})
    const [submitting, setSubmitting] = useState(false)

    function validate(): boolean {
        const err: Record<string,string> = {}
        if (!firstName || firstName.trim().length < 3) err.firstName = 'Imię musi mieć co najmniej 3 znaki'
        if (!lastName || lastName.trim().length < 3) err.lastName = 'Nazwisko musi mieć co najmniej 3 znaki'
        if (!/^[0-9]{11}$/.test(pesel)) err.pesel = 'PESEL musi składać się z 11 cyfr'
        if (!birthDate) err.birthDate = 'Podaj datę urodzenia'
        else {
            const bd = new Date(birthDate)
            if (Number.isNaN(bd.getTime())) err.birthDate = 'Nieprawidłowa data'
            else {
                const fiveYearsAgo = new Date(); fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
                if (bd > fiveYearsAgo) err.birthDate = 'Musisz mieć co najmniej 5 lat'
            }
        }
        if (height !== '' && (Number(height) < 100 || Number(height) > 250)) err.height = 'Wzrost musi być w przedziale 100-250 cm'
        if (weight !== '' && (Number(weight) < 30 || Number(weight) > 200)) err.weight = 'Waga musi być w przedziale 30-200 kg'
        setErrors(err)
        return Object.keys(err).length === 0
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!validate()) return
        setSubmitting(true)
        try {
            const payload: any = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                pesel: pesel.trim(),
                birthDate: birthDate || null,
            }
            if (phoneNumber) payload.phoneNumber = phoneNumber.trim()
            if (height !== '') payload.height = Number(height)
            if (weight !== '') payload.weight = Number(weight)

            await addMember(payload)
            toast.success('Wniosek wysłany')
            navigate('/dashboard')
        } catch (err: any) {
            // Lepsza obsługa błędów związanych z autoryzacją / przekierowaniem
            console.error('addMember error:', err)
            const status = err?.status
            const location = err?.location || ''
            const rawMessage = err?.message || ''
            // Network/CORS/fetch failure -> status 0
            if (status === 0) {
                const detail = err?.original?.message || err?.responseText || err?.message || ''
                toast.error('Błąd połączenia', { description: `Nie można połączyć się z serwerem — możliwy problem sieciowy lub CORS. ${detail ? `Szczegóły: ${detail}` : 'Sprawdź konsolę (userApi.addMember) i czy backend jest uruchomiony.'}` })
                return
            }
            if ((status >= 300 && status < 400 && location) || status === 401 || status === 403 || (status === 405 && typeof rawMessage === 'string' && rawMessage.includes('/auth')) ) {
                toast.error('Wymagane zalogowanie', { description: 'Aby złożyć wniosek o członkostwo, zaloguj się.' })
                navigate('/login')
            } else {
                const msg = rawMessage || 'Nie udało się wysłać wniosku'
                // pokażemy więcej informacji w toście, by ułatwić debugowanie
                toast.error('Błąd', { description: `(${status ?? '??'}) ${msg}` })
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-start justify-center py-12">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <UserPlus className="h-6 w-6 text-primary-foreground" />
                        <div>
                            <CardTitle>Złóż wniosek o członkostwo</CardTitle>
                            <CardDescription>Uzupełnij swoje dane — trener/administrator oceni wniosek.</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Imię</label>
                                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 block w-full rounded-md border border-border shadow-sm p-2" />
                                {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Nazwisko</label>
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 block w-full rounded-md border border-border shadow-sm p-2" />
                                {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">PESEL</label>
                                <input value={pesel} onChange={(e) => setPesel(e.target.value.replace(/\D/g, ''))} maxLength={11} required className="mt-1 block w-full rounded-md border border-border shadow-sm p-2" />
                                {errors.pesel && <p className="text-xs text-destructive mt-1">{errors.pesel}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Data urodzenia</label>
                                <DateInput
                                    value={birthDate || null}
                                    onChange={(v) => setBirthDate(v ?? '')}
                                    required
                                    id="birthDate"
                                    placeholder="Wybierz datę"
                                    inputClassName="mt-1 block w-full rounded-md border border-border shadow-sm p-2"
                                />
                                {errors.birthDate && <p className="text-xs text-destructive mt-1">{errors.birthDate}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Telefon</label>
                                <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+48123456789" className="mt-1 block w-full rounded-md border border-border shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Wzrost (cm)</label>
                                <input type="number" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))} min={100} max={250} className="mt-1 block w-full rounded-md border border-border shadow-sm p-2" />
                                {errors.height && <p className="text-xs text-destructive mt-1">{errors.height}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Waga (kg)</label>
                                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} min={30} max={200} className="mt-1 block w-full rounded-md border border-border shadow-sm p-2" />
                                {errors.weight && <p className="text-xs text-destructive mt-1">{errors.weight}</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4 text-amber-500"/>Pola oznaczone gwiazdką są wymagane</div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => navigate('/dashboard')}>Anuluj</Button>
                                <Button type="submit" disabled={submitting} className="group px-8 relative ml-2">
                                    <span className="block w-full text-center">
                                        <span className={`inline-block transform transition-transform duration-200 ${submitting ? '' : 'group-hover:-translate-x-2'}`}>
                                            {submitting ? 'Wysyłanie...' : 'Wyślij wniosek'}
                                        </span>
                                    </span>
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
    )
}

export default MemberApplyPage
