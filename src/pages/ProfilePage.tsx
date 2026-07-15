/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store/authStore';
import { getInterests } from '../api/me';
import { Sliders, Check, User, Mail, Shield, Sparkles, Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateInterests } = useAuth();
  
  // Selected interest names state (the backend saves interest NAMES as strings)
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch available interests to build the matching lists
  const { data: interests, isLoading } = useQuery({
    queryKey: ['interests-settings'],
    queryFn: getInterests,
  });

  // Sync user's existing choices with local state on load
  useEffect(() => {
    if (user?.interests) {
      setSelectedNames(user.interests);
    }
  }, [user]);

  const handleToggleInterest = (name: string) => {
    setSaveSuccess(false);
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (!interests) return;
      
      // Convert name selections back to IDs for the API request
      const selectedIds = interests
        .filter((i) => selectedNames.includes(i.name))
        .map((i) => i.id);

      await updateInterests(selectedIds);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // clear banner
    } catch (err) {
      alert('Failed to update interests. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
          <p className="text-sm font-semibold text-stone-500">Retrieving profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-8 h-8 text-emerald-800" />
          Intelligence Settings
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage your personal details, secure session roles, and newsfeed personalization criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Panel: Profile Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-2">
            Secure Profile
          </h2>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-emerald-800 text-lg uppercase select-none">
              {user.fullName.substring(0, 2)}
            </div>
            <div>
              <p className="font-serif font-bold text-stone-800 leading-tight">{user.fullName}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mt-0.5">{user.role} Account</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Full Name: <strong className="font-semibold text-stone-800">{user.fullName}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="truncate">Email: <strong className="font-semibold text-stone-800">{user.email}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <Shield className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Role Privilege: <strong className="font-semibold text-stone-800 capitalize">{user.role}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Panel: Interests Multi-Select Editor Form */}
        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="font-serif text-lg font-bold text-stone-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-700" />
              Newsfeed Interests
            </h2>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Interests updated successfully!
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <p className="text-xs text-stone-500 leading-relaxed">
              These selections govern which briefings populate your personalized homepage recommendations. You can toggle any of the seeded options.
            </p>

            {/* Checkbox Grid list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {interests?.map((interest) => {
                const isSelected = selectedNames.includes(interest.name);
                return (
                  <div
                    key={interest.id}
                    onClick={() => handleToggleInterest(interest.name)}
                    className={`border rounded-xl p-4 cursor-pointer select-none transition-all duration-150 flex items-start gap-3 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500/10'
                        : 'border-stone-100 bg-stone-50/30 hover:border-stone-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-stone-800 leading-tight">{interest.name}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-normal">{interest.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Actions bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
                id="profile-save-btn"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Save Preference Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};
