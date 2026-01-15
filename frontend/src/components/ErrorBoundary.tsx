import React from 'react'

type Props = { children: React.ReactNode }

type State = { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    // log to console — could be extended to send to monitoring
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      // Show more info in development to help debugging — safe detection that works in browser and Vite
      const isDev = (() => {
        try {
          if ((globalThis as any)?.process?.env?.NODE_ENV !== undefined) {
            return (globalThis as any).process.env.NODE_ENV !== 'production'
          }
        } catch (e) { /* ignore */ }
        try {
          return (import.meta as any)?.env?.MODE !== 'production'
        } catch (e) {
          return false
        }
      })()
      if (isDev) {
        const err = this.state.error
        return (
          <div className="p-2 rounded border bg-destructive/10 text-destructive">
            <div>Wystąpił błąd w komponencie kalendarza</div>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{String(err?.message || err)}</pre>
            {err?.stack && <details className="text-xs mt-2"><summary>Szczegóły stosu</summary><pre className="whitespace-pre-wrap">{String(err.stack)}</pre></details>}
          </div>
        )
      }
      return (
        <div className="p-2 rounded border bg-destructive/10 text-destructive">Wystąpił błąd w komponencie kalendarza</div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
