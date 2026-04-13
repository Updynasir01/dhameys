// src/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, userApi } from '../lib/api';

interface User {
  id: string; email: string; role: string; firstName: string; lastName: string;
  twoFaEnabled: boolean; loyaltyPoints: number; loyaltyTier: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requiresTwoFa?: boolean; tempToken?: string }>;
  verify2FA: (tempToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: object) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login(email, password);
          const result = data.data;
          if (result.requiresTwoFa) {
            set({ isLoading: false });
            return { requiresTwoFa: true, tempToken: result.tempToken };
          }
          const { user, tokens } = result;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          set({ user, accessToken: tokens.accessToken, isAuthenticated: true, isLoading: false });
          return {};
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      verify2FA: async (tempToken, code) => {
        const { data } = await authApi.verify2FA(tempToken, code);
        const { user, tokens } = data.data;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ user, accessToken: tokens.accessToken, isAuthenticated: true });
      },

      logout: async () => {
        try {
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
          await authApi.logout(refreshToken ? { refreshToken } : {});
        } catch { /* ignore */ }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      register: async (data) => {
        const res = await authApi.register(data);
        return res.data;
      },

      loadProfile: async () => {
        try {
          const { data } = await userApi.getProfile();
          set({ user: data.data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      updateUser: (data) => set(s => ({ user: s.user ? { ...s.user, ...data } : null })),
    }),
    {
      name: 'dhameys-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
    }
  )
);
