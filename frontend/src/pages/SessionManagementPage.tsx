import { useEffect } from 'react';

export function SessionManagementPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Zarządzanie sesją'
        return () => { document.title = prev }
    }, [])
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Zarządzanie sesją</h1>
                </div>
            </header>
            <main className="container py-8">
                <p>Funkcje logowania, odświeżania sesji i wylogowania będą tutaj.</p>
            </main>
        </div>
    );
}
