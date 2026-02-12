import axios from 'axios';
import Cookies from 'js-cookie';
import { useToast } from 'primevue/usetoast';
// axios.defaults.withCredentials = true;
const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: Cookies.get('access_token') ? `Bearer ${Cookies.get('access_token')}` : null
};

const SignOut = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_branch');
    window.location.reload();
    // router.push('/');
};
let defaultPath = '';

if (process.env.NODE_ENV === 'development') {
    defaultPath = `${'http://127.0.0.1:8000/api'}`;
} else {
    defaultPath = `${'http://91.99.25.152/janasiri_stores/api'}/api`;
    console.log('lll');
}
export default {
    async post(url, data) {
        const headers = data instanceof FormData
            ? { Accept: 'application/json', Authorization: defaultHeaders.Authorization }
            : defaultHeaders;
        const response = await axios.post(`${defaultPath}/${url}`, data, {
            headers
        });
        return response;
    },

    async get(url) {
        try {
            const res = await axios.get(`${defaultPath}/${url}`, {
                headers: defaultHeaders
            });
            return res;
        } catch (err) {
            if (err.status == 401) {
                SignOut();
            }

            return { error: err };
            // return { error: err.response.data.errors };
        }
    },

    async delete(url) {
        try {
            const res = await axios.delete(`${defaultPath}/${url}`, {
                headers: defaultHeaders
            });
            return res;
        } catch (err) {
            if (err.status == 401) {
                SignOut();
            }
            return { error: err };
        }
    }
};

export const API_BASE_URL = defaultPath;
export const ASSET_BASE_URL = defaultPath.replace(/\/api$/, '');
