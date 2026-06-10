// =====================================================================
// Global state (Zustand)
// =====================================================================
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

type View = 'loading' | 'login' | 'home' | 'game' | 'leaderboard' | 'shop' | 'profile' | 'settings' | 'stages';

interface Equipped {
  theme_id: string | null;
  background_id: string | null;
  avatar: { emoji?: string; [k: string]: unknown };
}

interface AppState {
  user: User | null;
  profile: { username?: string; display_name?: string; avatar_url?: string; country?: string; bio?: string } | null;
  coins: number;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  equipped: Equipped;
  inventory: string[]; // item ids owned
  currentView: View;

  setUser: (user: User | null) => void;
  setProfile: (p: AppState['profile']) => void;
  setCoins: (n: number) => void;
  setXp: (n: number) => void;
  setLevel: (n: number) => void;
  setStreak: (n: number) => void;
  setEquipped: (e: Partial<Equipped>) => void;
  setInventory: (ids: string[]) => void;
  addToInventory: (id: string) => void;
  setView: (v: View) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,
  coins: 0,
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  equipped: { theme_id: null, background_id: null, avatar: { emoji: '👤' } },
  inventory: [],
  currentView: 'loading',

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCoins: (coins) => set({ coins }),
  setXp: (xp) => set({ xp }),
  setLevel: (level) => set({ level }),
  setStreak: (currentStreak) => set({ currentStreak }),
  setEquipped: (patch) => set({ equipped: { ...get().equipped, ...patch } }),
  setInventory: (inventory) => set({ inventory }),
  addToInventory: (id) => set({ inventory: Array.from(new Set([...get().inventory, id])) }),
  setView: (currentView) => set({ currentView }),
}));
