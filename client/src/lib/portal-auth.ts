/**
 * Sesión del Portal Avantrik (lado cliente).
 * El token viene firmado del servidor (/api/login); aquí solo se guarda,
 * se adjunta a las peticiones y se valida su expiración localmente.
 */

const KEY = "avantrik_portal_session";

export interface PortalSession {
  token: string;
  email: string;
  exp: number;
}

export function getSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PortalSession;
    if (!s?.token || !s?.exp || Date.now() >= s.exp) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: PortalSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function authHeaders(): Record<string, string> {
  const s = getSession();
  return s ? { Authorization: `Bearer ${s.token}` } : {};
}
