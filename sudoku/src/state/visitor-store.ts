// =====================================================================
// Visitor counter store — lightweight Zustand slice
// =====================================================================
import { create } from 'zustand';

export interface VisitorState {
  today: number;    // unique visitors today
  week: number;     // unique visitors this week
  total: number;    // all-time unique visitors
  loaded: boolean;
  setStats: (stats: { today: number; week: number; total: number }) => void;
}

export const useVisitorStore = create<VisitorState>((set) => ({
  today: 0,
  week: 0,
  total: 0,
  loaded: false,
  setStats: (stats) => set({ ...stats, loaded: true }),
}));
