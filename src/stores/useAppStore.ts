import { create } from 'zustand';

interface AuthProfile {
  id: string;
  name: string;
  url: string;
  authType: 'basic' | 'iam';
  username?: string;
  region?: string; // For IAM
}

export type Theme = 'light' | 'dark' | 'system';

interface AppState {
  isAuthenticated: boolean;
  currentProfile: AuthProfile | null;
  currentCluster: string | null;
  currentView: string;
  theme: Theme;

  login: (profile: AuthProfile) => void;
  logout: () => void;
  setView: (view: string) => void;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  currentProfile: null,
  currentCluster: null,
  currentView: 'dashboard',
  theme: 'system',

  login: (profile) =>
    set({ isAuthenticated: true, currentProfile: profile, currentCluster: profile.name }),
  logout: () => set({ isAuthenticated: false, currentProfile: null, currentCluster: null }),
  setView: (view) => set({ currentView: view }),
  setTheme: (theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    set({ theme });
  },
}));
