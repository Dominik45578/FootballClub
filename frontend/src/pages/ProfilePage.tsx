import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';
import { useEffect } from 'react';

export function ProfilePage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Profil użytkownika'
        return () => { document.title = prev }
    }, [])
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Wylogowano pomyślnie');
        navigate('/');
    };

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
                    <p className="mt-2">Imię i nazwisko: Jan Kowalski</p>
                    <p className="mt-2">Email: jan.kowalski@example.com</p>
                    <p className="mt-2">Data dołączenia: 2023-01-01</p>
                </section>
            </main>
        </div>
    );
}
