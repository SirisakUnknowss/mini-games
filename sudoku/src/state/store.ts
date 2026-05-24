// =====================================================================
// Global state (Zustand)
// =====================================================================
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

type View = 'loading' | 'login' | 'home' | 'game' | 'leaderboard' | 'shop' | 'profile' | 'settings' | 'stages';

interface AppState {
  user: User | null;
  profile: { username?: string; display_name?: string } | null;
  coins: number;
  xp: number;
  level: number;
  currentStreak: number;
  currentView: View;

  setUser: (user: User | null) => void;
  setProfile: (p: AppState['profile']) => void;
  setCoins: (n: number) => void;
  setXp: (n: number) => void;
  setLevel: (n: number) => void;
  setStreak: (n: number) => void;
  setView: (v: View) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  coins: 0,
  xp: 0,
  level: 1,
  currentStreak: 0,
  currentView: 'loading',

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCoins: (coins) => set({ coins }),
  setXp: (xp) => set({ xp }),
  setLevel: (level) => set({ level }),
  setStreak: (currentStreak) => set({ currentStreak }),
  setView: (currentView) => set({ currentView }),
}));
