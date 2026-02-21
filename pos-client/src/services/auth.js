import api from './api';
import CookieService from './cookie';
import authStore from '../stores/authStore';

//Cookie expire time
// const expiresAt = 86400;

const options = {
  path: '/',
  // domain: '173.82.240.210',
  // expires: new Date(Date.now() + expiresAt),
};

class AuthService {
  async doUserLogin(credentials) {
    console.log(credentials); 
    try {
      const response = await api.post('login').values(credentials);
      return response.data;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async handleLoginSuccess(response) {
    // response is the API body (doUserLogin returns response.data), so use response.token / response.user
    const data = response?.data ?? response;
    const token = data.token;
    const user = data.user;
    if (!token || !user) {
      console.error('Login response missing token or user', data);
      return;
    }
    CookieService.set('access_token', token);
    CookieService.set('user_id', user.id);
    CookieService.set('user_name', user.name);
    CookieService.set('role_id', user.role?.id);
    CookieService.set('role_name', user.role?.name ?? '');
    const tokenOnly = token
      .toString()
      .substring(parseInt(token.toString().indexOf('|'), 10) + 1);
    CookieService.set('access_token', tokenOnly, options);
  }

  // async saveUserDetails(userDet) {
  //   console.log(userDet['user_data']);
  //   CookieService.set('user_id', userDet.user_data[0].id, options);
  //   CookieService.set('user_email', userDet.user_data[0].email, options);
  //   CookieService.set('user_branch', userDet.user_data[0].branch_id, options);
  //   CookieService.set('user_branch_name',userDet.user_data[0].branch.name,options,); 
  //   CookieService.set('user_name', userDet.user_data[0].name, options);
  //   // CookieService.set('user_roles',userDet.user_data[0].roles.map((role) => {
  //   //   return role.id;
  //   // }),options,);
  //   // CookieService.set('user_role_name',userDet.user_data[0].roles.map((role) => {
  //   //   return role.name;
  //   // }),options,);
  //   CookieService.set(
  //     'user_roles',
  //     userDet.user_data[0].role.role_id,
  //     //   userDet.user_data[0].role.map((role) => {
  //     //     return role.id;
  //     //   }),
  //     options,
  //   );

  //   CookieService.set(
  //     'user_role_name',
  //     //   userDet.user_data[0].role.map((role) => {
  //     //     return role.name;
  //     //   }),
  //     userDet.user_data[0].role.role_name.name,
  //     options,
  //   );
  //   CookieService.set('permissions', userDet.permissions);
  // }

  async signOutUser() {
    await api.post('logout').values(CookieService.get('user_id'));

    this.clearLocalStorage().then(() => {
      window.location.reload();
    });
  }

  async clearLocalStorage() {
    return new Promise((resolve, reject) => {
      authStore.clearAuth();
      CookieService.remove('access_token', options);
      CookieService.remove('user_id', options);
      CookieService.remove('user_email', options);
      CookieService.remove('user_branch', options);
      CookieService.remove('user_branch_name', options);
      CookieService.remove('user_name', options);
      CookieService.remove('user_roles', options);
      CookieService.remove('user_role_name', options);
      CookieService.remove('permissions', options);

      resolve();
    });
  }
}

export default new AuthService();
