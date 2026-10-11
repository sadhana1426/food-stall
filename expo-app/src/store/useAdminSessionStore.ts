import { create } from 'zustand';

interface AdminSessionState {
  token: string | null;
  expiresAt: string | null;
  setSession: (token: string | null, expiresAt?: string | null) => void;
  clearSession: () => void;
}

export const useAdminSessionStore = create<AdminSessionState>((set) => ({
  token: null,
  expiresAt: null,
  setSession: (token, expiresAt = null) => set({ token, expiresAt }),
  clearSession: () => set({ token: null, expiresAt: null }),
}));
