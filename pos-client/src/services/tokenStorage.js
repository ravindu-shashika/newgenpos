import CookieService from './cookie';

const TOKEN_KEY = 'access_token';
const COOKIE_OPTIONS = { path: '/' };

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
  CookieService.set(TOKEN_KEY, value, COOKIE_OPTIONS);
  try {
    localStorage.setItem(TOKEN_KEY, value);
  } catch {
    // private mode / quota
  }
}

/** Remove token on logout. */
export function clearToken() {
  CookieService.remove(TOKEN_KEY, COOKIE_OPTIONS);
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Keep localStorage in sync when only cookie exists (e.g. after reload). */
export function syncTokenFromCookie() {
  const fromCookie = CookieService.get(TOKEN_KEY);
  if (!fromCookie) return null;
  try {
    localStorage.setItem(TOKEN_KEY, String(fromCookie));
  } catch {
    // ignore
  }
  return String(fromCookie);
}

export function hasToken() {
  return Boolean(getToken());
}

export default {
  getToken,
  setToken,
  clearToken,
  syncTokenFromCookie,
  hasToken,
};
