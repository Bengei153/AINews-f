/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { sendMarkChatMessage, MarkChatTurn, MarkChatResponse } from '../api/createdPages';
import { Sparkles, Send, Loader2, User } from 'lucide-react';

interface MarkChatPanelProps {
  /** Null until Mark's first reply creates the page server-side. */
  pageId: string | null;
  /** Called once the page exists (first message) and again after every turn, with the latest saved snapshot. */
  onPageUpdated: (pageId: string, snapshot: MarkChatResponse['page']) => void;
}

const GREETING =
  "Hey, I'm Mark! Tell me what you built — what it does, and roughly how people should get to it (a download, a link, or your own API) — and I'll help you turn it into a page.";

export const MarkChatPanel: React.FC<MarkChatPanelProps> = ({ pageId, onPageUpdated }) => {
  const [messages, setMessages] = useState<MarkChatTurn[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages: MarkChatTurn[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      // History sent is everything BEFORE this turn — Mark receives the new message as a
      // separate parameter, not duplicated inside history.
      const result = await sendMarkChatMessage(pageId, messages, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
      onPageUpdated(result.pageId, result.page);
    } catch (err: any) {
      setError(err?.detail || "Mark didn't respond — try again.");
      // Roll back the optimistic user message's effect isn't needed (it's still shown), just stop the spinner.
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[32rem] border border-stone-200 rounded-xl bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-stone-800' : 'bg-emerald-700'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
            </div>
            <div
              className={`max-w-[80%] text-sm rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed ${
                m.role === 'user' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-stone-100 rounded-2xl px-3.5 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-red-600 px-4 pb-1">{error}</p>}

      <form onSubmit={handleSend} className="border-t border-stone-100 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell Mark about your project..."
          className="flex-1 text-sm px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
