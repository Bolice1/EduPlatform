import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

function safeParseJSON(str, fallback) {
  try {
    if (!str) return fallback;
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function getInitialAuth() {
  try {
    const persistedAuth = {
      user: safeParseJSON(localStorage.getItem('user'), null),
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refreshToken'),
      loading: false,
      error: null,
      isInitialized: true, // Mark as initialized after loading from storage
    };
    return persistedAuth;
  } catch {
    return {
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,
      isInitialized: true,
    };
  }
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const refreshToken = createAsyncThunk('auth/refresh', async (_, { getState }) => {
  const refresh = getState().auth.refreshToken;
  if (!refresh) throw new Error('No refresh token');
  const { data } = await api.post('/auth/refresh', { refreshToken: refresh });
  return data;
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { getState }) => {
  const token = getState().auth.token;
  if (!token) throw new Error('No token');
  const { data } = await api.get('/auth/me');
  return data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuth(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isInitialized = true; // Stay initialized after logout
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      } catch (e) {}
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuth: (state, action) => {
      if (!action.payload) {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        return;
      }
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      try {
        if (action.payload.accessToken) localStorage.setItem('token', action.payload.accessToken);
        if (action.payload.refreshToken) localStorage.setItem('refreshToken', action.payload.refreshToken);
        if (action.payload.user) localStorage.setItem('user', JSON.stringify(action.payload.user));
      } catch (e) {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.error = null;
        state.isInitialized = true;
        try {
          localStorage.setItem('token', action.payload.accessToken);
          localStorage.setItem('refreshToken', action.payload.refreshToken);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        } catch (e) {}
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Login failed';
        state.isInitialized = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.isInitialized = true;
        try {
          localStorage.setItem('token', action.payload.accessToken);
          localStorage.setItem('refreshToken', action.payload.refreshToken);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        } catch (e) {}
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isInitialized = true;
        try {
          localStorage.setItem('user', JSON.stringify(action.payload));
        } catch (e) {}
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.isInitialized = true;
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
        } catch (e) {}
      });
  },
});

export const { logout, clearError, setAuth } = authSlice.actions;
export default authSlice.reducer;
