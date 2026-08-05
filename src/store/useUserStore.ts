import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  lastActiveDate: string | null;
  addXP: (amount: number) => void;
  checkStreak: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      xp: 0,
      level: 1,
      streak: 0,
      badges: [],
      lastActiveDate: null,

      addXP: (amount: number) => {
        set((state) => {
          const newXp = state.xp + amount;
          const newLevel = Math.floor(newXp / 100) + 1; // 100 XP per level for simplicity
          return { xp: newXp, level: newLevel };
        });
      },

      checkStreak: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          if (!state.lastActiveDate) {
            return { lastActiveDate: today, streak: 1 };
          }

          const lastActive = new Date(state.lastActiveDate);
          const current = new Date(today);
          const diffDays = Math.floor((current.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

          if (diffDays === 1) {
            return { lastActiveDate: today, streak: state.streak + 1 };
          } else if (diffDays > 1) {
            return { lastActiveDate: today, streak: 1 }; // Reset streak
          }

          return state; // Same day, no streak update
        });
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
