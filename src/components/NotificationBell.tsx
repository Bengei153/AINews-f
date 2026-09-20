/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getMyNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import { Notification, SharedContentType } from '../types/api';
import { useDropdownPosition } from '../hooks/useDropdownPosition';

const CONTENT_PATH_SEGMENT: Record<SharedContentType, string | null> = {
  Article: 'articles',
  Video: 'videos',
  Tutorial: 'tutorials',
  // Courses have no in-app detail page — clicking a shared course notification just closes the panel.
  Course: null,
};

const POLL_INTERVAL_MS = 30000;
// Matches .notification-panel's width in index.css — see useDropdownPosition
// for why a known width (rather than measuring after render) is good enough here.
const PANEL_WIDTH_PX = 320;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closePanel = () => setPanelOpen(false);
  const position = useDropdownPosition(triggerRef, panelOpen, PANEL_WIDTH_PX, closePanel);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      getUnreadNotificationCount()
        .then((count) => {
          if (!cancelled) setUnreadCount(count);
        })
        .catch(() => {
          /* transient failure — next poll will retry */
        });
    };
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Portaled panel is no longer a DOM descendant of the trigger, so outside-click
  // has to check both refs rather than a single wrapping element.
  useEffect(() => {
    if (!panelOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        closePanel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  const handleOpen = async () => {
    const nextOpen = !panelOpen;
    setPanelOpen(nextOpen);
    if (nextOpen && !loaded) {
      const page = await getMyNotifications({ pageSize: 20 });
      setNotifications(page.items);
      setLoaded(true);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationRead(notification.id).catch(() => {
        /* best-effort — the item still visually opens either way */
      });
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
    }

    closePanel();

    const pathSegment = notification.contentType ? CONTENT_PATH_SEGMENT[notification.contentType] : null;
    if (pathSegment && notification.contentSlug) {
      navigate(`/${pathSegment}/${notification.contentSlug}`);
    }
  };

  return (
    <div className="notification-bell">
      <button type="button" ref={triggerRef} className="notification-bell__trigger" onClick={handleOpen} aria-label="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {panelOpen &&
        createPortal(
          <div className="notification-panel" ref={panelRef} style={{ position: 'fixed', top: position.top, left: position.left }}>
            <div className="notification-panel__header">
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <button type="button" className="notification-panel__mark-all" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>

            {!loaded && <div className="notification-panel__empty">Loading…</div>}

            {loaded && notifications.length === 0 && <div className="notification-panel__empty">Nothing here yet.</div>}

            {loaded && notifications.length > 0 && (
              <ul className="notification-panel__list">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={`notification-panel__item${notification.isRead ? '' : ' notification-panel__item--unread'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {notification.contentThumbnailUrl && (
                        <img src={notification.contentThumbnailUrl} alt="" className="notification-panel__thumbnail" />
                      )}
                      <span className="notification-panel__text">
                        <strong>{notification.actorName}</strong> shared "{notification.contentTitle}"
                        {notification.message && <em className="notification-panel__message">"{notification.message}"</em>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
