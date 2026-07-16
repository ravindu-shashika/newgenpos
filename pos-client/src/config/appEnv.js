/**
 * Runtime app URL / domain — uses window.location in the browser.
 *
 * VITE_APP_DOMAIN / REACT_APP_DOMAIN in .env are optional dev fallbacks only.
 * In the browser, domain always comes from window.location.hostname.
 *
 * API base (cPanel /api folder): window.location.origin + '/api'
 */

function trimPath(value) {
  return String(value ?? '').trim().replace(/\/$/, '');
}

function isLocalHost(hostname) {
  return !hostname || hostname === 'localhost' || hostname === '127.0.0.1';
}

function readBrowserLocation() {
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }
  const { protocol, host, hostname, origin } = window.location;
  return { protocol, host, hostname, origin };
}

/**
 * Current site domain — same as auto VITE_APP_DOMAIN / REACT_APP_DOMAIN.
 * @returns {string} e.g. pos.newgenideas.com
 */
export function getAppDomain() {
  const loc = readBrowserLocation();
  if (loc?.hostname) {
    return loc.hostname;
  }

  const env = import.meta.env;
  return trimPath(env.VITE_APP_DOMAIN || env.REACT_APP_DOMAIN) || 'localhost';
}

/**
 * Laravel app root under /api on same host.
 * @returns {string} e.g. https://pos.newgenideas.com/api
 */
export function getAppDefaultPath() {
  const loc = readBrowserLocation();
  if (loc?.host && !isLocalHost(loc.hostname)) {
    return `${loc.protocol}//${loc.host}/api`;
  }

  const env = import.meta.env;
  const fromEnv =
    env.VITE_APP_DEFAULT_PATH ||
    env.REACT_APP_DEFAULT_PATH ||
    (typeof process !== 'undefined' ? process.env.REACT_APP_DEFAULT_PATH : '');

  if (fromEnv && trimPath(fromEnv)) {
    return trimPath(fromEnv);
  }

  return 'http://127.0.0.1:8000';
}

/** Mirrors import.meta.env.VITE_APP_DOMAIN at runtime (window.location). */
export function getViteAppDomain() {
  return getAppDomain();
}

/** Mirrors process.env.REACT_APP_DOMAIN at runtime (window.location). */
export function getReactAppDomain() {
  return getAppDomain();
}

/**
 * Call once at app startup — exposes domain on window for legacy/scripts.
 */
export function initAppEnv() {
  const loc = readBrowserLocation();
  if (!loc) return;

  const domain = getAppDomain();
  const apiBase = getAppDefaultPath();

  window.__APP_DOMAIN__ = domain;
  window.__VITE_APP_DOMAIN__ = domain;
  window.__REACT_APP_DOMAIN__ = domain;
  window.__APP_DEFAULT_PATH__ = apiBase;
}

export const appDomain = getAppDomain();
export const appDefaultPath = getAppDefaultPath();
