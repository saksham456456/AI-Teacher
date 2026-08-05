'use client';

import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Star, Award } from 'lucide-react';

export type ToastType = 'xp' | 'badge';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  value?: string | number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).substring(7) }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`glass-panel p-4 rounded-2xl flex items-center gap-4 shadow-xl border ${
        toast.type === 'xp' ? 'border-amber-500/30' : 'border-violet-500/30'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        toast.type === 'xp' ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'
      }`}>
        {toast.type === 'xp' ? <Star className="w-5 h-5" /> : <Award className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="font-bold text-slate-100">{toast.message}</h4>
        {toast.value && (
          <p className={`font-semibold ${toast.type === 'xp' ? 'text-amber-400' : 'text-violet-400'}`}>
            {toast.type === 'xp' ? `+${toast.value} XP` : toast.value}
          </p>
        )}
      </div>
    </motion.div>
  );
}
