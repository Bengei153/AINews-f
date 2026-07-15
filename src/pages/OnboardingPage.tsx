/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store/authStore';
import { getInterests } from '../api/me';
import { Check, Compass, Sliders, Loader2, Sparkles } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, updateInterests } = useAuth();
  const navigate = useNavigate();

  // Selected interest IDs state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch available interests using TanStack Query
  const { data: interests, isLoading } = useQuery({
    queryKey: ['interests'],
    queryFn: getInterests,
  });

  const handleToggleInterest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateInterests(selectedIds);
      navigate('/', { replace: true });
    } catch (err) {
      alert('Failed to save interests. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-emerald-700 animate-spin" />
          <p className="text-sm font-semibold text-stone-500">Retrieving intelligence taxonomy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight leading-tight">
          Personalize your Briefing Feed
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Welcome to <span className="font-bold">AI Brief</span>, {user?.fullName}! Select one or more categories below to customize your home dashboard with matching digests, model releases, and tutorials.
        </p>
      </div>

      {/* Grid of Interests */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interests?.map((interest) => {
          const isSelected = selectedIds.includes(interest.id);
          return (
            <div
              key={interest.id}
              onClick={() => handleToggleInterest(interest.id)}
              className={`border rounded-xl p-5 cursor-pointer select-none transition-all duration-150 flex flex-col justify-between space-y-3 relative ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/25 ring-2 ring-emerald-500/15'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              
              {/* Checkmark indicator */}
              <div className="flex items-start justify-between">
                <span className="font-bold text-sm text-stone-800 font-serif leading-tight">
                  {interest.name}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-stone-300 bg-stone-50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                {interest.description}
              </p>

            </div>
          );
        })}
      </section>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-200">
        <button
          onClick={() => navigate('/')}
          className="text-stone-500 hover:text-stone-800 text-xs font-bold py-2.5 px-5 hover:bg-stone-100 rounded-lg transition-colors"
        >
          Skip for Now
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-md inline-flex items-center gap-2 transition-all cursor-pointer"
          id="onboarding-save-btn"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Personalizing feed...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Save & Continue</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
