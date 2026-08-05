import { create } from 'zustand';

interface WhiteboardState {
  commands: Record<string, unknown>[];
  addCommand: (command: Record<string, unknown>) => void;
  clearCommands: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>()((set) => ({
  commands: [],
  addCommand: (command) => set((state) => ({ commands: [...state.commands, command] })),
  clearCommands: () => set({ commands: [] }),
}));
