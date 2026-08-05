"use client";
import { useLayoutStore } from '@/store/useLayoutStore';
import React, { useState, useEffect } from 'react';

export default function DynamicWorkspace({
  chatComponent,
  whiteboardComponent
}: {
  chatComponent: React.ReactNode,
  whiteboardComponent: React.ReactNode
}) {
  const { mode } = useLayoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-full w-full">
      {/* Chat Area */}
      <div
        className={`h-full transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-zinc-800 ${
          mode === 'Chat Focus' ? 'w-full' :
          mode === 'Split View' ? 'w-[400px] lg:w-[500px]' :
          'w-0 overflow-hidden'
        }`}
      >
        <div className="h-full w-full min-w-[320px]">
          {chatComponent}
        </div>
      </div>

      {/* Whiteboard Area */}
      <div
        className={`h-full bg-gray-50 dark:bg-zinc-950 transition-all duration-300 ease-in-out ${
          mode === 'Chat Focus' ? 'w-0 overflow-hidden' :
          'flex-1'
        }`}
      >
        {whiteboardComponent}
      </div>

      {/* Floating Chat Button for Canvas Focus */}
      {mode === 'Canvas Focus' && (
        <div className="absolute top-4 left-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-[350px] max-h-[80vh] flex flex-col border border-gray-200 dark:border-zinc-800">
            <div className="flex-1 overflow-hidden">
               {chatComponent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
