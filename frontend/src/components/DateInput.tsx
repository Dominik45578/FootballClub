import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ErrorBoundary from '@/components/ErrorBoundary'

type Props = {
  value?: string | null
  onChange?: (isoDate: string | null) => void
  id?: string
  placeholder?: string
  required?: boolean
  // optional className forwarded to the internal input to allow matching styles
  inputClassName?: string
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0) }

export default function DateInput({ value, onChange, id, placeholder, required, inputClassName }: Props) {
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState<string | null>(value ?? null)
  const [viewMonth, setViewMonth] = useState<Date>(() => internal ? new Date(internal) : new Date())
  const [monthOpen, setMonthOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<Record<string,string>>({})
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)
  const [hoveredYear, setHoveredYear] = useState<number | null>(null)
  const [hoveredIso, setHoveredIso] = useState<string | null>(null)
  const [hoverOverlayColor, setHoverOverlayColor] = useState<string>('rgba(255,255,255,0.16)')
  const [textColor, setTextColor] = useState<string>('var(--foreground)')

  const ref = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingRef = useRef(false)
  const suppressCloseRef = useRef<number>(0)

  useEffect(() => setInternal(value ?? null), [value])
  useEffect(() => { if (internal) setViewMonth(new Date(internal)) }, [internal])

  // compute overlay and text color based on popup background so hover always 'brightens'
  useEffect(() => {
    if (!popupRef.current) return
    try {
      const el = popupRef.current
      let bg = getComputedStyle(el).backgroundColor || ''
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
        const rootBg = getComputedStyle(document.documentElement).getPropertyValue('--card')?.trim() || ''
        if (rootBg) bg = rootBg
      }
      const parseToRGB = (s: string) => {
        const m = s.match(/rgba?\s*\(\s*(\d+),\s*(\d+),\s*(\d+)/i)
        if (m) return { r: +m[1], g: +m[2], b: +m[3] }
        const h = s.match(/^#([0-9a-f]{6})$/i)
        if (h) return { r: parseInt(h[1].slice(0,2),16), g: parseInt(h[1].slice(2,4),16), b: parseInt(h[1].slice(4,6),16) }
        return null
      }
      const rgb = parseToRGB(bg)
      if (rgb) {
        const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
        const dark = brightness < 140
        // overlay: choose hover overlay depending on background brightness
        setHoverOverlayColor(dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)')
        setTextColor(dark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.92)')
      }
    } catch (e) {
      // ignore
    }
  }, [open, viewMonth])

  // compute popup position; safe and idempotent
  const computePosition = () => {
    const inputEl = inputRef.current
    const popupEl = popupRef.current
    if (!inputEl || !popupEl) return
    try {
      const rect = inputEl.getBoundingClientRect()
      const vw = window.innerWidth
      const margin = 8
      const width = Math.max(160, Math.min(rect.width, vw - 2 * margin))
      let left = rect.left
      if (left + width > vw - margin) left = Math.max(margin, vw - margin - width)
      if (left < margin) left = margin
      const top = rect.bottom + margin
      const style = { position: 'fixed', left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, width: `${Math.round(width)}px` }
      // apply immediately
      popupEl.style.position = style.position
      popupEl.style.left = style.left
      popupEl.style.top = style.top
      popupEl.style.width = style.width
      setPopupStyle(style)
    } catch (e) {
      // ignore
    }
  }

  // throttle computePosition with RAF
  const schedulePosition = () => {
    if (pendingRef.current) return
    pendingRef.current = true
    rafRef.current = requestAnimationFrame(() => {
      pendingRef.current = false
      computePosition()
    })
  }

  useEffect(() => {
    if (!open) return
    // compute immediately
    computePosition()
    const onScroll = () => schedulePosition()
    const onResize = () => schedulePosition()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // also observe popup size changes
    const ro = new ResizeObserver(() => schedulePosition())
    if (popupRef.current) ro.observe(popupRef.current)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }
  }, [open, viewMonth])

  // close on outside click — attach listener only when popup is open to avoid interfering with opening click
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      try {
        if (Date.now() < suppressCloseRef.current) return
        const path = (e.composedPath && e.composedPath()) || (e as any).path || []
        const targetIsInside = (el: Element | null) => {
          if (!el) return false
          if (path && path.length) return path.includes(el)
          return el.contains(e.target as Node)
        }

        if (targetIsInside(ref.current)) return
        if (targetIsInside(popupRef.current)) return
        setOpen(false)
      } catch (err) {
        const t = e.target as Node
        if (!ref.current) return
        if (ref.current.contains(t)) return
        if (popupRef.current && popupRef.current.contains(t)) return
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const select = (d?: Date | null) => {
    if (!d) {
      try { setInternal(null); onChange?.(null) } catch (e) { console.error('DateInput onChange error', e) }
      setOpen(false)
      return
    }
    const iso = toISO(d)
    setInternal(iso)
    try {
      onChange?.(iso)
    } catch (e) {
      // Log but don't rethrow - prevent parent errors from crashing app
      console.error('DateInput onChange error', e)
    } finally {
      setOpen(false)
    }
  }

  const prevMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))
  const nextMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const startWeekDay = monthStart.getDay()
  const daysInMonth = monthEnd.getDate()

  const weeks: Array<Array<number | null>> = []
  let day = 1
  for (let wk = 0; wk < 6; wk++) {
    const row: Array<number | null> = []
    for (let wd = 0; wd < 7; wd++) {
      if (wk === 0 && wd < startWeekDay) row.push(null)
      else if (day > daysInMonth) row.push(null)
      else { row.push(day); day++ }
    }
    weeks.push(row)
  }

  let popupElement: ReactNode = null
  try {
    popupElement = (
      <div ref={popupRef} className="z-50 bg-card border border-border rounded-md shadow-lg p-1" style={{ backgroundColor: 'var(--card)', boxSizing: 'border-box', color: 'var(--foreground)', ...popupStyle }}>

        <div className="flex items-center justify-between px-1 pb-1 gap-1 whitespace-nowrap" data-popup-header={true}>
          <div className="flex items-center gap-2">
            <button type="button" onClick={prevMonth} aria-label="Poprzedni miesiąc" className="rounded-md border border-border p-1.5 flex items-center justify-center hover:bg-accent/10 focus:outline-none" style={{ backgroundColor: 'transparent' }}>
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1 relative">
            <div className="relative">
              <button type="button" onPointerDown={(e)=>{ e.stopPropagation(); suppressCloseRef.current = Date.now() + 250 }} onClick={() => { setMonthOpen(v => !v); setYearOpen(false) }} className="rounded-md border border-border px-2 py-0.5 text-sm flex items-center gap-2" style={{ background: 'transparent' }}>{viewMonth.toLocaleString(undefined, { month: 'long' })}</button>
              {monthOpen && (
                <div className="absolute left-0 z-40 mt-1 border border-border rounded-md shadow p-1 flex flex-col text-sm bg-card" style={{ minWidth: 128, backgroundColor: 'var(--card, #fff)' }}>
                  {Array.from({ length: 12 }).map((_, m) => (
                    <button
                      key={m}
                      type="button"
                      onPointerDown={(e)=>e.stopPropagation()}
                      onClick={() => { setViewMonth(new Date(viewMonth.getFullYear(), m, 1)); setMonthOpen(false) }}
                      onMouseEnter={() => setHoveredMonth(m)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className={`block w-full text-left px-2 py-1 rounded transition-colors duration-150 hover:bg-accent/10`}
                      style={{ color: textColor, boxShadow: hoveredMonth === m ? `inset 0 0 0 9999px ${hoverOverlayColor}` : undefined, transition: 'box-shadow 150ms ease' }}
                    >
                      {new Date(0, m).toLocaleString(undefined, { month: 'long' })}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button type="button" onPointerDown={(e)=>{ e.stopPropagation(); suppressCloseRef.current = Date.now() + 250 }} onClick={() => { setYearOpen(v => !v); setMonthOpen(false) }} className="rounded-md border border-border px-2 py-0.5 text-sm" style={{ background: 'transparent' }}>{viewMonth.getFullYear()}</button>
              {yearOpen && (
                <div className="absolute left-0 z-40 mt-1 border border-border rounded-md shadow p-1 max-h-60 overflow-auto flex flex-col text-sm bg-card" style={{ minWidth: 96, backgroundColor: 'var(--card, #fff)' }}>
                  {(() => {
                    const current = new Date().getFullYear()
                    const start = current - 60
                    const end = current + 2
                    const years: number[] = []
                    for (let y = end; y >= start; y--) years.push(y)
                    return years.map(y => (
                      <button
                        key={y}
                        type="button"
                        onPointerDown={(e)=>e.stopPropagation()}
                        onClick={() => { setViewMonth(new Date(y, viewMonth.getMonth(), 1)); setYearOpen(false) }}
                        onMouseEnter={() => setHoveredYear(y)}
                        onMouseLeave={() => setHoveredYear(null)}
                        className={`block w-full text-left px-2 py-1 rounded transition-colors duration-150 hover:bg-accent/10`}
                        style={{ color: textColor, boxShadow: hoveredYear === y ? `inset 0 0 0 9999px ${hoverOverlayColor}` : undefined, transition: 'box-shadow 150ms ease' }}
                      >
                        {y}
                      </button>
                     ))
                   })()}
                 </div>
               )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={nextMonth} aria-label="Następny miesiąc" className="rounded-md border border-border p-1.5 flex items-center justify-center hover:bg-accent/10 focus:outline-none" style={{ backgroundColor: 'transparent' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 'auto', overflowY: 'auto' }}>
          <table className="w-full text-center table-fixed">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-0.5">N</th><th className="py-0.5">P</th><th className="py-0.5">W</th><th className="py-0.5">Ś</th><th className="py-0.5">C</th><th className="py-0.5">P</th><th className="py-0.5">S</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((row, i) => (
                <tr key={i}>
                  {row.map((d, j) => (
                    <td key={j} className="py-0.5">
                      {d === null ? null : (
                        <button
                          type="button"
                          onPointerDown={(e)=>{ e.stopPropagation(); suppressCloseRef.current = Date.now() + 250 }}
                          onClick={() => select(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))}
                          onMouseEnter={() => setHoveredIso(toISO(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d)))}
                          onMouseLeave={() => setHoveredIso(null)}
                          className={`w-full h-full px-2 py-1 rounded-md transition-colors duration-150 flex items-center justify-center hover:bg-accent/10`}
                          style={{ color: textColor, boxShadow: hoveredIso === toISO(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d)) ? `inset 0 0 0 9999px ${hoverOverlayColor}` : undefined, transition: 'box-shadow 150ms ease' }}
                         >
                           {d}
                         </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  } catch (e) {
    console.error('DateInput render error:', e)
    popupElement = null
  }

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        id={id}
        placeholder={placeholder}
        required={required}
        readOnly
        value={safeFormatDisplay(internal)}
        onPointerDown={(e) => { e.stopPropagation(); suppressCloseRef.current = Date.now() + 250; setOpen(true) }}
        aria-haspopup="dialog"
        aria-expanded={open}
        // allow callers to override / extend input classes to match surrounding inputs
        className={`${"w-full px-3 py-2 text-sm rounded-md border border-border focus:ring-1 focus:ring-accent focus:outline-none"} ${inputClassName ?? ''}`}
        style={{ color: 'var(--foreground)', backgroundColor: 'var(--card)' }}
        ref={inputRef}
      />
      {open && (() => {
        try {
          return createPortal(
            <ErrorBoundary>
              {popupElement}
            </ErrorBoundary>,
            document.body
          )
        } catch (e) {
          console.error('DateInput portal error', e)
          return null
        }
      })()}
    </div>
  )
}

function safeFormatDisplay(internal: string | null) {
  try {
    return internal ? new Date(internal).toLocaleDateString() : ''
  } catch (e) {
    console.error('DateInput format error', e)
    return ''
  }
}
