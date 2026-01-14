export const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'
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
const REFRESH_TOKEN_KEY = 'auth-refresh-token'

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

function setProdAuth(token?: string, userId?: number, refreshToken?: string) {
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token)
  setCookieToken(token)
  if (userId) localStorage.setItem(USER_ID_KEY, String(userId))
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

function clearProdAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  clearCookieToken()
}

function fetchJson(url: string, opts: RequestInit & { dontRedirectOnAuthError?: boolean; skipAuthHeader?: boolean } = {}) {
  const { dontRedirectOnAuthError, skipAuthHeader, ...rest } = opts as any
  const auth = skipAuthHeader ? {} : authHeader()
  const headers = { ...(rest.headers || {}), ...auth, 'Content-Type': 'application/json' }
  return fetch(url, { ...rest, headers, credentials: 'include' }).then(async (res) => {
    if (!res.ok) {
      if ((res.status === 401 || res.status === 403) && !dontRedirectOnAuthError) {
        // przy problemach z autoryzacją - wyczyść auth po stronie klienta
        try { clearProdAuth() } catch { }
      }
      const text = await res.text().catch(() => '')
      const message = text || res.statusText
      const err: any = new Error(message)
      err.status = res.status
      throw err
    }
    const contentType = res.headers.get('content-type') || ''
    const contentLength = res.headers.get('content-length')
    const hasBody = (contentLength && Number(contentLength) > 0) || contentType.includes('application/json')
    if (res.status === 204 || !hasBody) return null
    return res.json()
  })
}

export async function login(email?: string, password?: string): Promise<{ success: boolean; token?: string; refreshToken?: string; userId?: number; message?: string }> {
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
  if (res?.token) setProdAuth(res.token, res.userId, res?.refreshToken)
  if (res?.refreshToken) setRefreshToken(res.refreshToken)
  return res
}

export async function register(payload: { username: string; password: string; email: string }) {
  if (OFFLINE) return Promise.resolve({ success: true, message: 'Zarejestrowano lokalnie (mock)' })
  const res = await fetchJson(`${AUTH_BASE}/register`, { method: 'POST', body: JSON.stringify(payload) })
  if (res?.token) setProdAuth(res.token, res.userId, res?.refreshToken)
  if (res?.refreshToken) setRefreshToken(res.refreshToken)
  return res
}

export async function refreshAuth(refreshToken?: string) {
  if (OFFLINE) return Promise.resolve({ token: 'dev-token' })
  // Prefer stored refresh token, then fallback to provided token, then to current access token
  const stored = getRefreshToken()
  const tokenToSend = stored ?? refreshToken ?? getToken()
  if (!tokenToSend) return Promise.resolve({ success: false, message: 'No token available for refresh' })
  const res = await fetchJson(`${AUTH_BASE}/refresh`, { method: 'POST', body: JSON.stringify({ refreshToken: tokenToSend }) })
  if (res?.token) {
    setProdAuth(res.token, res.userId, res?.refreshToken)
    if (res?.refreshToken) setRefreshToken(res.refreshToken)
  }
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

export function parseJwtPayload(token: string | null): any | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch (e) {
    try {
      // Fallback without decodeURIComponent/escape for environments where it's not available
      const parts = token.split('.')
      const payload = parts[1]
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    } catch (err) {
      return null
    }
  }
}

export function getUserId(): number | null {
  if (OFFLINE) return Number(localStorage.getItem(DEV_USER_ID_KEY) ?? 1)
  const val = localStorage.getItem(USER_ID_KEY)
  if (val) return Number(val)
  // Spróbuj wyciągnąć z tokena (sub) i zapisz do localStorage
  const token = getToken()
  const payload = parseJwtPayload(token)
  if (payload) {
    // W backendzie subject (sub) jest ustawiony na user id (Long -> string)
    const sub = payload.sub ?? payload.userId ?? payload.user_id ?? null
    if (sub) {
      const uid = Number(sub)
      if (!Number.isNaN(uid)) {
        localStorage.setItem(USER_ID_KEY, String(uid))
        return uid
      }
    }
  }
  return null
}

// --- NEW: role helpers for UI (UX-only) ---
export function getUserRoles(): string[] {
  if (OFFLINE) return []
  const token = getToken()
  const payload = parseJwtPayload(token)
  if (!payload) return []
  // możliwe klucze: roles (array), authorities, role
  let rolesRaw: any = payload.roles ?? payload.authorities ?? payload.authority ?? payload.role ?? null
  if (!rolesRaw) return []
  let roles: string[] = []
  if (Array.isArray(rolesRaw)) {
    roles = rolesRaw.map((r) => String(r))
  } else if (typeof rolesRaw === 'string') {
    // może być 'ROLE_USER' lub 'ROLE_USER ROLE_OTHER' lub CSV
    roles = rolesRaw.split(/[ ,]+/).filter(Boolean)
  } else {
    try {
      roles = JSON.parse(String(rolesRaw))
      if (!Array.isArray(roles)) roles = [String(rolesRaw)]
    } catch {
      roles = [String(rolesRaw)]
    }
  }
  // Normalizacja: dodaj prefix ROLE_ jeśli go brakuje
  roles = roles.map((r) => (r.startsWith('ROLE_') ? r : `ROLE_${r}`))
  return roles
}

export function hasRole(roleName: string): boolean {
  const roles = getUserRoles()
  const normalized = roleName.startsWith('ROLE_') ? roleName : `ROLE_${roleName}`
  return roles.some((r) => r === normalized)
}

export function hasOnlyRoleUser(): boolean {
  const roles = getUserRoles()
  if (roles.length === 0) return true // brak tokena traktujemy jako nieuprzywilejowany
  if (roles.length === 1) {
    const r = roles[0]
    return r === 'ROLE_USER' || r === 'USER'
  }
  return false
}

export function authHeader(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// --- helpers/exports missing earlier ---
export function setToken(token: string) {
  if (OFFLINE) {
    // keep dev token in dev storage
    const userId = Number(localStorage.getItem(DEV_USER_ID_KEY) ?? 1)
    setDevAuth(token, userId)
    return
  }
  setProdAuth(token)
}

export function setUserId(id: number) {
  if (OFFLINE) {
    localStorage.setItem(DEV_USER_ID_KEY, String(id))
    return
  }
  localStorage.setItem(USER_ID_KEY, String(id))
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token?: string) {
  if (!token) return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

function setCookieToken(token: string) {
  try {
    if (typeof document === 'undefined') return
    // ustaw cookie na 1 dzień
    const maxAge = 24 * 60 * 60
    document.cookie = `${COOKIE_TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  } catch { /* ignore */ }
}

function readCookieToken(): string | null {
  try {
    if (typeof document === 'undefined') return null
    const v = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_TOKEN_KEY}=`))
    if (!v) return null
    return decodeURIComponent(v.split('=')[1] || '')
  } catch { return null }
}

function clearCookieToken() {
  try {
    if (typeof document === 'undefined') return
    document.cookie = `${COOKIE_TOKEN_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  } catch { /* ignore */ }
}
