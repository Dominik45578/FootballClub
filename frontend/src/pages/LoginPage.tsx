import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

import { login as apiLogin, setToken } from '@/lib/auth'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const TEST_EMAIL = 'admin@klub.pl'
    const TEST_PASSWORD = 'haslo123'

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await apiLogin(email, password)
            setLoading(false)

            if (res.success) {
                toast.success('Zalogowano pomyślnie!', {
                    description: res.message || 'Witaj w panelu zarządzania klubem.',
                })
                navigate('/dashboard')
                return
            }

            // backend returned success=false — allow test credentials fallback
            if (email === TEST_EMAIL && password === TEST_PASSWORD) {
                setToken('dev-token')
                toast.success('Zalogowano testowo (fallback)', {
                    description: 'Użyto danych testowych lokalnie.',
                })
                navigate('/dashboard')
                return
            }

            toast.error('Błąd logowania', {
                description: res.message || 'Nieprawidłowy email lub hasło.',
            })
        } catch (err: any) {
            setLoading(false)

            // on network/backend error allow test credentials fallback
            if (email === TEST_EMAIL && password === TEST_PASSWORD) {
                setToken('dev-token')
                toast.success('Zalogowano testowo (offline fallback)', {
                    description: 'Użyto danych testowych lokalnie (bez połączenia z backendem).',
                })
                navigate('/dashboard')
                return
            }

            toast.error('Błąd', {
                description: err?.message || 'Wystąpił nieoczekiwany błąd',
            })
        }
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