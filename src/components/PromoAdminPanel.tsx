/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Plus, Copy, Pause, Play, Trash2, Users, Loader2, Pencil } from 'lucide-react';
import {
  getPromos,
  getPromoRedemptions,
  createPromo,
  updatePromo,
  setPromoPaused,
  deletePromo,
  Promo,
} from '../api/promos';
import '../styles/mark-promos.css';

interface PromoAdminPanelProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

// <input type="datetime-local"> works in local time without a zone; the server wants an exact moment.
const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value: string): string => new Date(value).toISOString();

const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const defaultStart = (): string => toLocalInput(new Date().toISOString());
const defaultEnd = (): string => toLocalInput(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString());

interface PromoFormValues {
  code: string;
  name: string;
  description: string;
  grantDays: number;
  startsAt: string; // local input value
  endsAt: string;
  maxRedemptions: number;
}

const emptyForm = (): PromoFormValues => ({
  code: '',
  name: '',
  description: '',
  grantDays: 30,
  startsAt: defaultStart(),
  endsAt: defaultEnd(),
  maxRedemptions: 50,
});

// Host promos: create a code, give it out, and watch the seats fill. A promo gives free Premium days to the
// first N people who redeem it inside its time window; the server enforces the window and the cap.
export const PromoAdminPanel: React.FC<PromoAdminPanelProps> = ({ onNotify }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PromoFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: promos, isLoading } = useQuery({ queryKey: ['admin-promos'], queryFn: getPromos });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-promos'] });

  const createMutation = useMutation({
    mutationFn: () =>
      createPromo({
        code: form.code.trim() || null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        grantDays: form.grantDays,
        startsAt: fromLocalInput(form.startsAt),
        endsAt: fromLocalInput(form.endsAt),
        maxRedemptions: form.maxRedemptions,
      }),
    onSuccess: (promo) => {
      refresh();
      setForm(emptyForm());
      onNotify('success', `Promo created. Code: ${promo.code}`);
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not create the promo.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PromoFormValues }) =>
      updatePromo(id, {
        name: values.name.trim(),
        description: values.description.trim() || null,
        startsAt: fromLocalInput(values.startsAt),
        endsAt: fromLocalInput(values.endsAt),
        maxRedemptions: values.maxRedemptions,
      }),
    onSuccess: () => {
      refresh();
      setEditingId(null);
      onNotify('success', 'Promo updated.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not update the promo.'),
  });

  const pauseMutation = useMutation({
    mutationFn: ({ id, paused }: { id: string; paused: boolean }) => setPromoPaused(id, paused),
    onSuccess: (promo) => {
      refresh();
      onNotify('success', promo.isPaused ? 'Promo paused.' : 'Promo is live again.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not change the promo.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromo(id),
    onSuccess: () => {
      refresh();
      onNotify('success', 'Promo deleted.');
    },
    onError: (err: any) => onNotify('error', err?.detail || 'Could not delete the promo.'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      onNotify('success', `Copied ${code}`);
    } catch {
      onNotify('error', 'Could not copy — select the code and copy it by hand.');
    }
  };

  const handleDelete = (promo: Promo) => {
    if (window.confirm(`Delete the promo "${promo.name}"? This can't be undone.`)) deleteMutation.mutate(promo.id);
  };

  return (
    <div className="promo-admin">
      <section className="promo-admin__card">
        <header className="promo-admin__head">
          <h2 className="promo-admin__title">
            <Ticket className="w-5 h-5" /> Promos
          </h2>
          <p className="promo-admin__sub">
            Create a code that gives free Premium days to the first people who use it, inside the dates you pick. Give
            the code out yourself; the site stops accepting it when the dates end or the spots run out.
          </p>
        </header>

        <form className="promo-admin__form" onSubmit={handleCreate}>
          <PromoFields values={form} onChange={setForm} showCodeAndDays />
          <div className="promo-admin__actions">
            <button type="submit" className="promo-admin__primary" disabled={createMutation.isPending || !form.name.trim()}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create promo
            </button>
          </div>
        </form>
      </section>

      <section className="promo-admin__list">
        {isLoading ? (
          <div className="promo-admin__empty">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !promos || promos.length === 0 ? (
          <div className="promo-admin__empty">No promos yet. Create your first one above.</div>
        ) : (
          promos.map((promo) =>
            editingId === promo.id ? (
              <EditPromoCard
                key={promo.id}
                promo={promo}
                isSaving={updateMutation.isPending}
                onCancel={() => setEditingId(null)}
                onSave={(values) => updateMutation.mutate({ id: promo.id, values })}
              />
            ) : (
              <article key={promo.id} className="promo-card">
                <div className="promo-card__top">
                  <div>
                    <span className={`promo-card__state promo-card__state--${promo.state.toLowerCase()}`}>{promo.state}</span>
                    <h3 className="promo-card__name">{promo.name}</h3>
                  </div>
                  <button type="button" className="promo-card__code" onClick={() => copyCode(promo.code)} title="Copy code">
                    {promo.code}
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {promo.description && <p className="promo-card__desc">{promo.description}</p>}

                <p className="promo-card__facts">
                  {promo.grantDays} days of Premium · {formatWhen(promo.startsAt)} → {formatWhen(promo.endsAt)}
                </p>

                <div className="promo-card__seats">
                  <div
                    className="promo-card__bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={promo.maxRedemptions}
                    aria-valuenow={promo.redemptionCount}
                  >
                    <span style={{ width: `${Math.min(100, (promo.redemptionCount / promo.maxRedemptions) * 100)}%` }} />
                  </div>
                  <span className="promo-card__seat-text">
                    {promo.redemptionCount} of {promo.maxRedemptions} used · {promo.seatsLeft} left
                  </span>
                </div>

                <div className="promo-card__actions">
                  <button type="button" onClick={() => setViewingId(viewingId === promo.id ? null : promo.id)}>
                    <Users className="w-3.5 h-3.5" /> Who used it
                  </button>
                  <button type="button" onClick={() => setEditingId(promo.id)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => pauseMutation.mutate({ id: promo.id, paused: !promo.isPaused })}
                    disabled={pauseMutation.isPending}
                  >
                    {promo.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    {promo.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  {promo.redemptionCount === 0 && (
                    <button type="button" className="promo-card__danger" onClick={() => handleDelete(promo)} disabled={deleteMutation.isPending}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>

                {viewingId === promo.id && <Redeemers promoId={promo.id} />}
              </article>
            )
          )
        )}
      </section>
    </div>
  );
};

interface PromoFieldsProps {
  values: PromoFormValues;
  onChange: (values: PromoFormValues) => void;
  showCodeAndDays?: boolean;
}

const PromoFields: React.FC<PromoFieldsProps> = ({ values, onChange, showCodeAndDays }) => {
  const set = <K extends keyof PromoFormValues>(key: K, value: PromoFormValues[K]) => onChange({ ...values, [key]: value });

  return (
    <div className="promo-fields">
      <label className="promo-fields__item">
        <span>Name (only you see this)</span>
        <input type="text" value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Launch week" required />
      </label>

      {showCodeAndDays && (
        <label className="promo-fields__item">
          <span>Code (leave blank for a random one)</span>
          <input type="text" value={values.code} onChange={(e) => set('code', e.target.value)} placeholder="e.g. LAUNCH30" maxLength={40} />
        </label>
      )}

      {showCodeAndDays && (
        <label className="promo-fields__item">
          <span>Days of Premium it gives</span>
          <input type="number" min={1} max={365} value={values.grantDays} onChange={(e) => set('grantDays', Number(e.target.value))} required />
        </label>
      )}

      <label className="promo-fields__item">
        <span>How many people can use it</span>
        <input type="number" min={1} value={values.maxRedemptions} onChange={(e) => set('maxRedemptions', Number(e.target.value))} required />
      </label>

      <label className="promo-fields__item">
        <span>Starts</span>
        <input type="datetime-local" value={values.startsAt} onChange={(e) => set('startsAt', e.target.value)} required />
      </label>

      <label className="promo-fields__item">
        <span>Ends</span>
        <input type="datetime-local" value={values.endsAt} onChange={(e) => set('endsAt', e.target.value)} required />
      </label>

      <label className="promo-fields__item promo-fields__item--wide">
        <span>Note (optional)</span>
        <input type="text" value={values.description} onChange={(e) => set('description', e.target.value)} maxLength={500} />
      </label>
    </div>
  );
};

interface EditPromoCardProps {
  promo: Promo;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (values: PromoFormValues) => void;
}

// The code and the days granted stay fixed once a promo exists — changing them would rewrite a deal people
// already accepted — so editing covers the name, the dates and the number of spots.
const EditPromoCard: React.FC<EditPromoCardProps> = ({ promo, isSaving, onCancel, onSave }) => {
  const [values, setValues] = useState<PromoFormValues>({
    code: promo.code,
    name: promo.name,
    description: promo.description,
    grantDays: promo.grantDays,
    startsAt: toLocalInput(promo.startsAt),
    endsAt: toLocalInput(promo.endsAt),
    maxRedemptions: promo.maxRedemptions,
  });

  return (
    <form
      className="promo-card promo-card--editing"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values);
      }}
    >
      <p className="promo-card__facts">
        Editing <strong>{promo.code}</strong> · {promo.grantDays} days of Premium (fixed) · {promo.redemptionCount} already used
      </p>
      <PromoFields values={values} onChange={setValues} />
      <div className="promo-admin__actions">
        <button type="button" className="promo-admin__secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="promo-admin__primary" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

const Redeemers: React.FC<{ promoId: string }> = ({ promoId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-promo-redemptions', promoId],
    queryFn: () => getPromoRedemptions(promoId),
  });

  if (isLoading) return <p className="promo-card__redeemers-note">Loading…</p>;
  if (isError) return <p className="promo-card__redeemers-note">Could not load who used this promo.</p>;
  if (!data || data.length === 0) return <p className="promo-card__redeemers-note">Nobody has used this promo yet.</p>;

  return (
    <ul className="promo-card__redeemers">
      {data.map((r, i) => (
        <li key={`${r.email}-${i}`}>
          <span>{r.fullName ? `${r.fullName} · ${r.email}` : r.email}</span>
          <time dateTime={r.redeemedAt}>{formatWhen(r.redeemedAt)}</time>
        </li>
      ))}
    </ul>
  );
};
