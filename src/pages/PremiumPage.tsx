/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PremiumUpsell } from '../components/PremiumUpsell';
import { useAuth } from '../store/authStore';

// Doubles as the pricing page (no ?status=) and the landing page Flutterwave
// redirects back to after checkout (?status=success|failed|cancelled|pending).
// The query param is only ever used to pick which banner to show — actual
// Premium access is always re-checked live via usePremiumStatus, never
// inferred from the query string itself.
export const PremiumPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const { isAuthenticated } = useAuth();
  const { isPremium, expiresAt, isLoading, refetch } = usePremiumStatus();

  useEffect(() => {
    // A webhook can finish verifying a moment after the redirect lands — one retry a couple
    // seconds later catches that without the user needing to refresh manually.
    if (status === 'success' || status === 'pending') {
      const timer = setTimeout(() => refetch(), 2500);
      return () => clearTimeout(timer);
    }
  }, [status, refetch]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
      {status === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-900 text-sm">Payment successful</h3>
            <p className="text-sm text-emerald-700">You're Premium — go build something.</p>
          </div>
        </div>
      )}
      {status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 text-sm">Payment didn't go through</h3>
            <p className="text-sm text-red-700">No charge was made. Feel free to try again below.</p>
          </div>
        </div>
      )}
      {status === 'cancelled' && (
        <div className="bg-stone-100 border border-stone-200 rounded-2xl p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-stone-800 text-sm">Checkout cancelled</h3>
            <p className="text-sm text-stone-500">No charge was made.</p>
          </div>
        </div>
      )}
      {status === 'pending' && !isPremium && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h3 className="font-bold text-amber-900 text-sm">Confirming your payment...</h3>
            <p className="text-sm text-amber-700">This usually only takes a few seconds.</p>
          </div>
        </div>
      )}

      {!isAuthenticated ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-stone-800">Log in to go Premium</h2>
          <Link to="/login" className="text-sm font-bold text-emerald-700 underline">Log in or create an account</Link>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : isPremium ? (
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-emerald-700" />
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-800">You're Premium</h2>
          {expiresAt && (
            <p className="text-sm text-stone-500">
              Renews {new Date(expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
          <Link
            to="/create"
            className="inline-block bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors"
          >
            Build a project page
          </Link>
        </div>
      ) : (
        <PremiumUpsell context="build a project page" />
      )}
    </div>
  );
};
