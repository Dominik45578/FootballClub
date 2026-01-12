import React, { useState, useEffect } from 'react';
import { joinTeam } from '@/lib/userApi'
import { toast } from 'sonner'

export function JoinTeamPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Dołącz do zespołu'
        return () => { document.title = prev }
    }, [])
    const [teamCode, setTeamCode] = useState('');

    // Zaktualizowano obsługę formularza dołączenia do zespołu, aby korzystać z userApi
    const handleJoinTeam = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await joinTeam(teamCode, { allowUnauth: true })
            toast.success('Wysłano prośbę dołączenia do zespołu')
            setTeamCode('')
        } catch (err: any) {
            const msg = err?.message || 'Nie udało się dołączyć'
            if (err?.status === 401 || err?.status === 403) {
                toast.error('Musisz być zatwierdzonym członkiem, aby dołączyć do zespołu.', { description: msg })
            } else {
                toast.error('Błąd', { description: msg })
            }
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Dołącz do zespołu</h1>
                </div>
            </header>
            <main className="container py-8">
                <form onSubmit={handleJoinTeam} className="space-y-4">
                    <div>
                        <label htmlFor="teamCode" className="block text-sm font-medium text-gray-700">
                            Kod zespołu
                        </label>
                        <input
                            type="text"
                            id="teamCode"
                            name="teamCode"
                            value={teamCode}
                            onChange={(e) => setTeamCode(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Dołącz
                    </button>
                </form>
            </main>
        </div>
    );
}

export default JoinTeamPage;
