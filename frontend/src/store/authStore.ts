import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string | null;
  is_superuser: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

// ── Cookie helpers (browser-only, safe from SSR crashes) ──────────────────

const isBrowser = typeof window !== "undefined";

function setCookie(name: string, value: string, days = 7) {
  if (!isBrowser) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (!isBrowser) return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setToken: (token) => {
        // Write cookie so Next.js middleware (server-side) can read it
        setCookie("convosum_token", token);
        set({ token });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        deleteCookie("convosum_token");
        set({ token: null, user: null });
      },
    }),
    {
      name: "convosum-auth",
      // Only persist token and user; skip transient loading states
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
