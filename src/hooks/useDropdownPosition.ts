/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RefObject, useLayoutEffect, useState } from 'react';

export interface DropdownPosition {
  top: number;
  left: number;
}

const VIEWPORT_MARGIN = 8; // px gap kept from the viewport edges so the panel never touches them

/**
 * Positions a portaled dropdown panel relative to its trigger, in viewport
 * (position: fixed) coordinates — so it renders in document.body rather than
 * wherever the trigger happens to sit in the DOM, and can't be clipped by an
 * ancestor's `overflow: hidden` (e.g. .editorial-card, used to round card
 * image corners) or push the page wider than the viewport on mobile.
 *
 * Closes-on-scroll rather than re-tracking the trigger while open: since the
 * panel is `position: fixed`, it wouldn't follow the trigger as the page
 * scrolls underneath it, so a stale position would look detached. Simply
 * closing on scroll is the standard, simpler fix.
 */
export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement>,
  open: boolean,
  panelWidthPx: number,
  onDismiss: () => void
): DropdownPosition {
  const [position, setPosition] = useState<DropdownPosition>({ top: -9999, left: -9999 });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const maxLeft = Math.max(window.innerWidth - panelWidthPx - VIEWPORT_MARGIN, VIEWPORT_MARGIN);
      const left = Math.min(Math.max(rect.right - panelWidthPx, VIEWPORT_MARGIN), maxLeft);
      const top = rect.bottom + VIEWPORT_MARGIN;
      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', onDismiss, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', onDismiss, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, panelWidthPx]);

  return position;
}
