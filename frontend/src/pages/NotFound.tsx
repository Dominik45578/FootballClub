import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, ChevronLeft, LayoutDashboard, FlagTriangleRight } from 'lucide-react'
import { getToken } from '@/lib/auth'

export function NotFoundPage() {
    const navigate = useNavigate()

    const [canGoBack, setCanGoBack] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        try {
            const token = getToken()
            const hasToken = !!token
            const hasHistory = typeof window !== 'undefined' ? window.history.length > 1 : false

            setCanGoBack(hasToken && hasHistory)
            setIsAuthenticated(hasToken)
        } catch (e) {
            console.warn('Error checking navigation state:', e)
            setCanGoBack(false)
            setIsAuthenticated(false)
        }
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">

            {/* Tło strony: delikatny wzór */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            <Card className="w-full max-w-5xl mx-4 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative z-10">
                <CardContent className="p-0 flex flex-col md:flex-row min-h-[550px]">

                    {/* LEWA STRONA: Wrapper dla odstępu */}
                    {/* Dodano p-3 md:p-4, aby odsunąć zielone tło od krawędzi */}
                    <div className="w-full md:w-5/12 p-3 md:p-4 bg-white dark:bg-slate-900">

                        {/* Właściwe tło boiska z zaokrąglonymi rogami (rounded-3xl) */}
                        <div className="w-full h-full bg-emerald-600 rounded-3xl relative flex items-center justify-center p-8 overflow-hidden group shadow-inner ring-1 ring-emerald-600/20">

                            {/* Ozdobny wzór na trawie */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>

                            {/* Ilustracja taktyczna SVG */}
                            <div className="relative z-10 transform transition-transform duration-700 group-hover:scale-105">
                                <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                                    {/* Tablica */}
                                    <rect width="280" height="200" rx="4" fill="#10B981" />
                                    <rect x="5" y="5" width="270" height="190" rx="2" stroke="white" strokeWidth="2" strokeOpacity="0.8" fill="none"/>
                                    <circle cx="140" cy="100" r="30" stroke="white" strokeWidth="2" strokeOpacity="0.8" />
                                    <path d="M140 5 V195" stroke="white" strokeWidth="2" strokeOpacity="0.8" />

                                    {/* Gracze (X) */}
                                    <text x="40" y="50" fill="white" fontSize="24" fontFamily="sans-serif" fontWeight="bold" opacity="0.9">x</text>
                                    <text x="60" y="80" fill="white" fontSize="24" fontFamily="sans-serif" fontWeight="bold" opacity="0.9">x</text>
                                    <text x="40" y="150" fill="white" fontSize="24" fontFamily="sans-serif" fontWeight="bold" opacity="0.9">x</text>

                                    {/* Strzałka błędu */}
                                    <path d="M70 80 C 100 80, 120 120, 160 60" stroke="#fbbf24" strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round" />
                                    <path d="M155 60 L160 60 L158 65" fill="#fbbf24" />

                                    {/* Zagubiony gracz (?) */}
                                    <circle cx="180" cy="50" r="12" stroke="white" strokeWidth="2" fill="none"/>
                                    <text x="176" y="56" fill="white" fontSize="16" fontWeight="bold">?</text>
                                </svg>
                            </div>

                            {/* Dekoracyjne rozmycie */}
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-400 rounded-full blur-3xl opacity-20"></div>
                        </div>
                    </div>

                    {/* PRAWA STRONA: Treść i akcje */}
                    <div className="w-full md:w-7/12 p-10 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">

                        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-4">
                            <FlagTriangleRight className="h-5 w-5" />
                            <span className="font-bold tracking-wider uppercase text-xs">Błąd taktyczny</span>
                        </div>

                        <div className="flex flex-row items-center justify-between mb-8 gap-6">
                            <div>
                                <h1 className="text-7xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">
                                    404
                                </h1>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                                    To jest spalony!
                                </h2>
                            </div>

                            {/* Duże logo aplikacji */}
                            <img
                                src="/favicon.png"
                                alt="Logo Aplikacji"
                                className="hidden sm:block w-28 h-28 md:w-40 md:h-40 drop-shadow-xl object-contain shrink-0 animate-in fade-in slide-in-from-right-6 duration-700"
                            />
                        </div>

                        <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed text-lg max-w-md">
                            Wygląda na to, że piłka wyszła poza boisko. Adres, którego szukasz, nie znajduje się w naszej strefie gry.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            {canGoBack ? (
                                <Button
                                    onClick={() => navigate(-1)}
                                    size="lg"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-200 dark:shadow-none flex-1"
                                >
                                    <ChevronLeft className="mr-2 h-5 w-5" />
                                    Wróć do poprzedniej akcji
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => navigate('/')}
                                    size="lg"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex-1"
                                >
                                    <Home className="mr-2 h-5 w-5" />
                                    Wróć na boisko (Home)
                                </Button>
                            )}

                            {isAuthenticated && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => navigate('/dashboard')}
                                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex-1"
                                >
                                    <LayoutDashboard className="mr-2 h-5 w-5" />
                                    Główny panel
                                </Button>
                            )}
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}