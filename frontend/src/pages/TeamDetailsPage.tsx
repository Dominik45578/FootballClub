import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

const mockTeamDetails = {
    id: 1,
    name: 'Drużyna A',
    code: 'ABC123',
    category: 'Amatorska',
    createdAt: '2023-01-01',
    members: [
        { name: 'Jan Kowalski', role: 'Lider' },
        { name: 'Anna Nowak', role: 'Członek' },
    ],
};

export function TeamDetailsPage() {
    const { teamId } = useParams();

    useEffect(() => {
        const prev = document.title
        document.title = `Szczegóły zespołu ${teamId ?? ''}`
        return () => { document.title = prev }
    }, [teamId])

    // W rzeczywistej aplikacji dane byłyby pobierane na podstawie teamId
    const team = {
        id: mockTeamDetails.id,
        name: mockTeamDetails.name,
        code: mockTeamDetails.code,
        category: mockTeamDetails.category,
        createdAt: mockTeamDetails.createdAt,
        members: mockTeamDetails.members.map(member => ({
            fullName: member.name,
            role: member.role,
        })),
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Szczegóły zespołu</h1>
                </div>
            </header>
            <main className="container py-8">
                <h2 className="text-xl font-bold">{team.name} {teamId ? `(ID: ${teamId})` : ''}</h2>
                <p>Kod zespołu: {team.code}</p>
                <p>Kategoria: {team.category}</p>
                <p>Data utworzenia: {team.createdAt}</p>
                <h3 className="mt-4 text-lg font-bold">Członkowie:</h3>
                <ul>
                    {team.members.map((member, index) => (
                        <li key={index} className="p-2 border-b">
                            {member.fullName} - {member.role}
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}

export default TeamDetailsPage;
