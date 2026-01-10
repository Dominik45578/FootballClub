import { useEffect } from 'react';

// Zaktualizowano dane profilu użytkownika, aby korzystać z DTO
const mockProfile = {
    id: 1,
    firstName: 'Jan',
    lastName: 'Kowalski',
    maskedPesel: '90********12',
    birthDate: '1990-01-01',
    phoneNumber: '123-456-789',
    height: 180,
    weight: 75,
    age: 36,
};

export function MemberProfilePage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Profil użytkownika'
        return () => { document.title = prev }
    }, [])
    const profile = {
        id: mockProfile.id,
        fullName: `${mockProfile.firstName} ${mockProfile.lastName}`,
        maskedPesel: mockProfile.maskedPesel,
        birthDate: mockProfile.birthDate,
        phoneNumber: mockProfile.phoneNumber,
        height: mockProfile.height,
        weight: mockProfile.weight,
        age: mockProfile.age,
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Profil użytkownika</h1>
                </div>
            </header>
            <main className="container py-8">
                <h2 className="text-xl font-bold">{profile.fullName}</h2>
                <p>PESEL: {profile.maskedPesel}</p>
                <p>Data urodzenia: {profile.birthDate}</p>
                <p>Numer telefonu: {profile.phoneNumber}</p>
                <p>Wzrost: {profile.height} cm</p>
                <p>Waga: {profile.weight} kg</p>
                <p>Wiek: {profile.age} lat</p>
            </main>
        </div>
    );
}
