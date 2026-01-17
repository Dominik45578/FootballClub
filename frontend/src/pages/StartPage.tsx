import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react'

export function StartPage() {
    const navigate = useNavigate()
    const [isHoveringLeft, setIsHoveringLeft] = useState(false)

    // Ustawienie tytułu strony
    useEffect(() => {
        document.title = 'Zarządzanie klubem - Panel Startowy'
    }, [])

    // Style tła
    const backgroundStyle: React.CSSProperties = {
        backgroundImage: "url('/logo-bg.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    }

    // Logika Overlay:
    // Ciemne tło, które lekko się rozjaśnia przy aktywności użytkownika
    const overlayClass = isHoveringLeft
        ? 'bg-slate-900/60 backdrop-blur-sm'
        : 'bg-slate-900/80 backdrop-blur-md'

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-6" style={backgroundStyle}>

            {/* 1. WARSTWA OVERLAY */}
            <div
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${overlayClass}`}
            />

            {/* 2. GŁÓWNY KONTENER */}
            <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">

                {/* === LEWA STRONA: PANEL AKCJI (DARK THEME) === */}
                <div
                    className="bg-slate-950/95 border border-slate-800 shadow-2xl rounded-2xl p-8 md:p-12 transition-transform duration-300 hover:scale-[1.01]"
                    onMouseEnter={() => setIsHoveringLeft(true)}
                    onMouseLeave={() => setIsHoveringLeft(false)}
                >
                    <div className="mb-8">
                        {/* Tekst zmieniony na jasny (text-white / text-slate-400) */}
                        <h2 className="text-2xl font-bold text-white">Panel Dostępu</h2>
                        <p className="text-slate-400 mt-2">Wybierz akcję, aby kontynuować.</p>
                    </div>

                    {/* Główne Przyciski */}
                    <div className="space-y-4 mb-8">
                        <Button
                            size="lg"
                            className="w-full h-14 text-base justify-between group bg-white text-slate-950 hover:bg-slate-200 border-0"
                            onClick={() => navigate('/login')}
                        >
                            <span className="flex items-center gap-3 font-semibold">
                                <LogIn className="w-5 h-5" />
                                Zaloguj się
                            </span>
                            <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-14 text-base justify-start bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                            onClick={() => navigate('/register')}
                        >
                            <UserPlus className="w-5 h-5 mr-3 text-slate-400 group-hover:text-white transition-colors" />
                            Zarejestruj się
                        </Button>
                    </div>

                    {/* Separator (Ciemniejszy) */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-950 px-2 text-slate-500 font-medium">Pozostałe opcje</span>
                        </div>
                    </div>

                    {/* Przyciski Pomocnicze (Dostosowane do ciemnego tła) */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="ghost"
                            className="h-auto flex flex-col items-start p-4 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition-all"
                            onClick={() => navigate('/reset-password')}
                        >
                            <KeyRound className="w-5 h-5 mb-2 text-teal-500" />
                            <span className="text-xs font-semibold text-slate-300">Hasło</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="h-auto flex flex-col items-start p-4 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition-all"
                            onClick={() => navigate('/activate-account')}
                        >
                            <ShieldCheck className="w-5 h-5 mb-2 text-teal-500" />
                            <span className="text-xs font-semibold text-slate-300">Aktywacja</span>
                        </Button>
                    </div>
                </div>

                {/* === PRAWA STRONA: LOGO I NAZWA KLUBU === */}
                <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-10 duration-1000">

                    {/* Kontener na Logo z efektem poświaty */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-[60px] group-hover:bg-teal-400/30 transition-all duration-700" />

                        <img
                            src="/favicon.png"
                            alt="Club Logo"
                            className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                    </div>

                    {/* Nazwa Klubu */}
                    <div className="mt-10 space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-wider uppercase drop-shadow-lg">
                            FC Polibuda
                        </h1>
                        <p className="text-teal-400 text-lg md:text-xl font-medium tracking-widest uppercase opacity-90">
                            Est. 2025
                        </p>
                    </div>

                </div>

            </div>
        </div>
    )
}