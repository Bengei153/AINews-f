/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { getMyFollowers } from '../api/follows';
import { sendContentShare } from '../api/contentShares';
import { FollowerDto, SharedContentType } from '../types/api';

export interface SendToFollowerModalProps {
  contentType: SharedContentType;
  contentId: string;
  contentTitle: string;
  onClose: () => void;
}

type LoadState = 'loading' | 'ready' | 'error';
type SendState = 'idle' | 'sending' | 'sent';

export const SendToFollowerModal: React.FC<SendToFollowerModalProps> = ({ contentType, contentId, contentTitle, onClose }) => {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [followers, setFollowers] = useState<FollowerDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyFollowers()
      .then((result) => {
        if (cancelled) return;
        setFollowers(result);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelected = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) return;
    setSendState('sending');
    try {
      const count = await sendContentShare({
        recipientUserIds: Array.from(selectedIds),
        contentType,
        contentId,
        message: message.trim() || null,
      });
      setSentCount(count);
      setSendState('sent');
    } catch {
      setSendState('idle');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="follower-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follower-modal__header">
          <h3>Send to a follower</h3>
          <button type="button" className="follower-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="follower-modal__subtitle">Sharing "{contentTitle}"</p>

        {sendState === 'sent' ? (
          <div className="follower-modal__sent">
            <p>Sent to {sentCount} {sentCount === 1 ? 'person' : 'people'}.</p>
            <button type="button" className="follower-modal__done-button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            {loadState === 'loading' && (
              <div className="follower-modal__loading">
                <Loader2 size={20} className="follower-modal__spinner" />
              </div>
            )}

            {loadState === 'error' && <p className="follower-modal__empty">Couldn't load your followers. Try again in a moment.</p>}

            {loadState === 'ready' && followers.length === 0 && (
              <p className="follower-modal__empty">You don't have any followers yet.</p>
            )}

            {loadState === 'ready' && followers.length > 0 && (
              <>
                <ul className="follower-modal__list">
                  {followers.map((follower) => (
                    <li key={follower.userId}>
                      <label className="follower-modal__option">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(follower.userId)}
                          onChange={() => toggleSelected(follower.userId)}
                        />
                        {follower.fullName}
                      </label>
                    </li>
                  ))}
                </ul>

                <textarea
                  className="follower-modal__message"
                  placeholder="Add a note (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={2}
                />

                <button
                  type="button"
                  className="follower-modal__send-button"
                  onClick={handleSend}
                  disabled={selectedIds.size === 0 || sendState === 'sending'}
                >
                  {sendState === 'sending' ? (
                    <Loader2 size={16} className="follower-modal__spinner" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
