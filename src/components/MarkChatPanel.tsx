/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMarkChatMessage, MarkChatTurn, MarkChatResponse } from '../api/createdPages';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';

type PageSnapshot = MarkChatResponse['page'];

/** A chat turn plus, for Mark's replies, the page fields that turn changed. */
interface StudioMessage extends MarkChatTurn {
  changes?: string[];
}

interface MarkChatPanelProps {
  /** Null until Mark's first reply creates the page server-side. */
  pageId: string | null;
  /** The page as it stands now, so each reply can say which fields it changed. */
  pageSnapshot: PageSnapshot | null;
  /** Called once the page exists (first message) and again after every turn, with the latest saved snapshot. */
  onPageUpdated: (pageId: string, snapshot: PageSnapshot) => void;
  /** Sent automatically, once, as the opening message (from the start screen). */
  initialPrompt?: string;
  /** Lets the parent clear the prompt from the URL state once it has been sent. */
  onPromptConsumed?: () => void;
}

const GREETING =
  "Hey, I'm Mark! Tell me what you built — what it does, and roughly how people should get to it (a download, a link, or your own API) — and I'll turn it into a page. You'll see it take shape on the right.";

const STARTERS = [
  'A web app I built that helps students…',
  'A Python script that automates…',
  'A Chrome extension that…',
  'A free template pack for…',
];

const FIELD_LABELS: [keyof PageSnapshot, string][] = [
  ['title', 'title'],
  ['shortDescription', 'hook'],
  ['detailedDescription', 'full story'],
  ['category', 'category'],
  ['toolsUsedText', 'tools'],
  ['deliveryMode', 'delivery'],
  ['deliveryUrl', 'link'],
  ['coverImageUrl', 'cover image'],
];

const describeChanges = (before: PageSnapshot | null, after: PageSnapshot): string[] => {
  if (!before) return ['Created your page draft'];
  const changed = FIELD_LABELS.filter(([key]) => before[key] !== after[key]).map(([, label]) => label);
  return changed.length ? [`Updated ${changed.join(', ')}`] : [];
};

// The chat isn't stored server-side (each request carries its own history), so it is kept for the
// browser tab. That way a refresh doesn't wipe a conversation the builder is halfway through.
const storageKey = (pageId: string | null) => `ai-brief:mark-chat:${pageId ?? 'new'}`;

const loadMessages = (pageId: string | null): StudioMessage[] | null => {
  try {
    const raw = sessionStorage.getItem(storageKey(pageId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

const saveMessages = (pageId: string | null, messages: StudioMessage[]) => {
  try {
    sessionStorage.setItem(storageKey(pageId), JSON.stringify(messages));
    // Once the page exists the conversation lives under its id; a later brand-new chat starts clean.
    if (pageId !== null) sessionStorage.removeItem(storageKey(null));
  } catch {
    /* storage unavailable or full — losing persistence is fine, the chat still works */
  }
};

export const MarkChatPanel: React.FC<MarkChatPanelProps> = ({ pageId, pageSnapshot, onPageUpdated, initialPrompt, onPromptConsumed }) => {
  const [messages, setMessages] = useState<StudioMessage[]>(() => loadMessages(pageId) ?? [{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => saveMessages(pageId, messages), [pageId, messages]);

  // Scroll the message list itself — scrollIntoView would also scroll the whole page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  // Grow the box with the text, up to a limit, then scroll inside it.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
  }, [input]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const history: MarkChatTurn[] = messages.map(({ role, content }) => ({ role, content }));
      const before = pageSnapshot;

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setInput('');
      setError(null);
      setIsSending(true);

      try {
        // History is everything BEFORE this turn — Mark receives the new message as its own parameter.
        const result = await sendMarkChatMessage(pageId, history, trimmed);
        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply, changes: describeChanges(before, result.page) }]);
        onPageUpdated(result.pageId, result.page);
      } catch (err: any) {
        setError(err?.detail || "Mark didn't respond — try again.");
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages, pageId, pageSnapshot, onPageUpdated]
  );

  // The start screen hands over what the builder typed there; send it as the first message.
  useEffect(() => {
    if (initialPrompt && !autoSentRef.current) {
      autoSentRef.current = true;
      onPromptConsumed?.();
      void send(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter adds a line. Ignore Enter while an IME is composing a character.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  const onlyGreeting = messages.length === 1;

  return (
    <div className="studio-chat">
      <div className="studio-chat__scroll" ref={scrollRef} role="log" aria-live="polite" aria-label="Conversation with Mark">
        {messages.map((m, i) => (
          <div key={i} className={`studio-msg studio-msg--${m.role}`}>
            {m.role === 'assistant' && (
              <span className="studio-msg__avatar" aria-hidden="true">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
            <div className="studio-msg__body">
              {m.role === 'assistant' ? (
                <div className="studio-md">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{m.content}</p>
              )}
              {m.changes && m.changes.length > 0 && (
                <ul className="studio-msg__changes">
                  {m.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="studio-msg studio-msg--assistant" role="status">
            <span className="studio-msg__avatar" aria-hidden="true">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="studio-msg__body studio-msg__typing">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Mark is writing…
            </div>
          </div>
        )}

        {onlyGreeting && !isSending && (
          <div className="studio-chat__starters" aria-label="Ways to start">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInput(s);
                  textareaRef.current?.focus();
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="studio-chat__error" role="alert">
          {error}
        </p>
      )}

      <form
        className="studio-chat__composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={pageId ? 'Ask Mark to change something…' : 'Describe what you built…'}
          aria-label="Message to Mark"
          disabled={isSending}
        />
        <button type="submit" className="studio-chat__send" disabled={isSending || !input.trim()} aria-label="Send">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="w-4 h-4" aria-hidden="true" />}
        </button>
      </form>
      <p className="studio-chat__hint">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
};
