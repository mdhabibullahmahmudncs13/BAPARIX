import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LiteModeState {
  isLiteMode: boolean;
  toggleLiteMode: () => void;
  setLiteMode: (enabled: boolean) => void;
}

export const useLiteModeStore = create<LiteModeState>()(
  persist(
    (set) => ({
      isLiteMode: false,
      toggleLiteMode: () => set((state) => ({ isLiteMode: !state.isLiteMode })),
      setLiteMode: (enabled: boolean) => set({ isLiteMode: enabled }),
    }),
    {
      name: 'ventureos-lite-mode',
    }
  )
);
