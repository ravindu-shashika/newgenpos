/**
 * generalSettingStore.js
 *
 * Fetches and caches the application's general settings from the backend.
 * Pattern matches authStore / roleStore (plain JS module, no external state lib).
 *
 * Usage:
 *   import generalSettingStore from '../stores/generalSettingStore';
 *
 *   // Read current cached value (may be null before first fetch)
 *   const setting = generalSettingStore.getSetting();
 *
 *   // Trigger a fetch (called once in App.jsx after login)
 *   await generalSettingStore.fetchSetting();
 *
 *   // React component: subscribe to updates
 *   useEffect(() => {
 *     return generalSettingStore.subscribe(setSetting);
 *   }, []);
 */
import api from '../services/api';

const state = {
  setting: null,
  loading: false,
};

const listeners = new Set();

function emitChange() {
  const snap = getState();
  listeners.forEach((fn) => fn(snap));
}

export function getState() {
  return { setting: state.setting, loading: state.loading };
}

export function getSetting() {
  return state.setting;
}

/**
 * Subscribe to store changes.
 * @param {function} listener  Called with { setting, loading }
 * @returns {function} unsubscribe
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Fetch general settings from the API and cache them.
 * Endpoint: GET /api/generalsettings
 */
export async function fetchSetting() {
  if (state.loading) return state.setting; // prevent duplicate in-flight calls
  state.loading = true;
  emitChange();
  try {
    const res = await api.get('generalsettings');
    const data = res?.data?.general_setting ?? res?.data?.data ?? res?.data ?? null;
    state.setting = data && typeof data === 'object' ? data : null;
  } catch (err) {
    console.error('generalSettingStore.fetchSetting error', err);
    state.setting = null;
  } finally {
    state.loading = false;
    emitChange();
  }
  return state.setting;
}

/** Force-set from outside (e.g. after a settings save) */
export function setSetting(setting) {
  state.setting = setting;
  emitChange();
}

/** Helper: get a specific key with an optional default */
export function get(key, fallback = null) {
  return state.setting?.[key] ?? fallback;
}

/** Helper: check if a module is enabled (comma-separated "modules" field) */
export function hasModule(module) {
  const modules = (state.setting?.modules ?? '').split(',').map((m) => m.trim());
  return modules.includes(module);
}

const generalSettingStore = {
  getState,
  getSetting,
  subscribe,
  fetchSetting,
  setSetting,
  get,
  hasModule,
};

export default generalSettingStore;
