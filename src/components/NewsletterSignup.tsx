/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '../api/newsletter';

export const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');

  const subscribeMutation = useMutation({
    mutationFn: subscribeToNewsletter,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribeMutation.mutate(email);
  };

  if (subscribeMutation.isSuccess) {
    return (
      <div className="newsletter-success">
        <CheckCircle2 className="w-4 h-4" />
        You're subscribed. Look out for the next issue.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="newsletter-form">
      <div className="newsletter-form__label">
        <Mail className="w-3.5 h-3.5" />
        Get AI Brief in your inbox
      </div>
      <div className="newsletter-form__row">
        <input
          type="email"
          required
          placeholder="Enter your professional email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="newsletter-form__input"
        />
        <button
          type="submit"
          disabled={subscribeMutation.isPending}
          className="newsletter-form__button"
        >
          {subscribeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Subscribe'}
        </button>
      </div>
      {subscribeMutation.isError && (
        <p className="text-xs text-red-400">
          {(subscribeMutation.error as any)?.detail || 'Something went wrong - try again.'}
        </p>
      )}
    </form>
  );
};
