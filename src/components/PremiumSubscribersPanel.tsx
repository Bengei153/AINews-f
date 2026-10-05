/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPremiumSubscribers } from '../api/premium';
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react';

export const PremiumSubscribersPanel: React.FC = () => {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['premium-subscribers'],
    queryFn: getPremiumSubscribers,
  });

  const activeCount = subscribers?.filter((s) => s.isActive).length ?? 0;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-stone-800 flex items-center gap-1.5">
          <Users className="w-5 h-5 text-emerald-800" />
          Premium Subscribers
        </h2>
        {subscribers && (
          <span className="text-xs font-bold text-stone-500">{activeCount} active of {subscribers.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
        </div>
      ) : !subscribers || subscribers.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-8">No one has subscribed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Renews / Expired</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.userId} className="border-b border-stone-50">
                  <td className="py-2.5 pr-4 font-medium text-stone-800">{s.fullName}</td>
                  <td className="py-2.5 pr-4 text-stone-500">{s.email}</td>
                  <td className="py-2.5 pr-4 text-stone-500">
                    {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-stone-400 font-bold text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Lapsed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
