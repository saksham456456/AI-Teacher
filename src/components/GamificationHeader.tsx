"use client";
import { useUserStore } from '@/store/useUserStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Award, Flame, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function GamificationHeader() {
  const { xp, level, streak, checkStreak } = useUserStore();
  const { mode, setMode } = useLayoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
    checkStreak();
  }, [checkStreak]);

  if (!mounted) return null;

  const xpProgress = xp % 100;

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold font-sans text-indigo-600 dark:text-indigo-400">AI Teacher</h1>
        <div className="flex items-center space-x-4 text-sm font-medium">
          <div className="flex items-center space-x-1 text-yellow-500">
            <Trophy size={16} />
            <span>Level {level}</span>
          </div>
          <div className="w-32 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex items-center space-x-1 text-blue-500">
            <Award size={16} />
            <span>{xp} XP</span>
          </div>
          <div className="flex items-center space-x-1 text-orange-500">
            <Flame size={16} />
            <span>{streak} Day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        {['Chat Focus', 'Split View', 'Canvas Focus'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as "Chat Focus" | "Split View" | "Canvas Focus")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              mode === m
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </header>
  );
}
