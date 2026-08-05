import { create } from 'zustand';

type LayoutMode = 'Chat Focus' | 'Split View' | 'Canvas Focus';

interface LayoutState {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
}

export const useLayoutStore = create<LayoutState>()((set) => ({
  mode: 'Split View',
  setMode: (mode) => set({ mode }),
}));
