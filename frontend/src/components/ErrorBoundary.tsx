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
      return (
        <div className="p-2 rounded border bg-destructive/10 text-destructive">Wystąpił błąd w komponencie kalendarza</div>
      )
    }
    return this.props.children as React.ReactElement
  }
}

export default ErrorBoundary

