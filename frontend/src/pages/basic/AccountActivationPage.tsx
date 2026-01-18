import { useEffect } from 'react';

export function AccountActivationPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Aktywacja konta (panel)'
        return () => { document.title = prev }
    }, [])
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Aktywacja konta</h1>
                    <button className="cursor-pointer">Wyloguj</button>
                </div>
            </header>
            <main className="container py-8">
                <p>Formularz aktywacji konta będzie tutaj.</p>
            </main>
        </div>
    );
}
