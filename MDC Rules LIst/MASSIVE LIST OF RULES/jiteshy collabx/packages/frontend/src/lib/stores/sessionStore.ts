import { create } from 'zustand';
import { Session } from '@collabx/shared';

interface SessionState {
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  updateSessionActivity: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,

  setCurrentSession: (session) => set({ currentSession: session }),

  updateSessionActivity: () => {
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          lastActive: Date.now(),
        },
      };
    });
  },

  reset: () => set({ currentSession: null }),
}));
