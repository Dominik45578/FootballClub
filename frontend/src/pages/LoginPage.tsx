import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner' // <-- poprawny import funkcji toast
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Symulacja logowania (później tu będzie fetch do backendu)
        setTimeout(() => {
            setLoading(false)

            if (email === 'admin@klub.pl' && password === 'haslo123') {
                toast.success('Zalogowano pomyślnie!', {
                    description: 'Witaj w panelu zarządzania klubem.',
                })
                navigate('/dashboard')
            } else {
                toast.error('Błąd logowania', {
                    description: 'Nieprawidłowy email lub hasło.',
                })
            }
        }, 1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl text-center font-bold">Logowanie</CardTitle>
                    <CardDescription className="text-center text-base">
                        Panel zarządzania klubem piłkarskim
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <form onSubmit={handleLogin}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Hasło</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="hasło"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <Button className="w-full mt-4" type="submit" disabled={loading}>
                                {loading ? 'Logowanie...' : 'Zaloguj się'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
                    <p>Dane testowe:</p>
                    <p className="font-medium">admin@klub.pl / haslo123</p>
                </CardFooter>
            </Card>
        </div>
    )
}