"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, Message } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Brain } from 'lucide-react';

export default function ChatInterface() {
  const { messages, addMessage, updateLastMessage } = useChatStore();
  const { addXP } = useUserStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processTextForXP = (text: string) => {
    const xpRegex = /\[XP:\+(\d+)\]/g;
    const newText = text;
    let match;
    let totalXPEarned = 0;

    while ((match = xpRegex.exec(text)) !== null) {
      totalXPEarned += parseInt(match[1], 10);
    }

    if (totalXPEarned > 0) {
      setTimeout(() => addXP(totalXPEarned), 10);
    }

    return newText.replace(xpRegex, '').trim();
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    setInput('');
    setIsLoading(true);

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
    addMessage(newUserMsg);

    const assistantMsgId = (Date.now() + 1).toString();
    addMessage({ id: assistantMsgId, role: 'assistant', content: '' });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMsg].map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.content) {
                fullResponse += data.content;
                const cleanContent = processTextForXP(fullResponse);
                updateLastMessage(cleanContent);
              }
              if (data.tool_calls) {
                const event = new CustomEvent('ai-tool-call', { detail: data.tool_calls });
                window.dispatchEvent(event);
              }
            } catch (e) {
              console.error('Error parsing stream data');
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <Brain size={48} className="text-indigo-300" />
            <p className="text-center">Hi! I&apos;m your AI Teacher. Let&apos;s learn something new today.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-bl-none prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:border prose-pre:border-zinc-700'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {msg.content || '...'}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <div className="mb-3">
          <button
            onClick={() => handleSend("Generate a short 3-question multiple-choice quiz about what we just discussed to test my knowledge. Include the [XP:+50] tag in the final confirmation message when I answer correctly.")}
            disabled={isLoading || messages.length === 0}
            className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:hover:bg-yellow-900/50 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Brain size={16} />
            <span>Test Me</span>
          </button>
        </div>
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[50px] max-h-[150px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
