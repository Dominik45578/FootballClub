import { useState, useEffect } from 'react';

const mockTeams = [
    { teamId: 1, teamName: 'Drużyna A', category: 'Amatorska', numberOfMembers: 10 },
    { teamId: 2, teamName: 'Drużyna B', category: 'Profesjonalna', numberOfMembers: 15 },
];

export function TeamSearchPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Wyszukiwarka zespołów'
        return () => { document.title = prev }
    }, [])
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTeams = mockTeams.map(team => ({
        id: team.teamId,
        name: team.teamName,
        category: team.category,
        membersCount: team.numberOfMembers,
    }));

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Wyszukiwarka zespołów</h1>
                </div>
            </header>
            <main className="container py-8">
                <input
                    type="text"
                    placeholder="Szukaj zespołu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                />
                <ul>
                    {filteredTeams.map(team => (
                        <li key={team.id} className="p-4 border-b">
                            <h2 className="text-lg font-bold">{team.name}</h2>
                            <p>Kategoria: {team.category}</p>
                            <p>Liczba członków: {team.membersCount}</p>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}

export default TeamSearchPage;
