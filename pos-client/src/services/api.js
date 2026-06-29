import axios from 'axios';
import CookieService from './cookie';
import { getToken, clearToken } from './tokenStorage';
import msg from './alerts';
import authStore from '../stores/authStore';
import { permissionsBypassed } from '../config/permissions';

const COOKIE_OPTS = { path: '/' };

function resolveServerBase() {
  if (import.meta.env.VITE_APP_DEFAULT_PATH) {
    return String(import.meta.env.VITE_APP_DEFAULT_PATH).replace(/\/$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000';
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:8000';
}

const serverBase = resolveServerBase();
export const defaultPath = `${serverBase}/api`;
export const posApiPath = `${serverBase}/pos`;
const imagePath = `${serverBase}/storage/images/`;
const defApiPath = serverBase;

/** Laravel `public/` asset base (images, logo, downloads, …). */
export function getServerBase() {
  return serverBase;
}

export function brandImageUrl(filename) {
  if (!filename) return null;
  const value = String(filename).trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${serverBase}/images/brand/${value}`;
}

function buildHeaders(extra = {}, { multipart = false } = {}) {
  const token = getToken();
  const csrfToken = CookieService.get('XSRF-TOKEN');

  const headers = {
    Accept: 'application/json',
    ...extra,
  };

  if (multipart) {
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
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
}

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
  const path = url.replace(/^\//, '');
  return `${base}/${path}`;
}

async function axiosRequest(method, url, data, config = {}, base = defaultPath) {
  const isMultipart = data instanceof FormData;
  const headers = {
    ...buildHeaders(config.headers || {}, { multipart: isMultipart }),
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

  put(url, data, config) {
    if (data === undefined) {
      return {
        values: async (payload) => axiosRequest('put', url, payload, config),
      };
    }
    return axiosRequest('put', url, data, config);
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

  update(url) {
    return {
      values: async (payload) => axiosRequest('post', url, payload),
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

/** Web POS + shared catalog routes at `/pos` (not `/api/pos`). */
export const posApi = {
  get(url, config = {}) {
    return axiosRequest('get', url, undefined, config, posApiPath);
  },
  post(url, data, config = {}) {
    return axiosRequest('post', url, data, config, posApiPath);
  },
};

export default api;
