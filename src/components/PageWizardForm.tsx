/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OwnedCreatedPage, UpdatePagePayload, DeliveryMode } from '../api/createdPages';
import { ImageUploadWidget } from './ImageUploadWidget';
import { Loader2, Download, Link2, Plug } from 'lucide-react';

const fieldClass =
  'w-full text-sm px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/50';

const DELIVERY_OPTIONS: { value: DeliveryMode; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: 'Download', label: 'Download', hint: 'Link to where the download lives (GitHub Releases, Drive, etc.)', icon: <Download className="w-4 h-4" /> },
  { value: 'Link', label: 'Link', hint: 'A page or app people open directly', icon: <Link2 className="w-4 h-4" /> },
  { value: 'ConnectBackend', label: 'Connect', hint: 'Your own URL or API — visitors can try it live', icon: <Plug className="w-4 h-4" /> },
];

interface PageWizardFormProps {
  page: OwnedCreatedPage;
  isSaving: boolean;
  onSave: (payload: UpdatePagePayload) => void;
}

export const PageWizardForm: React.FC<PageWizardFormProps> = ({ page, isSaving, onSave }) => {
  const [title, setTitle] = useState(page.title);
  const [shortDescription, setShortDescription] = useState(page.shortDescription);
  const [detailedDescription, setDetailedDescription] = useState(page.detailedDescription);
  const [category, setCategory] = useState(page.category);
  const [toolsUsedText, setToolsUsedText] = useState(page.toolsUsedText);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(page.deliveryMode);
  const [deliveryUrl, setDeliveryUrl] = useState(page.deliveryUrl);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(page.coverImageUrl);

  // Re-sync local form state whenever the underlying page changes from elsewhere — most
  // importantly, after a Mark chat turn updates fields while this tab wasn't active.
  useEffect(() => {
    setTitle(page.title);
    setShortDescription(page.shortDescription);
    setDetailedDescription(page.detailedDescription);
    setCategory(page.category);
    setToolsUsedText(page.toolsUsedText);
    setDeliveryMode(page.deliveryMode);
    setDeliveryUrl(page.deliveryUrl);
    setCoverImageUrl(page.coverImageUrl);
  }, [page]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, shortDescription, detailedDescription, category, toolsUsedText, deliveryMode, deliveryUrl, coverImageUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Title *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} required maxLength={150} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">One-sentence hook</label>
        <input
          type="text"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className={fieldClass}
          placeholder="What is this, in one sentence?"
          maxLength={300}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">The full story (Markdown supported)</label>
        <textarea
          value={detailedDescription}
          onChange={(e) => setDetailedDescription(e.target.value)}
          className={`${fieldClass} h-48`}
          placeholder="What does it do? Why did you build it? How should someone use it?"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClass}
            placeholder="e.g. Chrome Extension, Study App"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block">Tools you used</label>
          <input
            type="text"
            value={toolsUsedText}
            onChange={(e) => setToolsUsedText(e.target.value)}
            className={fieldClass}
            placeholder="ChatGPT, Zapier, ..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-600 block">How do people get to it? *</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DELIVERY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDeliveryMode(opt.value)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                deliveryMode === opt.value ? 'border-emerald-600 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                {opt.icon}
                {opt.label}
              </div>
              <p className="text-[10px] text-stone-500 mt-1 leading-snug">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">
          {deliveryMode === 'ConnectBackend' ? 'Your URL or API endpoint *' : 'URL *'}
        </label>
        <input
          type="url"
          value={deliveryUrl}
          onChange={(e) => setDeliveryUrl(e.target.value)}
          className={fieldClass}
          placeholder="https://..."
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-stone-600 block">Cover image</label>
        <ImageUploadWidget folder="CreatedPageCovers" currentUrl={coverImageUrl} onUploaded={(url) => setCoverImageUrl(url || null)} />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-stone-900 hover:bg-stone-800 disabled:opacity-75 text-white font-bold py-2.5 px-6 rounded-lg text-xs shadow-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
};
