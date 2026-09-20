/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Share2, Copy, Check, BookMarked, Users } from 'lucide-react';
import { getApiRootUrl } from '../api/client';
import { useAuth } from '../store/authStore';
import { SharedContentType } from '../types/api';
import { SendToFollowerModal } from './SendToFollowerModal';
import { useDropdownPosition } from '../hooks/useDropdownPosition';

const SHARE_PATH_SEGMENT: Record<SharedContentType, string> = {
  Article: 'articles',
  Video: 'videos',
  Tutorial: 'tutorials',
  Course: 'courses',
};

// Matches .share-menu__panel's min-width in index.css — see useDropdownPosition
// for why a known width (rather than measuring after render) is good enough here.
const PANEL_WIDTH_PX = 208;

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setMenuOpen(false);
  const position = useDropdownPosition(triggerRef, menuOpen, PANEL_WIDTH_PX, closeMenu);

  const shareUrl = `${getApiRootUrl()}/share/${SHARE_PATH_SEGMENT[contentType]}/${slug}`;

  // Portaled panel is no longer a DOM descendant of the trigger, so outside-click
  // has to check both refs rather than a single wrapping element.
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleCopyOrNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: summary, url: shareUrl });
        closeMenu();
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
    closeMenu();
    navigate(`/showcase/new?${params.toString()}`);
  };

  return (
    <div className={`share-menu share-menu--${variant} ${className || ''}`}>
      {variant === 'widget' && <h3 className="share-menu__title">Share</h3>}

      {variant === 'icon' ? (
        <button
          type="button"
          ref={triggerRef}
          className="share-menu__icon-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Share"
          title="Share"
        >
          <Share2 size={16} />
        </button>
      ) : (
        <button type="button" ref={triggerRef} className="share-menu__trigger" onClick={() => setMenuOpen((open) => !open)}>
          <Share2 size={16} />
          Share
        </button>
      )}

      {menuOpen &&
        createPortal(
          <div
            className="share-menu__panel"
            role="menu"
            ref={panelRef}
            style={{ position: 'fixed', top: position.top, left: position.left }}
          >
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
                  closeMenu();
                  setFollowerModalOpen(true);
                }}
                role="menuitem"
              >
                <Users size={15} />
                Send to a follower
              </button>
            )}
          </div>,
          document.body
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
