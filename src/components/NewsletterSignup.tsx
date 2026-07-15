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
      <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold">
        <CheckCircle2 className="w-4 h-4" />
        You're subscribed — look out for the next issue.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-200">
        <Mail className="w-3.5 h-3.5" />
        Get AI Brief in your inbox
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 text-sm px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <button
          type="submit"
          disabled={subscribeMutation.isPending}
          className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-70 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-colors whitespace-nowrap"
        >
          {subscribeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Subscribe'}
        </button>
      </div>
      {subscribeMutation.isError && (
        <p className="text-xs text-red-400">
          {(subscribeMutation.error as any)?.detail || 'Something went wrong — try again.'}
        </p>
      )}
    </form>
  );
};