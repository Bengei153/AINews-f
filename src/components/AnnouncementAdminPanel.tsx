/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Pencil, Power, Trash2, Loader2, Instagram, Sparkles, Tag } from 'lucide-react';
import {
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  setAnnouncementActive,
  deleteAnnouncement,
  AdminAnnouncement,
  AnnouncementKind,
} from '../api/announcements';
import '../styles/mark-promos.css';
import '../styles/announcements-admin.css';

interface AnnouncementAdminPanelProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const KIND_LABELS: Record<AnnouncementKind, string> = {
  General: 'General',
  NewFeature: 'New feature',
  Promo: 'Promo',
  Social: 'Follow us',
};

// <input type="datetime-local"> works in local time without a zone; the server wants an exact moment.
const toLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value: string): string | null => (value ? new Date(value).toISOString() : null);

const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

interface FormValues {
  title: string;
  message: string;
  kind: AnnouncementKind;
  imageUrl: string;
  buttonLabel: string;
  buttonUrl: string;
  showAsPopup: boolean;
  isActive: boolean;
  startsAt: string; // local input value, '' = live straight away
  endsAt: string; // '' = until switched off
}

const emptyForm = (): FormValues => ({
  title: '',
  message: '',
  kind: 'General',
  imageUrl: '',
  buttonLabel: '',
  buttonUrl: '',
  showAsPopup: true,
  isActive: true,
  startsAt: '',
  endsAt: '',
});

// One-tap starting points for the announcements you'll send most. They only fill the form — nothing is sent
// until you press Publish, and every field can still be changed.
const TEMPLATES: { label: string; icon: React.ReactNode; values: Partial<FormValues> }[] = [
  {
    label: 'Follow our Instagram',
    icon: <Instagram className="w-3.5 h-3.5" />,
    values: {
      kind: 'Social',
      title: 'Follow us on Instagram',
      message: 'Daily AI tips, new tools and behind-the-scenes updates from AI Brief.',
      buttonLabel: 'Follow on Instagram',
      buttonUrl: 'https://www.instagram.com/',
    },
  },
  {
    label: 'New features',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    values: {
      kind: 'NewFeature',
      title: 'New features just landed',
      message: 'We added new things to AI Brief. Take a look at what’s new.',
      buttonLabel: 'See what’s new',
      buttonUrl: 'https://ai-brief.space/',
    },
  },
  {
    label: 'Promo dropped',
    icon: <Tag className="w-3.5 h-3.5" />,
    values: {
      kind: 'Promo',
      title: 'A promo just dropped',
      message: 'Limited time and limited spots. Claim it before it’s gone.',
      buttonLabel: 'Claim the promo',
      buttonUrl: 'https://ai-brief.space/premium',
    },
  },
];

const fromAnnouncement = (a: AdminAnnouncement): FormValues => ({
  title: a.title,
  message: a.message,
  kind: a.kind,
  imageUrl: a.imageUrl ?? '',
  buttonLabel: a.buttonLabel ?? '',
  buttonUrl: a.buttonUrl ?? '',
  showAsPopup: a.showAsPopup,
  isActive: a.isActive,
  startsAt: toLocalInput(a.startsAt),
  endsAt: toLocalInput(a.endsAt),
});

const toPayload = (v: FormValues) => ({
  title: v.title.trim(),
  message: v.message.trim(),
  kind: v.kind,
  imageUrl: v.imageUrl.trim() || null,
  buttonLabel: v.buttonLabel.trim() || null,
  buttonUrl: v.buttonUrl.trim() || null,
  showAsPopup: v.showAsPopup,
  startsAt: fromLocalInput(v.startsAt),
  endsAt: fromLocalInput(v.endsAt),
});

interface AnnouncementFormProps {
  values: FormValues;
  onChange: (values: FormValues) => void;
  showActiveSwitch: boolean;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ values, onChange, showActiveSwitch }) => {
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => onChange({ ...values, [key]: value });

  return (
    <>
      <div className="promo-fields">
        <label className="promo-fields__item promo-fields__item--wide">
          <span>Title (shown big)</span>
          <input value={values.title} maxLength={80} onChange={(e) => set('title', e.target.value)} placeholder="New features just landed" />
        </label>
        <label className="promo-fields__item promo-fields__item--wide">
          <span>Message</span>
          <textarea value={values.message} maxLength={500} onChange={(e) => set('message', e.target.value)} placeholder="One or two short sentences." />
          <span className="ann-hint">{values.message.length}/500 — keep it short; people read this on a phone.</span>
        </label>
        <label className="promo-fields__item">
          <span>Type</span>
          <select value={values.kind} onChange={(e) => set('kind', e.target.value as AnnouncementKind)}>
            {(Object.keys(KIND_LABELS) as AnnouncementKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="promo-fields__item">
          <span>Image link (optional, https)</span>
          <input value={values.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" />
        </label>
        <label className="promo-fields__item">
          <span>Button text (optional)</span>
          <input value={values.buttonLabel} maxLength={30} onChange={(e) => set('buttonLabel', e.target.value)} placeholder="Follow on Instagram" />
        </label>
        <label className="promo-fields__item">
          <span>Button link (https)</span>
          <input value={values.buttonUrl} onChange={(e) => set('buttonUrl', e.target.value)} placeholder="https://instagram.com/yourpage" />
          <span className="ann-hint">A link to an AI Brief article opens inside the app; any other link opens in the browser.</span>
        </label>
        <label className="promo-fields__item">
          <span>Starts (optional)</span>
          <input type="datetime-local" value={values.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
        </label>
        <label className="promo-fields__item">
          <span>Ends (optional)</span>
          <input type="datetime-local" value={values.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </label>
      </div>
      <div className="ann-checks">
        <label className="ann-check">
          <input type="checkbox" checked={values.showAsPopup} onChange={(e) => set('showAsPopup', e.target.checked)} />
          Also show as a pop-up when people open the app
        </label>
        {showActiveSwitch && (
          <label className="ann-check">
            <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Live now
          </label>
        )}
      </div>
    </>
  );
};

// Announcements: a message every app user sees — as a pop-up on launch (optional) and always in the app's
// notifications while it is live. Editing one makes it show again to people who already saw it.
export const AnnouncementAdminPanel: React.FC<AnnouncementAdminPanelProps> = ({ onNotify }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormValues>(emptyForm);

  const { data: announcements, isLoading } = useQuery({ queryKey: ['admin-announcements'], queryFn: getAdminAnnouncements });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });

  const createMutation = useMutation({
    mutationFn: () => createAnnouncement({ ...toPayload(form), isActive: form.isActive }),
    onSuccess: () => {
      refresh();
      setForm(emptyForm());
      onNotify('success', 'Announcement published.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not publish the announcement.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAnnouncement(editingId as string, toPayload(editForm)),
    onSuccess: () => {
      refresh();
      setEditingId(null);
      onNotify('success', 'Announcement updated. People will see it again.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not update the announcement.'),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setAnnouncementActive(id, active),
    onSuccess: (a) => {
      refresh();
      onNotify('success', a.isActive ? 'Announcement is on.' : 'Announcement switched off.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not change the announcement.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      refresh();
      onNotify('success', 'Announcement deleted.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not delete the announcement.'),
  });

  const startEditing = (a: AdminAnnouncement) => {
    setEditingId(a.id);
    setEditForm(fromAnnouncement(a));
  };

  const handleDelete = (a: AdminAnnouncement) => {
    if (window.confirm(`Delete "${a.title}"? This can't be undone.`)) deleteMutation.mutate(a.id);
  };

  return (
    <div className="promo-admin">
      <section className="promo-admin__card">
        <header>
          <h2 className="promo-admin__title">
            <Megaphone className="w-5 h-5" /> Announcements
          </h2>
          <p className="promo-admin__sub">
            Write a message that every app user sees: as a pop-up when they open the app, and in their notifications. Use it for things like
            “follow our Instagram”, “new features added” or “a promo has dropped”.
          </p>
        </header>

        <div className="ann-templates">
          <p className="ann-templates__label">Start from…</p>
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" className="ann-chip" onClick={() => setForm({ ...emptyForm(), ...t.values })}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <form
          className="promo-admin__form"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <AnnouncementForm values={form} onChange={setForm} showActiveSwitch />
          <div className="promo-admin__actions">
            <button type="submit" className="promo-admin__primary" disabled={createMutation.isPending || !form.title.trim() || !form.message.trim()}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Publish announcement
            </button>
          </div>
        </form>
      </section>

      <section className="promo-admin__list">
        {isLoading ? (
          <div className="promo-admin__empty">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="promo-admin__empty">No announcements yet. Publish your first one above.</div>
        ) : (
          announcements.map((a) =>
            editingId === a.id ? (
              <article key={a.id} className="ann-card">
                <form
                  className="promo-admin__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMutation.mutate();
                  }}
                >
                  <AnnouncementForm values={editForm} onChange={setEditForm} showActiveSwitch={false} />
                  <div className="promo-admin__actions">
                    <button type="button" className="promo-admin__secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="promo-admin__primary" disabled={updateMutation.isPending || !editForm.title.trim() || !editForm.message.trim()}>
                      {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save changes
                    </button>
                  </div>
                </form>
              </article>
            ) : (
              <article key={a.id} className="ann-card">
                <div className="ann-card__top">
                  <div>
                    <div className="ann-card__meta">
                      <span className={`ann-pill ann-pill--${a.state.toLowerCase()}`}>{a.state}</span>
                      <span className="ann-pill ann-pill--kind">{KIND_LABELS[a.kind]}</span>
                      {a.showAsPopup && <span className="ann-pill ann-pill--kind">Pop-up</span>}
                    </div>
                    <h3 className="ann-card__title">{a.title}</h3>
                  </div>
                </div>
                <p className="ann-card__message">{a.message}</p>
                <p className="ann-card__facts">
                  {a.buttonLabel && a.buttonUrl ? `Button “${a.buttonLabel}” → ${a.buttonUrl}. ` : 'No button. '}
                  {a.startsAt ? `From ${formatWhen(a.startsAt)}. ` : ''}
                  {a.endsAt ? `Until ${formatWhen(a.endsAt)}. ` : ''}
                  Created {formatWhen(a.created)}.
                </p>
                <div className="ann-card__actions">
                  <button type="button" className="ann-card__btn" onClick={() => startEditing(a)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    className="ann-card__btn"
                    disabled={activeMutation.isPending}
                    onClick={() => activeMutation.mutate({ id: a.id, active: !a.isActive })}
                  >
                    <Power className="w-3.5 h-3.5" /> {a.isActive ? 'Switch off' : 'Switch on'}
                  </button>
                  <button type="button" className="ann-card__btn ann-card__btn--danger" onClick={() => handleDelete(a)}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </article>
            )
          )
        )}
      </section>
    </div>
  );
};
