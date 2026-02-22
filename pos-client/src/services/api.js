import axios from 'axios';
import CookieService from './cookie';


const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: CookieService.get('access_token')
    ? `Bearer ${CookieService.get('access_token')}`
    : null,
};

/**
 * API base URL. In Vite, set VITE_APP_DEFAULT_PATH in .env (e.g. http://127.0.0.1:8000).
 * Only env vars prefixed with VITE_ are exposed to the client.
 */
const basePath = 'http://127.0.0.1:8000';
const defaultPath = `${basePath}/api`;
const imagePath = `${basePath}/storage/images/`;
const defApiPath = basePath;


// const imagePath = 'http://127.0.0.1:8000/storage/images/';

export default {
  async get(url) {
    try {
      const res = await axios.get(`${defaultPath}/${url}`, {
        headers: defaultHeaders,
      });
      return res;
    } catch (err) {
      return { error: err.response.data.errors };
    }
  },

  async getapi(url) {
    try {
      const res = await axios.get(`${defApiPath}/${url}`, {
        headers: defaultHeaders,
      });
      return res;
    } catch (err) {
      return { error: err.response.data.errors };
    }
  },

  // post(url) {
  //   return {
  //     values:  (data) => {
  //       return new Promise((resolve, reject)=>{
  //         const res =  axios.post(`${defaultPath}/${url}`, data, {
  //           headers: defaultHeaders,
  //         });
  //           res.then(response => {
  //             resolve(response.data)
  //           });
  //           res.catch(error => {
  //             reject(error.response.data)
  //           });
  //         });
  //     },
  //   };
  // },

  post(url) {
    return {
      values: async (data) => {
        try {
          const res = await axios.post(`${defaultPath}/${url}`, data, {
            headers: defaultHeaders,
          });
          return res;
        } catch (err) {
          return err;
        }
      },
    };
  },

  /** POST with FormData (e.g. file upload). Omits Content-Type so axios sets multipart/form-data. */
  postFormData(url) {
    return {
      values: async (formData) => {
        try {
          const headers = { ...defaultHeaders };
          delete headers['Content-Type'];
          const res = await axios.post(`${defaultPath}/${url}`, formData, { headers });
          return res;
        } catch (err) {
          return err;
        }
      },
    };
  },

  update(url) {
    return {
      values: async (data) => {
        try {
          const res = await axios.post(`${defaultPath}/${url}`, data, {
            headers: defaultHeaders,
          });
          return res;
        } catch (err) {
          return { error: err.response.data.errors };
        }
      },
    };
  },

  put(url, id) {
    return {
      values: async (data) => {
        try {
          const res = await axios.put(`${defaultPath}/${url}/${id}`, data, {
            headers: defaultHeaders,
          });
          return res;
        } catch (err) { 
          return { error: err.response.data.errors };
        }
      },
    };
  },

  async delete(url) {
    try {
      const res = await axios.delete(`${defaultPath}/${url}`, {
        headers: defaultHeaders,
      });
      return res;
    } catch (err) {
      return { error: err.response.data.errors };
    }
  },

  getMainImagePath() {
    return imagePath;
  },
};
