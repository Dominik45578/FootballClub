import { useEffect } from 'react';

export function ActivateAccountPage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Aktywacja konta'
        return () => { document.title = prev }
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Aktywacja konta</h1>
                <p className="mt-4 text-lg">Sprawdź swoją skrzynkę e-mail i kliknij w link aktywacyjny, aby aktywować konto.</p>
            </div>
        </div>
    );
}

export default ActivateAccountPage;
