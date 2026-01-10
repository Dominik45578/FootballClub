import * as React from 'react'

export function EyeIcon(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
      <path d="M2.5 12s4.5-7.5 9.5-7.5S21.5 12 21.5 12s-4.5 7.5-9.5 7.5S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.8 4.8" />
      <path d="M2.5 12s4.5-7.5 9.5-7.5a9.7 9.7 0 0 1 6.6 2.4" />
      <path d="M21.5 12s-1.2 2-3.6 4" />
    </svg>
  )
}

export function LockIcon(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
    </svg>
  )
}

export function MailIcon(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
      <path d="M3 8.5v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <polyline points="3 8.5 12 14 21 8.5" />
    </svg>
  )
}

export function CheckIcon(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

