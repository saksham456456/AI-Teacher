import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LayoutMode = 'Chat Focus' | 'Split View' | 'Canvas Focus';

interface LayoutState {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layoutMode: 'Split View', // Default to Split View
      setLayoutMode: (mode) => set({ layoutMode: mode }),
    }),
    {
      name: 'layout-storage',
    }
  )
);
