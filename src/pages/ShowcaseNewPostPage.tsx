/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createShowcasePost } from '../api/showcase';
import { ImageUploadWidget } from '../components/ImageUploadWidget';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export const ShowcaseNewPostPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [toolsUsed, setToolsUsed] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createShowcasePost({
        title,
        description,
        toolsUsed: toolsUsed || null,
        imageUrl: imageUrl || null,
      }),
    onSuccess: (id) => {
      navigate(`/showcase/${id}`);
    },
    onError: (err: any) => {
      setError(err?.detail || 'Failed to publish your project — try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
      <Link to="/showcase" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Showcase
      </Link>

      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-emerald-800" />
          Share your project
        </h1>
        <p className="text-sm text-stone-500">
          Tell the community what you built and which AI tools helped you build it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. A study-buddy chatbot for my chemistry class"
            maxLength={200}
            required
            className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does it do? What was the hardest part? What would you tell someone trying this themselves?"
            maxLength={3000}
            required
            className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Tools used <span className="text-stone-400 normal-case font-medium">(optional)</span></label>
          <input
            type="text"
            value={toolsUsed}
            onChange={(e) => setToolsUsed(e.target.value)}
            placeholder="e.g. Claude, Cursor, Midjourney"
            maxLength={300}
            className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Cover image <span className="text-stone-400 normal-case font-medium">(optional)</span></label>
          <ImageUploadWidget folder="ShowcasePosts" currentUrl={imageUrl} onUploaded={(url) => setImageUrl(url || null)} />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim() || !description.trim()}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer transition-colors"
          >
            {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Publish project
          </button>
        </div>
      </form>
    </div>
  );
};