// Prostý mock auth dla deva.
const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'
const GATEWAY = (import.meta.env.VITE_GATEWAY_URL || '').replace(/\/$/, '')
// Prefiks API do gateway (np. /api); dla bezpośredniego połączenia z identity zostanie pominięty
const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? '/api').replace(/\/$/, '')
// Pozwól nadpisać URL auth bezpośrednio na identity lub gateway
const AUTH_URL = (import.meta.env.VITE_AUTH_URL || GATEWAY || import.meta.env.VITE_IDENTITY_URL || '').replace(/\/$/, '')
const USE_GATEWAY_PREFIX = AUTH_URL === GATEWAY && !!API_PREFIX
const AUTH_BASE = `${AUTH_URL}${USE_GATEWAY_PREFIX ? API_PREFIX : ''}/auth`
const LOGOUT_URL = `${AUTH_URL}${USE_GATEWAY_PREFIX ? API_PREFIX : ''}/logout`
const COOKIE_TOKEN_KEY = 'token'

const TOKEN_KEY = 'auth-token'
const USER_ID_KEY = 'auth-user-id'

// Klucze w localStorage dla deva
const DEV_TOKEN_KEY = 'dev-token'
const DEV_USER_ID_KEY = 'dev-user-id'

export function setDevAuth(token: string, userId: number) {
  localStorage.setItem(DEV_TOKEN_KEY, token)
  localStorage.setItem(DEV_USER_ID_KEY, String(userId))
}

export function clearDevAuth() {
  localStorage.removeItem(DEV_TOKEN_KEY)
  localStorage.removeItem(DEV_USER_ID_KEY)
}

function setProdAuth(token?: string, userId?: number) {
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token)
  setCookieToken(token)
  if (userId) localStorage.setItem(USER_ID_KEY, String(userId))
}

function clearProdAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  clearCookieToken()
}

export async function login(email?: string, password?: string): Promise<{ success: boolean; token?: string; userId?: number; message?: string }> {
  if (OFFLINE) {
    const TEST_EMAIL = 'admin@klub.pl'
    const TEST_PASSWORD = 'haslo123'
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      const token = localStorage.getItem(DEV_TOKEN_KEY) ?? 'dev-token'
      const userId = Number(localStorage.getItem(DEV_USER_ID_KEY) ?? 1)
      setDevAuth(token, userId)
      return Promise.resolve({ success: true, token, userId, message: 'Zalogowano lokalnie (mock)' })
    }
    return Promise.resolve({ success: false, message: 'Nieprawidłowy email lub hasło (mock)' })
  }
  const res = await fetchJson(`${AUTH_BASE}/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  if (res?.token) setProdAuth(res.token, res.userId)
  return res
}

export async function register(payload: { username: string; password: string; email: string }) {
  if (OFFLINE) return Promise.resolve({ success: true, message: 'Zarejestrowano lokalnie (mock)' })
  const res = await fetchJson(`${AUTH_BASE}/register`, { method: 'POST', body: JSON.stringify(payload) })
  if (res?.token) setProdAuth(res.token, res.userId)
  return res
}

export async function refreshAuth(refreshToken: string) {
  if (OFFLINE) return Promise.resolve({ token: 'dev-token' })
  const res = await fetchJson(`${AUTH_BASE}/refresh`, { method: 'POST', body: JSON.stringify({ refreshToken }) })
  if (res?.token) setProdAuth(res.token, res.userId)
  return res
}

export async function logout() {
  if (OFFLINE) {
    clearDevAuth()
    return
  }
  try {
    await fetchJson(LOGOUT_URL, { method: 'POST', headers: authHeader() })
  } catch (e) {
    // ignore logout failures, still clear client auth
  } finally {
    clearProdAuth()
  }
}

export function getToken(): string | null {
  if (OFFLINE) return localStorage.getItem(DEV_TOKEN_KEY) ?? null
  return readCookieToken() ?? localStorage.getItem(TOKEN_KEY)
}

export function getUserId(): number | null {
  if (OFFLINE) return Number(localStorage.getItem(DEV_USER_ID_KEY) ?? 1)
  const val = localStorage.getItem(USER_ID_KEY)
  return val ? Number(val) : null
}

export function authHeader(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const uid = getUserId()
  if (uid) headers['X-User-Id'] = String(uid)
  return headers
}

export function setToken(token: string) {
  if (OFFLINE) {
    localStorage.setItem(DEV_TOKEN_KEY, token)
  } else {
    setProdAuth(token)
  }
}

export function setUserId(userId: number) {
  if (OFFLINE) {
    localStorage.setItem(DEV_USER_ID_KEY, String(userId))
  } else {
    localStorage.setItem(USER_ID_KEY, String(userId))
  }
}

export { OFFLINE }

function setCookieToken(token: string) {
  document.cookie = `${COOKIE_TOKEN_KEY}=${token}; path=/; SameSite=Lax`
}

function clearCookieToken() {
  document.cookie = `${COOKIE_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

function readCookieToken(): string | null {
  const cookies = document.cookie?.split(';') ?? []
  for (const c of cookies) {
    const [k, v] = c.trim().split('=')
    if (k === COOKIE_TOKEN_KEY) return v || null
  }
  return null
}

async function fetchJson(url: string, opts: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const res = await fetch(url, { ...opts, headers, credentials: 'include' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || res.statusText)
  }
  return res.status === 204 ? null : res.json()
}
