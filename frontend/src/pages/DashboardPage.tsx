import { PlayersTable } from '@/components/PlayersTable'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function DashboardPage() {
    const navigate = useNavigate()

    const handleLogout = () => {
        toast.success('Wylogowano pomyślnie')
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold">Panel klubu piłkarskiego</h1>
                    <Button variant="outline" onClick={handleLogout}>
                        Wyloguj się
                    </Button>
                </div>
            </header>
            <main className="container py-8">
                <PlayersTable />
            </main>
        </div>
    )
}