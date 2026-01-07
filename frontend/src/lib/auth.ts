// Simple auth helper: login/logout and token storage
// Uses localStorage for access token (quick integration). Replace with httpOnly cookie flow later for better security.

export type LoginResponse = {
    success: boolean
    message?: string
    token?: string
}

const API_BASE = '/api/auth'
const TOKEN_KEY = 'fc_token'

export async function login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        // credentials: 'include' // enable when using cookies
    })

    if (!res.ok) {
        // try to parse body for message
        let txt: string
        try {
            const j = await res.json()
            txt = j?.message || JSON.stringify(j)
        } catch (e) {
            txt = await res.text()
        }
        return { success: false, message: txt }
    }

    const body = await res.json()
    // support common field names returned by different backends
    const token = body?.token || body?.accessToken || body?.access_token
    if (token) {
        setToken(token)
        return { success: true, message: body?.message, token }
    }

    // Fallback for local dev: if backend responds with success flag but no token,
    // create a temporary token so the frontend can access protected routes during development.
    if (body?.success === true) {
        const devToken = 'dev-token'
        setToken(devToken)
        return { success: true, message: body?.message || 'Zalogowano (dev fallback)', token: devToken }
    }

    // fallback if backend returns different shape
    return { success: false, message: 'Nieprawidłowa odpowiedź serwera' }
}

export function setToken(token: string) {
    try {
        localStorage.setItem(TOKEN_KEY, token)
    } catch (e) {
        // ignore storage errors
    }
}

export function getToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY)
    } catch (e) {
        return null
    }
}

export function logout() {
    try {
        localStorage.removeItem(TOKEN_KEY)
    } catch (e) {
    }
}

export function authHeader(): Record<string, string> {
    const t = getToken()
    return t ? { Authorization: `Bearer ${t}` } : {}
}
