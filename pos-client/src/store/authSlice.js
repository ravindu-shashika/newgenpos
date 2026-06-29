import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  permissions: [],
  loaded: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading(state, action) {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    setAuthData(state, action) {
      const { user = null, permissions = [] } = action.payload ?? {};
      state.user = user;
      state.permissions = Array.isArray(permissions) ? permissions : [];
      state.loaded = true;
      state.loading = false;
      state.error = null;
    },
    setAuthError(state, action) {
      state.error = action.payload ?? 'Failed to load permissions';
      state.loading = false;
    },
    clearAuthState(state) {
      state.user = null;
      state.permissions = [];
      state.loaded = false;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setAuthLoading, setAuthData, setAuthError, clearAuthState } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectPermissions = (state) => state.auth.permissions;
export const selectAuthLoaded = (state) => state.auth.loaded;
export const selectAuthLoading = (state) => state.auth.loading;

export default authSlice.reducer;
