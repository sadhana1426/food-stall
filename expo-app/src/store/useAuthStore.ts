import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  user: any | null;
  business: any | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  hydrateSession: () => Promise<void>;
  login: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (accessToken: string) => void;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  business: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrating: true,

  hydrateSession: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        set({ accessToken, isAuthenticated: true });
        try {
          const { authApi } = require('../api/authApi');
          const data = await authApi.getMe();
          set({ user: data });
        } catch (e) {
          console.error("Hydration failed to fetch me", e);
        }
      }
    } catch (error) {
      console.error('Error hydrating session:', error);
    } finally {
      set({ isHydrating: false });
    }
  },

  login: async ({ accessToken, refreshToken }) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ accessToken, isAuthenticated: true });
    try {
      const { authApi } = require('../api/authApi');
      const data = await authApi.getMe();
      set({ user: data });
    } catch (e) {}
  },

  logout: async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      try {
        const { authApi } = require('../api/authApi');
        await authApi.logout(refreshToken);
      } catch (e) {}
    }
    await get().clearSession();
  },

  setSession: (accessToken: string) => {
    set({ accessToken, isAuthenticated: true });
  },

  clearSession: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ accessToken: null, isAuthenticated: false, user: null, business: null });
  },
}));
