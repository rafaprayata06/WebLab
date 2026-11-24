



import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  loginUser,
  getCurrentUser,
  logoutUser as clearAuthStorage,
} from './authService';

// ==========================================
// LOGIN
// ==========================================
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginUser(credentials);

      if (!data.accessToken || !data.user) {
        throw new Error('Respons login dari server tidak valid.');
      }

      localStorage.setItem('accessToken', data.accessToken);

      return {
        accessToken: data.accessToken,
        user: data.user,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ==========================================
// INITIALIZE AUTH
// Memulihkan sesi ketika halaman di-refresh
// ==========================================
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        return null;
      }

      const data = await getCurrentUser(accessToken);

      return {
        accessToken,
        user: data.user,
      };
    } catch (error) {
      clearAuthStorage();
      return rejectWithValue(error.message);
    }
  }
);

// ==========================================
// LOGOUT
// ==========================================
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    clearAuthStorage();
    return null;
  }
);

// ==========================================
// INITIAL STATE
// ==========================================
const initialState = {
  user: null,
  accessToken: null,

  isAuthenticated: false,
  isInitialized: false,

  initializationStatus: 'idle',
  loginStatus: 'idle',

  error: null,
};

// ==========================================
// AUTH SLICE
// ==========================================
const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    clearAuthError: (state) => {
      state.error = null;
      state.loginStatus = 'idle';
    },

    // Sinkronkan status onboarding di Redux setelah API berhasil.
    markOnboardingCompleted: (state) => {
      if (state.user) {
        state.user.onboarding_completed = true;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // LOGIN PENDING
      .addCase(login.pending, (state) => {
        state.loginStatus = 'loading';
        state.error = null;
      })

      // LOGIN SUCCESS
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;

        state.isAuthenticated = true;
        state.isInitialized = true;

        state.loginStatus = 'succeeded';
        state.error = null;
      })

      // LOGIN FAILED
      .addCase(login.rejected, (state, action) => {
        state.loginStatus = 'failed';
        state.error = action.payload || 'Login gagal.';
      })

      // INITIALIZE PENDING
      .addCase(initializeAuth.pending, (state) => {
        state.initializationStatus = 'loading';
      })

      // INITIALIZE SUCCESS
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initializationStatus = 'succeeded';
        state.isInitialized = true;

        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
        }
      })

      // INITIALIZE FAILED
      .addCase(initializeAuth.rejected, (state) => {
        state.initializationStatus = 'failed';
        state.isInitialized = true;

        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      // LOGOUT SUCCESS
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;

        state.isAuthenticated = false;
        state.isInitialized = true;

        state.loginStatus = 'idle';
        state.error = null;
      });
  },
});

export const {
  clearAuthError,
  markOnboardingCompleted,
} = authSlice.actions;

export default authSlice.reducer;





