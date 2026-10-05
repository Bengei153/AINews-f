/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { initiatePremiumCheckout } from '../api/premium';

interface PremiumUpsellProps {
  /** What they were trying to do, worked into the headline — e.g. "build a project page", "chat with Mark". */
  context: string;
}

export const PremiumUpsell: React.FC<PremiumUpsellProps> = ({ context }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setError(null);
    setIsRedirecting(true);
    try {
      const { checkoutUrl } = await initiatePremiumCheckout();
      // A real top-level navigation, not a fetch — Flutterwave's hosted checkout can't run
      // inside an iframe or behind an XHR redirect.
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err?.detail || 'Could not start checkout — try again in a moment.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white border border-emerald-200 rounded-2xl shadow-sm p-8 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
        <Sparkles className="w-7 h-7 text-emerald-700" />
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Go Premium to {context}</h2>
        <p className="text-sm text-stone-500 leading-relaxed">
          Premium members can publish a page for anything they've built with AI — chat it through with Mark, or fill
          it in yourself, then share a link people can actually try, download, or connect to.
        </p>
      </div>

      <ul className="text-left text-sm text-stone-600 space-y-2 max-w-xs mx-auto">
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          Build a page with Mark or the guided form
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          Share a download, a link, or your own API
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          Get real visibility in the public Projects feed
        </li>
      </ul>

      <button
        onClick={handleUpgrade}
        disabled={isRedirecting}
        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting to checkout...</span>
          </>
        ) : (
          <span>Upgrade to Premium</span>
        )}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
