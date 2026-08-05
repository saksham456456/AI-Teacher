'use client';

import { useChat } from '@ai-sdk/react';
import { Send, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import QuizCard from './QuizCard';
import { useUserStore } from '@/store/useUserStore';
import { useToastStore } from '../ToastProvider';

export default function ChatPanel() {
  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      // Check for XP patterns in text like [XP:+25]
      const xpMatch = message.content.match(/\[XP:\+(\d+)\]/i);
      if (xpMatch) {
        const amount = parseInt(xpMatch[1], 10);
        // Using window.dispatchEvent or direct store access is tricky here due to hooks rules,
        // but we can fire a custom event to decouple or just use it directly since it's a global Zustand store
        const { addXp, updateStreak } = useUserStore.getState();
        const { addToast } = useToastStore.getState();

        addXp(amount);
        updateStreak();
        addToast({ type: 'xp', message: 'Insightful contribution!', value: amount });
      }
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Intercept Tool Calls for Whiteboard
  useEffect(() => {
    messages.forEach((m) => {
      m.toolInvocations?.forEach((tool) => {
        // Dispatch to whiteboard if it's a drawing tool
        // Note: tool 'state' may not exist in this version of AI SDK, so we assume it was called
        if (['draw_shape', 'render_text_block', 'clear_whiteboard'].includes(tool.toolName)) {
            window.dispatchEvent(new CustomEvent('whiteboard-command', {
              detail: { toolName: tool.toolName, args: tool.args }
            }));
        }
      });
    });
  }, [messages]);

  const handleTestMe = () => {
    append({
      role: 'user',
      content: 'Test me! Generate a quick interactive quiz based on what we just discussed.',
    });
  };

  return (
    <div className="w-full h-full flex flex-col pt-[80px] pb-6 px-6">
      <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Start Learning</h3>
            <p className="text-slate-400 max-w-[250px] mt-2">Ask a question to begin your gamified learning journey.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500">
                {m.role === 'user' ? 'You' : 'AI Teacher'}
              </span>
            </div>
            <div
              className={`p-4 rounded-2xl max-w-[90%] shadow-lg border ${
                m.role === 'user'
                  ? 'bg-indigo-600/80 border-indigo-500/50 text-white rounded-tr-sm'
                  : 'bg-slate-900/80 border-slate-700/50 text-slate-100 rounded-tl-sm glass-panel'
              }`}
            >
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {/* Clean up the [XP:+X] from UI */}
                  {m.content.replace(/\[XP:\+\d+\]/gi, '')}
                </ReactMarkdown>
              </div>

              {/* Render Tool Calls visually */}
              {m.toolInvocations?.map((tool) => {
                 // For quiz, check if we have args (which acts like result when using client side invocation tracking)
                 if (tool.toolName === 'generate_quiz' && tool.args) {
                   return (
                     <QuizCard
                        key={tool.toolCallId}
                        question={tool.args.question as string}
                        options={tool.args.options as string[]}
                        correctOptionIndex={tool.args.correctOptionIndex as number}
                     />
                   );
                 }

                 if (['draw_shape', 'render_text_block', 'clear_whiteboard'].includes(tool.toolName)) {
                   return (
                    <div key={tool.toolCallId} className="mt-3 p-3 bg-slate-950/50 rounded-xl border border-white/5 text-sm text-emerald-400 font-semibold flex items-center gap-2">
                       <Sparkles className="w-4 h-4"/> Updating Whiteboard...
                     </div>
                   );
                 }

                 return null;
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Test Me Action */}
      <div className="flex justify-end mb-3">
        <button
          onClick={handleTestMe}
          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-amber-500/10"
        >
          <Sparkles className="w-4 h-4" />
          Test Me
        </button>
      </div>

      {/* Input area */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-25"></div>
        <form onSubmit={handleSubmit} className="relative bg-slate-900 rounded-2xl border border-white/10 p-2 flex items-center shadow-xl">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            className="w-full bg-transparent border-none outline-none px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:ring-0"
            placeholder="Ask me anything..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors font-medium flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
