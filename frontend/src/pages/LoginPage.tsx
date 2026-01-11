import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'

import { login as apiLogin, setToken } from '@/lib/auth'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    // set tab title on this page
    useEffect(() => {
        const prev = document.title
        document.title = 'Logowanie'
        return () => { document.title = prev }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await apiLogin(email, password)
            setLoading(false)

            if (res.success) {
                if (res.token) setToken(res.token)
                toast.success('Zalogowano pomyślnie!', {
                    description: res.message || 'Witaj w panelu zarządzania klubem.',
                })
                navigate('/dashboard')
                return
            }

            toast.error('Błąd logowania', {
                description: res.message || 'Nieprawidłowy email lub hasło.',
            })
        } catch (err: any) {
            setLoading(false)
            toast.error('Błąd', {
                description: err?.message || 'Wystąpił nieoczekiwany błąd',
            })
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl shadow-2xl">
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
                                {loading ? <Skeleton className="h-9 w-full rounded-md" /> : (
                                  <Input
                                    id="email"
                                    type="email"
                                    placeholder="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                  />
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Hasło</Label>
                                <div className="relative">
                                  {loading ? <Skeleton className="h-9 w-full rounded-md" /> : (
                                    <>
                                      <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="hasło"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                      />
                                      <button type="button" aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(s => !s)}>
                                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                      </button>
                                    </>
                                  )}
                                </div>
                            </div>
                            <Button className="w-full mt-4" type="submit" disabled={loading}>
                                {loading ? 'Logowanie...' : 'Zaloguj się'}
                            </Button>
                            <button
                              type="button"
                              className="text-sm text-primary hover:underline mt-2"
                              onClick={() => navigate('/reset-password')}
                              disabled={loading}
                            >
                              Zapomniałem hasła
                            </button>
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

export default LoginPage
