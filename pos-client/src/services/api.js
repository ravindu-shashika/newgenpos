import axios from 'axios';
import CookieService from './cookie';
import { getToken, clearToken } from './tokenStorage';
import msg from './alerts';
import authStore from '../stores/authStore';
import { permissionsBypassed } from '../config/permissions';

const COOKIE_OPTS = { path: '/' };

const env = import.meta.env;
const DEFAULT_PATH =
  env.VITE_APP_DEFAULT_PATH ||
  env.REACT_APP_DEFAULT_PATH ||
  (typeof process !== 'undefined' ? process.env.REACT_APP_DEFAULT_PATH : '') ||
  'http://192.168.1.3:8000';

function normalizeUrl(raw) {
  let base = String(raw).trim().replace(/\/$/, '');

  if (!/^https?:\/\//i.test(base) && !base.startsWith('/')) {
    const protocol =
      typeof window !== 'undefined' && window.location?.protocol === 'http:'
        ? 'http'
        : 'https';
    base = `${protocol}://${base}`;
  }

  return base.replace(/\/$/, '');
}

/** Laravel app root (cPanel: https://pos.newgenideas.com/api). */
function resolveAppRoot() {
  const base = normalizeUrl(DEFAULT_PATH);
  if (/\/api\/api$/i.test(base)) {
    return base.replace(/\/api$/i, '');
  }
  if (/\/api$/i.test(base)) {
    return base;
  }
  return base;
}

/**
 * API route base for routes/api.php.
 * cPanel …/api + Laravel /api prefix → …/api/api/login
 */
function resolveDefaultPath() {
  const base = normalizeUrl(DEFAULT_PATH);
  if (/\/api\/api$/i.test(base)) {
    return base;
  }
  const appRoot = resolveAppRoot();
  return `${appRoot}/api`;
}

const appRoot = resolveAppRoot();
export const defaultPath = resolveDefaultPath();
export const posApiPath = `${appRoot}/pos`;
const imagePath = `${appRoot}/storage/images/`;
const defApiPath = appRoot;

export function getServerBase() {
  return appRoot;
}

export function brandImageUrl(filename) {
  if (!filename) return null;
  const value = String(filename).trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${appRoot}/images/brand/${value}`;
}

const getHeaders = (extra = {}, { multipart = false } = {}) => {
  const token = getToken() || CookieService.get('access_token');
  const csrfToken = CookieService.get('XSRF-TOKEN');

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  };

  if (multipart) {
    delete headers['Content-Type'];
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const branch = CookieService.get('user_branch_code');
  const cluster = CookieService.get('cluster');
  if (branch) headers.branch = branch;
  if (cluster) headers.cluster = cluster;

  return headers;
};

export function signOut() {
  authStore.clearAuth();
  clearToken();
  CookieService.remove('access_token', COOKIE_OPTS);
  CookieService.remove('user_id', COOKIE_OPTS);
  CookieService.remove('user_name', COOKIE_OPTS);
  CookieService.remove('user_branch', COOKIE_OPTS);
  CookieService.remove('user_branch_code', COOKIE_OPTS);
  CookieService.remove('cluster', COOKIE_OPTS);
  CookieService.remove('role_id', COOKIE_OPTS);
  CookieService.remove('role_name', COOKIE_OPTS);
  window.location.reload();
}

function handleForbidden(response) {
  if (permissionsBypassed()) return;
  if (response?.status === 200 && response?.data?.status === 403) {
    msg.error(
      'You are not authorized to perform this action. Please contact your administrator.'
    );
  }
}

function handleUnauthorized(err) {
  if (err?.response?.status === 401) {
    signOut();
  }
}

function formatAxiosError(err) {
  const data = err?.response?.data;
  return {
    message: data?.message || err?.message || 'Request failed',
    errors: data?.errors || data?.error || null,
    status: err?.response?.status,
    response: err?.response,
    error: err,
  };
}

function resolveUrl(url, base = defaultPath) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${base}/${url.replace(/^\//, '')}`;
}

async function axiosRequest(method, url, data, config = {}, base = defaultPath) {
  const isMultipart = data instanceof FormData;
  const headers = {
    ...getHeaders(config.headers || {}, { multipart: isMultipart }),
    ...(config.headers || {}),
  };
  if (isMultipart) {
    delete headers['Content-Type'];
  }

  try {
    const response = await axios({
      method,
      url: resolveUrl(url, base),
      data,
      ...config,
      headers,
    });
    handleForbidden(response);
    return response;
  } catch (err) {
    handleUnauthorized(err);
    throw formatAxiosError(err);
  }
}

const api = {
  defaultPath,
  getToken,
  signOut,

  async get(url, config = {}) {
    return axiosRequest('get', url, undefined, config);
  },

  post(url, data, config) {
    if (data === undefined) {
      return {
        values: async (payload) => axiosRequest('post', url, payload, config),
      };
    }
    return axiosRequest('post', url, data, config);
  },

  async postNew(url, data) {
    return axiosRequest('post', url, data);
  },

  put(url, data, config) {
    if (data === undefined) {
      return {
        values: async (payload) => axiosRequest('put', url, payload, config),
      };
    }
    return axiosRequest('put', url, data, config);
  },

  patch(url, id) {
    return {
      values: async (data) => axiosRequest('patch', `${url}/${id}`, data),
    };
  },

  update(url) {
    return {
      values: async (data) => axiosRequest('post', url, data),
    };
  },

  async delete(url, config = {}) {
    return axiosRequest('delete', url, undefined, config);
  },

  async postFile(url, data) {
    return axiosRequest('post', url, data, {}, defaultPath);
  },

  async postMultipart(url, data) {
    return axiosRequest('post', url, data, {}, defaultPath);
  },

  postFormData(url) {
    return {
      values: async (formData) => axiosRequest('post', url, formData),
    };
  },

  async getapi(url, config = {}) {
    return axiosRequest('get', url, undefined, config, defApiPath);
  },

  async postapi(url, data, config = {}) {
    return axiosRequest('post', url, data, config, defApiPath);
  },

  async putapi(url, data, config = {}) {
    return axiosRequest('put', url, data, config, defApiPath);
  },

  async deleteapi(url, config = {}) {
    return axiosRequest('delete', url, undefined, config, defApiPath);
  },

  getMainImagePath() {
    return imagePath;
  },
};

export const posApi = {
  get(url, config = {}) {
    return axiosRequest('get', url, undefined, config, posApiPath);
  },
  post(url, data, config = {}) {
    return axiosRequest('post', url, data, config, posApiPath);
  },
};

export default api;
