import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '@/lib/userApi'
import type { MemberProfile } from '@/lib/userApi'

export function ProfilePage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Profil użytkownika'
        return () => { document.title = prev }
    }, [])
    const navigate = useNavigate();
    const [profile, setProfile] = useState<MemberProfile | null>(null)
    const [height, setHeight] = useState<string>('')
    const [weight, setWeight] = useState<string>('')
    const [phone, setPhone] = useState<string>('')

    useEffect(() => {
        let mounted = true
        getMyProfile().then(p => {
            if (!mounted) return
            setProfile(p)
            setHeight(p.height ? String(p.height) : '')
            setWeight(p.weight ? String(p.weight) : '')
            setPhone(p.phoneNumber || '')
        }).catch(err => {
            console.error(err)
            toast.error('Nie udało się pobrać profilu (mock)')
        })
        return () => { mounted = false }
    }, [])

    const handleLogout = () => {
        logout();
        toast.success('Wylogowano pomyślnie');
        navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const updated = await updateMyProfile({ height: height ? Number(height) : undefined, weight: weight ? Number(weight) : undefined, phoneNumber: phone || undefined })
            setProfile(updated)
            toast.success('Zaktualizowano profil (mock)')
        } catch (err: any) {
            toast.error('Błąd', { description: err?.message || 'Nie udało się zaktualizować' })
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Profil użytkownika</h1>
                    <Button variant="outline" onClick={handleLogout} className="cursor-pointer">
                        Wyloguj się
                    </Button>
                </div>
            </header>
            <main className="container py-8">
                <section className="p-4 bg-card rounded-lg shadow">
                    <h2 className="text-xl font-semibold">Informacje o koncie</h2>
                    <p className="mt-2">Imię i nazwisko: {profile ? `${profile.firstName} ${profile.lastName}` : '—'}</p>
                    <p className="mt-2">PESEL (maskowany): {profile?.maskedPesel || '—'}</p>
                    <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
                        <label className="text-sm">Wzrost (cm)</label>
                        <input value={height} onChange={(e) => setHeight(e.target.value)} className="p-2 border rounded" />
                        <label className="text-sm">Waga (kg)</label>
                        <input value={weight} onChange={(e) => setWeight(e.target.value)} className="p-2 border rounded" />
                        <label className="text-sm">Numer telefonu</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="p-2 border rounded" />
                        <div className="flex gap-2">
                            <Button type="submit">Zapisz</Button>
                            <Button variant="outline" onClick={handleLogout}>Wyloguj się</Button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
