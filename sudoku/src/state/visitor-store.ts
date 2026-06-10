// =====================================================================
// Visitor counter store
// =====================================================================
import { create } from 'zustand';

export interface VisitorState {
  today: number;
  today_guests: number;
  today_members: number;
  week: number;
  total: number;
  online: number;
  online_guests: number;
  online_members: number;
  loaded: boolean;
  setStats: (s: Partial<Omit<VisitorState, 'setStats'>>) => void;
}

export const useVisitorStore = create<VisitorState>((set) => ({
  today: 0,
  today_guests: 0,
  today_members: 0,
  week: 0,
  total: 0,
  online: 0,
  online_guests: 0,
  online_members: 0,
  loaded: false,
  setStats: (s) => set({ ...s, loaded: true }),
}));
