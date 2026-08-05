'use client';

import { useLayoutStore } from '@/store/useLayoutStore';
import { motion } from 'framer-motion';
import { Columns, Maximize2, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import ChatPanel from './ChatPanel'; // We will create this

const Whiteboard = dynamic(() => import('./Whiteboard'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500">Loading Canvas...</div>
});

export default function WorkspaceLayout() {
  const { layoutMode, setLayoutMode } = useLayoutStore();

  const getLayoutClasses = () => {
    switch (layoutMode) {
      case 'Chat Focus':
        return { chat: 'w-2/3', canvas: 'w-1/3 opacity-50' };
      case 'Canvas Focus':
        return { chat: 'w-[400px] absolute left-6 top-6 bottom-6 z-10 glass-panel shadow-2xl rounded-2xl overflow-hidden', canvas: 'w-full' };
      case 'Split View':
      default:
        return { chat: 'w-1/3 border-r border-white/10 bg-slate-900/50 backdrop-blur-md', canvas: 'w-2/3' };
    }
  };

  const classes = getLayoutClasses();

  return (
    <div className="w-full h-full flex relative bg-slate-950">

      {/* Layout Controls - Floating */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full p-2 flex gap-2">
        <button
          onClick={() => setLayoutMode('Chat Focus')}
          className={`p-2 rounded-full transition-colors ${layoutMode === 'Chat Focus' ? 'bg-indigo-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}
          title="Chat Focus"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={() => setLayoutMode('Split View')}
          className={`p-2 rounded-full transition-colors ${layoutMode === 'Split View' ? 'bg-indigo-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}
          title="Split View"
        >
          <Columns className="w-5 h-5" />
        </button>
        <button
          onClick={() => setLayoutMode('Canvas Focus')}
          className={`p-2 rounded-full transition-colors ${layoutMode === 'Canvas Focus' ? 'bg-indigo-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}
          title="Canvas Focus"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <motion.div
        layout
        initial={false}
        className={`${classes.chat} h-full transition-all duration-500 ease-in-out flex flex-col`}
      >
        <ChatPanel />
      </motion.div>

      {/* Canvas Area */}
      <motion.div
        layout
        initial={false}
        className={`${classes.canvas} h-full transition-all duration-500 ease-in-out`}
      >
        <Whiteboard />
      </motion.div>

    </div>
  );
}
