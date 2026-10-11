import { create } from 'zustand';

interface AppState {
  isSetupComplete: boolean;
  completeSetup: () => void;
  resetSetup: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSetupComplete: false,
  completeSetup: () => set({ isSetupComplete: true }),
  resetSetup: () => set({ isSetupComplete: false }),
}));
