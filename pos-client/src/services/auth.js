import api from './api';
import CookieService from './cookie';
import { setToken, clearToken } from './tokenStorage';
import authStore from '../stores/authStore';

const options = {
  path: '/',
};

class AuthService {
  async doUserLogin(credentials) {
    try {
      const response = await api.post('login', credentials);
      return response;
    } catch (err) {
      console.error('Login error:', err);
      return {
        status: 200,
        data: {
          status: err?.status ?? 500,
          message: err?.message || 'Invalid username or password',
          error: err?.errors || [],
        },
      };
    }
  }

  async handleLoginSuccess(response) {
    const data = response?.data ?? response;
    const token = data.token;
    const user = data.user;
    if (!token || !user) {
      console.error('Login response missing token or user', data);
      return;
    }

    setToken(token);

    CookieService.set('user_id', user.id, options);
    CookieService.set('user_name', user.name, options);
    CookieService.set('role_id', user.role_id ?? user.role?.id, options);
    CookieService.set('role_name', user.role?.name ?? '', options);
  }

  async signOutUser() {
    try {
      await api.post('logout', { user_id: CookieService.get('user_id') });
    } catch {
      // clear local session even if API fails
    }
    await this.clearLocalStorage();
    window.location.reload();
  }

  async clearLocalStorage() {
    authStore.clearAuth();
    clearToken();
    CookieService.remove('user_id', options);
    CookieService.remove('user_email', options);
    CookieService.remove('user_branch', options);
    CookieService.remove('user_branch_name', options);
    CookieService.remove('user_name', options);
    CookieService.remove('user_roles', options);
    CookieService.remove('user_role_name', options);
    CookieService.remove('permissions', options);
  }
}

export default new AuthService();
