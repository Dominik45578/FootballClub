// Simple auth helper: login/logout and token storage
// Uses localStorage for access token (quick integration). Replace with httpOnly cookie flow later for better security.

export type LoginResponse = {
    success: boolean
    message?: string
    token?: string
}

const TOKEN_KEY = 'fc_token'

export async function login(): Promise<LoginResponse> {
    // Mockowana odpowiedź dla funkcji login
    return {
        success: true,
        message: 'Zalogowano pomyślnie (mock)',
        token: 'mock-token',
    };
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
