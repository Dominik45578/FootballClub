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
  // allow disabling the control from parent
  disabled?: boolean
  // optional className forwarded to the internal input to allow matching styles
  inputClassName?: string
  // when true, show time controls under the calendar
  includeTime?: boolean
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function toISODateTime(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0) }

function parseSafeDate(s?: string | null): Date | null {
  if (!s) return null
  try {
    const d = new Date(s)
    if (isNaN(d.getTime())) return null
    return d
  } catch (e) {
    return null
  }
}

export default function DateInput({ value, onChange, id, placeholder, required, inputClassName, disabled, includeTime = true }: Props) {
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState<string | null>(value ?? null)
  // use a safe parser for initial view month
  const [viewMonth, setViewMonth] = useState<Date>(() => parseSafeDate(internal) ?? new Date())
  // time selection states (used only when includeTime is true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parseSafeDate(internal))
  const [selectedHour, setSelectedHour] = useState<number>(() => { const d = parseSafeDate(internal); return d ? d.getHours() : 0 })
  const [selectedMinute, setSelectedMinute] = useState<number>(() => { const d = parseSafeDate(internal); return d ? d.getMinutes() : 0 })
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
  const hourInputRef = useRef<HTMLInputElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingRef = useRef(false)
  const suppressCloseRef = useRef<number>(0)

  // Ensure critical date/time states are valid to avoid runtime render errors
  useEffect(() => {
    if (!(viewMonth instanceof Date) || isNaN(viewMonth.getTime())) {
      setViewMonth(new Date())
    }
  }, [viewMonth])

  useEffect(() => {
    if (selectedDate && (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime()))) {
      setSelectedDate(null)
    }
  }, [selectedDate])

  useEffect(() => {
    if (!Number.isFinite(selectedHour) || isNaN(selectedHour) || selectedHour < 0 || selectedHour > 23) setSelectedHour(0)
  }, [selectedHour])

  useEffect(() => {
    if (!Number.isFinite(selectedMinute) || isNaN(selectedMinute) || selectedMinute < 0 || selectedMinute > 59) setSelectedMinute(0)
  }, [selectedMinute])

  useEffect(() => setInternal(value ?? null), [value])
  // set viewMonth only when parsed date is valid
  useEffect(() => {
    const parsed = parseSafeDate(internal)
    if (parsed) {
      setViewMonth(parsed)
      // initialize time selection when there's an initial value
      setSelectedDate(parsed)
      setSelectedHour(parsed.getHours())
      setSelectedMinute(parsed.getMinutes())
    }
  }, [internal])

  // when popup opens and includeTime is enabled, prefill selected date/time and focus hour input
  useEffect(() => {
    if (!open || !includeTime) return
    const parsed = parseSafeDate(internal) ?? new Date()
    setSelectedDate(parsed)
    setSelectedHour(parsed.getHours())
    setSelectedMinute(parsed.getMinutes())
    setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
    // small timeout to allow popup to render
    setTimeout(() => { try { hourInputRef.current?.focus() } catch (e) { /* ignore */ } }, 0)
  }, [open, includeTime])

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

    // when includeTime is enabled, set selectedDate and keep popup open so user can pick time
    if (includeTime) {
      setSelectedDate(d)
      // ensure viewMonth reflects the selected date's month
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
      // focus hour input so time can be entered immediately
      setTimeout(() => { try { hourInputRef.current?.focus() } catch (e) { /* ignore */ } }, 0)
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

  // apply selected date (and time if includeTime) and notify parent
  const applySelection = () => {
    if (!selectedDate) { setOpen(false); return }
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedHour, selectedMinute, 0)
    const iso = includeTime ? toISODateTime(d) : toISO(d)
    setInternal(iso)
    try { onChange?.(iso) } catch (e) { console.error('DateInput onChange error', e) } finally { setOpen(false) }
  }

  const clearSelection = () => {
    setSelectedDate(null)
    setSelectedHour(0)
    setSelectedMinute(0)
    setInternal(null)
    try { onChange?.(null) } catch (e) { console.error('DateInput onChange error', e) }
    setOpen(false)
  }

  // month navigation helpers (use safe fallback if state is invalid)
  const prevMonth = () => setViewMonth(m => {
    const base = (m instanceof Date && !isNaN(m.getTime())) ? m : safeViewMonth
    return new Date(base.getFullYear(), base.getMonth()-1, 1)
  })
  const nextMonth = () => setViewMonth(m => {
    const base = (m instanceof Date && !isNaN(m.getTime())) ? m : safeViewMonth
    return new Date(base.getFullYear(), base.getMonth()+1, 1)
  })

  // helper to render year buttons (avoids complex IIFE inside JSX)
  const renderYearButtons = () => {
    const current = new Date().getFullYear()
    const start = current - 60
    const end = current + 2
    const years: number[] = []
    for (let y = end; y >= start; y--) years.push(y)
    return years.map(y => (
      <button
        key={y}
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => { setViewMonth(new Date(y, safeViewMonth.getMonth(), 1)); setYearOpen(false) }}
        onMouseEnter={() => setHoveredYear(y)}
        onMouseLeave={() => setHoveredYear(null)}
        className={`block w-full text-left px-2 py-1 rounded transition-colors duration-150 hover:bg-accent/10`}
        style={{ color: textColor, boxShadow: hoveredYear === y ? `inset 0 0 0 9999px ${hoverOverlayColor}` : undefined, transition: 'box-shadow 150ms ease' }}
      >
        {y}
      </button>
    ))
  }

  // Ensure we use a valid Date for calendar computations
  const safeViewMonth = (viewMonth instanceof Date && !isNaN(viewMonth.getTime())) ? viewMonth : new Date()
  const monthStart = startOfMonth(safeViewMonth)
  const monthEnd = endOfMonth(safeViewMonth)
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
              <button type="button" onPointerDown={(e)=>{ e.stopPropagation(); suppressCloseRef.current = Date.now() + 250 }} onClick={() => { setMonthOpen(v => !v); setYearOpen(false) }} className="rounded-md border border-border px-2 py-0.5 text-sm flex items-center gap-2" style={{ background: 'transparent' }}>{safeViewMonth.toLocaleString(undefined, { month: 'long' })}</button>
              {monthOpen && (
                <div className="absolute left-0 z-40 mt-1 border border-border rounded-md shadow p-1 flex flex-col text-sm bg-card" style={{ minWidth: 128, backgroundColor: 'var(--card, #fff)' }}>
                  {Array.from({ length: 12 }).map((_, m) => (
                    <button
                      key={m}
                      type="button"
                      onPointerDown={(e)=>e.stopPropagation()}
                      onClick={() => { setViewMonth(new Date(safeViewMonth.getFullYear(), m, 1)); setMonthOpen(false) }}
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
              <button type="button" onPointerDown={(e)=>{ e.stopPropagation(); suppressCloseRef.current = Date.now() + 250 }} onClick={() => { setYearOpen(v => !v); setMonthOpen(false) }} className="rounded-md border border-border px-2 py-0.5 text-sm" style={{ background: 'transparent' }}>{safeViewMonth.getFullYear()}</button>
              {yearOpen && (
                <div className="absolute left-0 z-40 mt-1 border border-border rounded-md shadow p-1 max-h-60 overflow-auto flex flex-col text-sm bg-card" style={{ minWidth: 96, backgroundColor: 'var(--card, #fff)' }}>
                  {renderYearButtons()}
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
                  {row.map((d, j) => {
                    if (d === null) return <td key={j} className="py-0.5" />
                    const isoForDay = toISO(new Date(safeViewMonth.getFullYear(), safeViewMonth.getMonth(), d))
                    const isSelected = !!(selectedDate && selectedDate.getFullYear() === safeViewMonth.getFullYear() && selectedDate.getMonth() === safeViewMonth.getMonth() && selectedDate.getDate() === d)
                    return (
                      <td key={j} className="py-0.5">
                        <button
                          type="button"
                          onPointerDown={(e)=>{ e.stopPropagation(); suppressCloseRef.current = Date.now() + 250 }}
                          onClick={() => select(new Date(safeViewMonth.getFullYear(), safeViewMonth.getMonth(), d))}
                          onMouseEnter={() => setHoveredIso(isoForDay)}
                          onMouseLeave={() => setHoveredIso(null)
                          }
                          className={`w-full h-full px-2 py-1 rounded-md transition-colors duration-150 flex items-center justify-center hover:bg-accent/10 ${isSelected ? 'ring-2 ring-accent/40 bg-accent/10' : ''}`}
                          style={{ color: textColor, boxShadow: hoveredIso === isoForDay ? `inset 0 0 0 9999px ${hoverOverlayColor}` : undefined, transition: 'box-shadow 150ms ease' }}
                        >
                          {d}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
             </tbody>
           </table>
         </div>

         {/* time controls (pokazuj tylko gdy includeTime === true i popup jest otwarty) */}
         {open && includeTime && (
           <div className="px-2 pt-2 pb-1 border-t border-border mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <label className="text-sm text-muted-foreground">Godz.</label>
                <input
                  ref={hourInputRef}
                  type="number"
                  min={0}
                  max={23}
                  value={selectedHour}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(23, Number(e.target.value || 0)))
                    setSelectedHour(v)
                  }}
                  className="w-16 px-2 py-1 rounded border border-border text-sm"
                />
                <label className="text-sm text-muted-foreground">Min.</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={selectedMinute}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(59, Number(e.target.value || 0)))
                    setSelectedMinute(v)
                  }}
                  className="w-16 px-2 py-1 rounded border border-border text-sm"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={clearSelection} className="text-sm px-2 py-1 rounded border border-border hover:bg-accent/10">Wyczyść</button>
                <button type="button" onClick={applySelection} className="text-sm px-2 py-1 rounded bg-accent text-accent-foreground hover:opacity-95">Zastosuj</button>
              </div>
            </div>
         )}
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
         disabled={disabled}
         readOnly
         value={safeFormatDisplay(internal)}
         onPointerDown={(e) => {
          e.stopPropagation();
          suppressCloseRef.current = Date.now() + 250;
          // when includeTime is enabled, prefill selectedDate so time controls are usable immediately
          if (includeTime) {
            const parsed = parseSafeDate(internal) ?? new Date()
            setSelectedDate(parsed)
            setSelectedHour(parsed.getHours())
            setSelectedMinute(parsed.getMinutes())
            setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
            setOpen(true)
            // focus hour input shortly after opening
            setTimeout(() => { try { hourInputRef.current?.focus() } catch (err) { /* ignore */ } }, 0)
            return
          }
          setOpen(true)
         }}
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
     const parsed = parseSafeDate(internal)
     if (!parsed) return ''
     // if time component is present (ISO with T), show both date and time
     if (internal && internal.includes('T')) return parsed.toLocaleString()
     return parsed.toLocaleDateString()
   } catch (e) {
     console.error('DateInput format error', e)
     return ''
   }
 }
