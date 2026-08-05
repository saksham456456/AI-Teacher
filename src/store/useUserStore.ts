import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  xp: number;
  streak: number;
  level: number;
  badges: string[];
  lastActiveDate: string | null;
  addXp: (amount: number) => void;
  updateStreak: () => void;
  unlockBadge: (badge: string) => void;
}

const calculateLevel = (xp: number) => {
  return Math.floor(xp / 100) + 1; // 100 XP per level
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      level: 1,
      badges: [],
      lastActiveDate: null,
      addXp: (amount) =>
        set((state) => {
          const newXp = state.xp + amount;
          return {
            xp: newXp,
            level: calculateLevel(newXp),
          };
        }),
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();

        if (state.lastActiveDate === today) {
          return; // Already active today
        }

        if (!state.lastActiveDate) {
          set({ streak: 1, lastActiveDate: today });
          return;
        }

        const lastDate = new Date(state.lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          set({ streak: state.streak + 1, lastActiveDate: today });
        } else if (diffDays > 1) {
          // Streak broken
          set({ streak: 1, lastActiveDate: today });
        }
      },
      unlockBadge: (badge) =>
        set((state) => {
          if (!state.badges.includes(badge)) {
            return { badges: [...state.badges, badge] };
          }
          return state;
        }),
    }),
    {
      name: 'user-storage',
    }
  )
);
