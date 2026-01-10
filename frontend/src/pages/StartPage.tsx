import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function StartPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  // Overlay opacity: very light normally.
  // Previous hover opacity was 0.25 reduced by 30% -> 0.175. Now reduce that by 10% more
  // so the final hover opacity is 10% less faded than the previous version (0.175 * 0.9 = 0.1575).
  const DEFAULT_OPACITY = 0.05
  const PREVIOUS_HOVER_OPACITY = 0.25
  const REDUCTION_FACTOR_30 = 0.3 // previous reduction (30%)
  const REDUCTION_FACTOR_10 = 0.1 // new reduction (10%)
  const adjustedHoverOpacity = PREVIOUS_HOVER_OPACITY * (1 - REDUCTION_FACTOR_30) * (1 - REDUCTION_FACTOR_10) // 0.1575
  const overlayOpacity = hovered ? adjustedHoverOpacity : DEFAULT_OPACITY

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: "url('/logo-bg.jpeg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  // Set the browser tab title when on StartPage and restore previous on unmount
  useEffect(() => {
    const previous = document.title
    document.title = 'Zarządzanie klubem'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="min-h-screen relative flex items-center justify-center" style={backgroundStyle}>
      {/* overlay to control 'fade' effect, transitions smoothly
          Animate opacity (not background-color) so change is gradual */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(255,255,255,1)',
          opacity: overlayOpacity,
          transition: 'opacity 250ms ease-in-out',
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl">
          <CardContent className="p-8 text-center shadow-none md:shadow-lg rounded-lg">
            <div className="mb-6">
              {/* Replace with your actual logo file if available */}
              <div className="mx-auto w-32 h-32 rounded-full bg-teal-600 flex items-center justify-center text-white text-4xl font-bold">FC</div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Panel zarządzania klubem</h1>
            <p className="text-sm text-muted-foreground mb-6">Zarządzaj zawodnikami, meczami i powiadomieniami.</p>

            <div className="flex gap-4 justify-center">
              <Button aria-label="Zaloguj" onClick={() => navigate('/login')} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                Zaloguj
              </Button>

              <Button variant="outline" aria-label="Zarejestruj" onClick={() => navigate('/register')} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                Zarejestruj
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
