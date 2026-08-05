'use client';

import { useUserStore } from '@/store/useUserStore';
import { motion } from 'framer-motion';
import { Flame, Star, Award, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function GamifiedHeader() {
  const { xp, level, streak, badges } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Standard approach to handle Next.js hydration with Zustand persist
    // Wrap in setTimeout or simply rely on useEffect execution to guarantee client side
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch on initial render

  const xpProgress = (xp % 100) / 100; // Assuming 100 XP per level

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 glass-panel flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
          AI Teacher
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Streak */}
        <div className="flex items-center gap-2 bg-slate-900/50 rounded-full px-4 py-1.5 border border-white/5">
          <Flame className={`w-5 h-5 ${streak > 0 ? 'text-amber-500' : 'text-slate-500'}`} />
          <span className="font-semibold">{streak} Day Streak</span>
        </div>

        {/* Level and XP */}
        <div className="flex items-center gap-4 bg-slate-900/50 rounded-full pl-4 pr-1 py-1 border border-white/5">
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-emerald-400">Lvl {level}</span>
              <span className="text-slate-400">{xp} XP</span>
            </div>
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
            <Star className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Badges Button */}
        <button className="flex items-center gap-2 hover:bg-white/5 transition-colors p-2 rounded-xl">
          <Award className="w-6 h-6 text-violet-400" />
          <span className="font-semibold text-slate-300">{badges.length} Badges</span>
        </button>
      </div>
    </header>
  );
}
