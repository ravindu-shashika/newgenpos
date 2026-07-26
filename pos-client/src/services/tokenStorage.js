import CookieService from './cookie';

const TOKEN_KEY = 'access_token';

/**
 * Browser-session cookies only (no maxAge/expires).
 * Cleared when the browser process is closed — next open requires login.
 */
export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
};

/** @deprecated Use SESSION_COOKIE_OPTIONS — auth is no longer persisted across browser restarts. */
export const PERSISTENT_COOKIE_OPTIONS = SESSION_COOKIE_OPTIONS;

function readSessionStorage() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeSessionStorage(value) {
  try {
    sessionStorage.setItem(TOKEN_KEY, value);
  } catch {
    // private mode / quota
  }
}

function removeSessionStorage() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Drop legacy localStorage token that survived PC reboot / browser close. */
function removeLegacyLocalStorageToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Read Sanctum Bearer token (cookie first, then sessionStorage). */
export function getToken() {
  const fromCookie = CookieService.get(TOKEN_KEY);
  if (fromCookie) return String(fromCookie);

  const fromSession = readSessionStorage();
  return fromSession ? String(fromSession) : null;
}

/** Store token for this browser session only (cookie + sessionStorage). */
export function setToken(token) {
  if (!token) return;
  const value = String(token);
  CookieService.set(TOKEN_KEY, value, SESSION_COOKIE_OPTIONS);
  writeSessionStorage(value);
  removeLegacyLocalStorageToken();
}

/** Remove token on logout. */
export function clearToken() {
  CookieService.remove(TOKEN_KEY, { path: '/' });
  removeSessionStorage();
  removeLegacyLocalStorageToken();
}

/**
 * Restore session on app boot for the current browser process only.
 * - Does not restore from localStorage (that survived overnight / PC off).
 * - Rewrites any old long-lived cookie as a session cookie.
 */
export function restoreSessionToken() {
  removeLegacyLocalStorageToken();

  const fromCookie = CookieService.get(TOKEN_KEY);
  if (fromCookie) {
    const value = String(fromCookie);
    // Ensure cookie is session-scoped (migrates old 30-day cookies).
    CookieService.set(TOKEN_KEY, value, SESSION_COOKIE_OPTIONS);
    writeSessionStorage(value);
    return value;
  }

  const fromSession = readSessionStorage();
  if (fromSession) {
    const value = String(fromSession);
    CookieService.set(TOKEN_KEY, value, SESSION_COOKIE_OPTIONS);
    return value;
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
  SESSION_COOKIE_OPTIONS,
  PERSISTENT_COOKIE_OPTIONS,
};
