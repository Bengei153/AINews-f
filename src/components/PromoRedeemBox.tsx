/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, CheckCircle2 } from 'lucide-react';
import { redeemPromo } from '../api/promos';
import '../styles/mark-promos.css';

// "Have a promo code?" — drops into the Premium page. A successful code adds Premium days straight
// away; the plain-English reason a code can't be used (ended, full, already used) comes from the server.
export const PromoRedeemBox: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => redeemPromo(code.trim()),
    onSuccess: (result) => {
      setMessage({ kind: 'ok', text: result.message });
      setCode('');
      if (result.checkoutUrl) {
        // A discount code: nothing is granted yet — the person pays the discounted price, and Premium is added
        // when the payment is confirmed (the same flow as a normal checkout).
        window.location.assign(result.checkoutUrl);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['premium-status'] });
    },
    onError: (err: any) => setMessage({ kind: 'error', text: err?.detail || 'Could not use that code. Try again.' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setMessage(null);
    mutation.mutate();
  };

  if (!open) {
    return (
      <div className="promo-redeem promo-redeem--collapsed">
        <button type="button" className="promo-redeem__toggle" onClick={() => setOpen(true)}>
          <Ticket className="w-4 h-4" />
          Have a promo code?
        </button>
      </div>
    );
  }

  return (
    <form className="promo-redeem" onSubmit={handleSubmit}>
      <label className="promo-redeem__label" htmlFor="promo-code-input">
        Promo code
      </label>
      <div className="promo-redeem__row">
        <input
          id="promo-code-input"
          className="promo-redeem__input"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="e.g. AIB-7K3QX9PD"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit" className="promo-redeem__submit" disabled={mutation.isPending || !code.trim()}>
          {mutation.isPending ? 'Checking…' : 'Redeem'}
        </button>
      </div>
      {message && (
        <p className={`promo-redeem__message promo-redeem__message--${message.kind}`} role="status">
          {message.kind === 'ok' && <CheckCircle2 className="w-4 h-4" />}
          {message.text}
        </p>
      )}
    </form>
  );
};
