import { create } from 'zustand';

interface SessionState {
  isAuthenticated: boolean;
  /** Loaded during app load so protected-route logic can distinguish "still checking"
   * from "confirmed logged out" and avoid a flash-redirect to /login
   */
  isInitializing: boolean;
  setAuthenticated: (value: boolean) => void;
  setInitializing: (value: boolean) => void;
}

/**
 * Holds ONLY client-derived session status, not
 * the user object itself. Keeping this store small
 * and single-purpose avoids the "two sources of truth" trap.
 */
export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  isInitializing: true,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setInitializing: (value) => set({ isInitializing: value }),
}));
