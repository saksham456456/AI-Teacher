'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/useUserStore';
import { useToastStore } from '../ToastProvider';
import { CheckCircle2, XCircle, Trophy } from 'lucide-react';

interface QuizCardProps {
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export default function QuizCard({ question, options, correctOptionIndex }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { addXp, updateStreak, unlockBadge } = useUserStore();
  const { addToast } = useToastStore();

  const handleSubmit = () => {
    if (selected === null) return;
    setIsSubmitted(true);

    if (selected === correctOptionIndex) {
      addXp(50);
      updateStreak();
      addToast({ type: 'xp', message: 'Correct Answer!', value: 50 });
      unlockBadge('Quiz Master');
    }
  };

  const isCorrect = selected === correctOptionIndex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-5 glass-panel border border-violet-500/30 rounded-2xl w-full max-w-md shadow-2xl shadow-violet-900/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-slate-100">Knowledge Check</h3>
      </div>

      <p className="text-slate-200 mb-4">{question}</p>

      <div className="space-y-2 mb-4">
        {options.map((option, idx) => {
          let stateClass = 'bg-slate-800/50 hover:bg-slate-700/50 border-white/5';

          if (isSubmitted) {
            if (idx === correctOptionIndex) {
              stateClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200';
            } else if (idx === selected && idx !== correctOptionIndex) {
              stateClass = 'bg-rose-500/20 border-rose-500/50 text-rose-200';
            } else {
              stateClass = 'bg-slate-800/20 border-transparent opacity-50';
            }
          } else if (selected === idx) {
            stateClass = 'bg-violet-500/30 border-violet-500/50 text-violet-200';
          }

          return (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => setSelected(idx)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${stateClass} flex items-center justify-between`}
            >
              <span>{option}</span>
              {isSubmitted && idx === correctOptionIndex && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isSubmitted && idx === selected && idx !== correctOptionIndex && <XCircle className="w-5 h-5 text-rose-400" />}
            </button>
          );
        })}
      </div>

      {!isSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
        >
          Submit Answer
        </button>
      )}

      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mt-4 text-center font-bold p-3 rounded-xl ${isCorrect ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}
          >
            {isCorrect ? 'Excellent! +50 XP' : 'Not quite! Keep trying.'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
