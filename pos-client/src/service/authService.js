import api from './api';

export const login = async (email, password) => {
    return api.post('login', { email, password });
};

export const logout = async () => {
    return api.post('logout');
};

export const getUser = async () => {
    return api.get('user');
};

export const isAuthenticated = async () => {
    const user = await getUser();
    return !!user;
};
