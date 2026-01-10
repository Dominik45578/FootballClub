// Prostý mock auth dla deva.
const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'

// Klucze w localStorage dla dev
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
  // W trybie online tu powinien być realny flow (fetch do identity)
  return Promise.resolve({ success: false, message: 'Brak implementacji online' })
}

export function logout() {
  if (OFFLINE) {
    clearDevAuth()
    return
  }
  // realny logout
  clearDevAuth()
}

export function getToken(): string | null {
  if (OFFLINE) return localStorage.getItem(DEV_TOKEN_KEY) ?? null
  // production: read from cookie/localStorage after real login
  return null
}

export function getUserId(): number | null {
  if (OFFLINE) return Number(localStorage.getItem(DEV_USER_ID_KEY) ?? 1)
  return null
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
    // production: store token appropriately (cookie/localStorage)
    localStorage.setItem(DEV_TOKEN_KEY, token)
  }
}

export { OFFLINE }
