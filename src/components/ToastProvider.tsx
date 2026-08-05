"use client";
import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastProvider() {
  const { xp } = useUserStore();
  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([]);
  const [prevXp, setPrevXp] = useState(xp);

  useEffect(() => {
    if (xp > prevXp) {
      const diff = xp - prevXp;
      const id = Date.now();
      queueMicrotask(() => setToasts(prev => [...prev, { id, message: `+${diff} XP Earned!` }]));
      queueMicrotask(() => setPrevXp(xp));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    }
  }, [xp, prevXp]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-2"
          >
            <span>🎉</span>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
