import CookieService from './cookie';

const TOKEN_KEY = 'access_token';
/** Keep session after browser close (30 days). */
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
export const PERSISTENT_COOKIE_OPTIONS = {
  path: '/',
  maxAge: TOKEN_MAX_AGE,
  sameSite: 'lax',
};

/** Read Sanctum Bearer token (cookie first, then localStorage). */
export function getToken() {
  const fromCookie = CookieService.get(TOKEN_KEY);
  if (fromCookie) return String(fromCookie);

  try {
    const fromStorage = localStorage.getItem(TOKEN_KEY);
    return fromStorage ? String(fromStorage) : null;
  } catch {
    return null;
  }
}

/** Persist token after login (cookie + localStorage). */
export function setToken(token) {
  if (!token) return;
  const value = String(token);
  CookieService.set(TOKEN_KEY, value, PERSISTENT_COOKIE_OPTIONS);
  try {
    localStorage.setItem(TOKEN_KEY, value);
  } catch {
    // private mode / quota
  }
}

/** Remove token on logout. */
export function clearToken() {
  CookieService.remove(TOKEN_KEY, { path: '/' });
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Restore session on app boot:
 * - cookie present → sync to localStorage
 * - cookie missing but localStorage has token → restore cookie (survives browser close)
 */
export function restoreSessionToken() {
  const fromCookie = CookieService.get(TOKEN_KEY);
  if (fromCookie) {
    const value = String(fromCookie);
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      // ignore
    }
    return value;
  }

  try {
    const fromStorage = localStorage.getItem(TOKEN_KEY);
    if (fromStorage) {
      const value = String(fromStorage);
      CookieService.set(TOKEN_KEY, value, PERSISTENT_COOKIE_OPTIONS);
      return value;
    }
  } catch {
    // ignore
  }

  return null;
}

/** @deprecated use restoreSessionToken */
export function syncTokenFromCookie() {
  return restoreSessionToken();
}

export function hasToken() {
  return Boolean(getToken());
}

export default {
  getToken,
  setToken,
  clearToken,
  restoreSessionToken,
  syncTokenFromCookie,
  hasToken,
  PERSISTENT_COOKIE_OPTIONS,
};
