/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Copy, Check, BookMarked, Users } from 'lucide-react';
import { getApiRootUrl } from '../api/client';
import { useAuth } from '../store/authStore';
import { SharedContentType } from '../types/api';
import { SendToFollowerModal } from './SendToFollowerModal';

const SHARE_PATH_SEGMENT: Record<SharedContentType, string> = {
  Article: 'articles',
  Video: 'videos',
  Tutorial: 'tutorials',
  Course: 'courses',
};

export interface ShareMenuProps {
  contentType: SharedContentType;
  contentId: string;
  slug: string;
  title: string;
  summary: string;
  thumbnailUrl?: string | null;
  /** 'widget' renders a titled card (detail pages); 'icon' renders a compact icon-only button (grid cards like CourseCard). */
  variant?: 'widget' | 'icon';
  className?: string;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  contentType,
  contentId,
  slug,
  title,
  summary,
  thumbnailUrl,
  variant = 'widget',
  className,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followerModalOpen, setFollowerModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${getApiRootUrl()}/share/${SHARE_PATH_SEGMENT[contentType]}/${slug}`;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleCopyOrNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: summary, url: shareUrl });
        setMenuOpen(false);
      } catch {
        // user cancelled the native share sheet — leave the menu open
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing more we can do here
    }
  };

  const handlePostToShowcase = () => {
    const params = new URLSearchParams({
      sharedType: contentType,
      sharedId: contentId,
      sharedTitle: title,
    });
    if (slug) params.set('sharedSlug', slug);
    if (thumbnailUrl) params.set('sharedThumbnail', thumbnailUrl);
    setMenuOpen(false);
    navigate(`/showcase/new?${params.toString()}`);
  };

  const triggerButton =
    variant === 'icon' ? (
      <button
        type="button"
        className="share-menu__icon-trigger"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Share"
        title="Share"
      >
        <Share2 size={16} />
      </button>
    ) : (
      <button type="button" className="share-menu__trigger" onClick={() => setMenuOpen((open) => !open)}>
        <Share2 size={16} />
        Share
      </button>
    );

  return (
    <div className={`share-menu share-menu--${variant} ${className || ''}`} ref={menuRef}>
      {variant === 'widget' && <h3 className="share-menu__title">Share</h3>}
      {triggerButton}

      {menuOpen && (
        <div className="share-menu__panel" role="menu">
          <button type="button" className="share-menu__item" onClick={handleCopyOrNativeShare} role="menuitem">
            {copied ? <Check size={15} /> : navigator.share ? <Share2 size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : navigator.share ? 'Share…' : 'Copy link'}
          </button>

          {user && (
            <button type="button" className="share-menu__item" onClick={handlePostToShowcase} role="menuitem">
              <BookMarked size={15} />
              Post to Showcase
            </button>
          )}

          {user && (
            <button
              type="button"
              className="share-menu__item"
              onClick={() => {
                setMenuOpen(false);
                setFollowerModalOpen(true);
              }}
              role="menuitem"
            >
              <Users size={15} />
              Send to a follower
            </button>
          )}
        </div>
      )}

      {followerModalOpen && (
        <SendToFollowerModal
          contentType={contentType}
          contentId={contentId}
          contentTitle={title}
          onClose={() => setFollowerModalOpen(false)}
        />
      )}
    </div>
  );
};
