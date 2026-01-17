import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus } from 'lucide-react'

export function StartPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const DEFAULT_OPACITY = 0.05
  const PREVIOUS_HOVER_OPACITY = 0.25
  const REDUCTION_FACTOR_30 = 0.3
  const REDUCTION_FACTOR_10 = 0.1
  const adjustedHoverOpacity = PREVIOUS_HOVER_OPACITY * (1 - REDUCTION_FACTOR_30) * (1 - REDUCTION_FACTOR_10) // 0.1575
  const overlayOpacity = hovered ? adjustedHoverOpacity : DEFAULT_OPACITY

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: "url('/logo-bg.jpeg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  // Set the browser tab title when on StartPage and restore previous on unmount
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Zarządzanie klubem'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="min-h-screen relative flex items-center justify-center" style={backgroundStyle}>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(255,255,255,1)',
          opacity: overlayOpacity,
          transition: 'opacity 250ms ease-in-out',
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-background">
          <CardContent className="p-8 text-center rounded-lg bg-background">
            <div className="mb-6">
              <img src="/favicon.png" alt="Logo klubu" className="mx-auto w-32 h-32 object-contain" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Panel zarządzania klubem</h1>
            <p className="text-sm text-muted-foreground mb-6">Zarządzaj zawodnikami, meczami i zespołami.</p>

            <div className="flex gap-4 justify-center">
              <Button
                aria-label="Zaloguj"
                className="group min-w-[160px] px-5 py-3 text-base justify-center"
                onClick={() => navigate('/login')}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                <span className="relative flex items-center justify-center w-full">
                  <LogIn className="absolute left-4 h-5 w-5 opacity-0 -translate-x-3 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  <span className="transition-transform duration-200 group-hover:translate-x-2">Zaloguj</span>
                </span>
              </Button>

              <Button
                variant="outline"
                aria-label="Zarejestruj"
                className="group min-w-[160px] px-5 py-3 text-base justify-center"
                onClick={() => navigate('/register')}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                <span className="relative flex items-center justify-center w-full">
                  <UserPlus className="absolute left-1 h-5 w-5 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  <span className="transition-transform duration-200 group-hover:translate-x-2">Zarejestruj</span>
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
