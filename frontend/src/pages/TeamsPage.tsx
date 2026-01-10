import { useEffect } from 'react';

export function TeamsPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Drużyny'
        return () => { document.title = prev }
    }, [])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Drużyny</h1>
                </div>
            </header>
            <main className="container py-8">
                <p>Lista drużyn i szczegóły drużyny będą tutaj.</p>
            </main>
        </div>
    );
}
