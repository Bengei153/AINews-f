/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createShowcasePost } from '../api/showcase';
import { ImageUploadWidget } from '../components/ImageUploadWidget';
import { ArrowLeft, Loader2, Sparkles, Link2 } from 'lucide-react';
import { SharedContentType } from '../types/api';

const VALID_SHARED_TYPES: SharedContentType[] = ['Article', 'Video', 'Tutorial', 'Course'];

export const ShowcaseNewPostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [toolsUsed, setToolsUsed] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Arrived here via a Video/Tutorial/Course/Article's "Post to Showcase"
  // share action (see ShareMenu) — sharedType/sharedId get sent to the
  // backend, the rest is just for the preview chip below so we don't need
  // an extra fetch before the user has even started writing.
  const rawSharedType = searchParams.get('sharedType');
  const sharedType: SharedContentType | null = VALID_SHARED_TYPES.includes(rawSharedType as SharedContentType)
    ? (rawSharedType as SharedContentType)
    : null;
  const sharedId = searchParams.get('sharedId');
  const sharedTitle = searchParams.get('sharedTitle');
  const sharedThumbnail = searchParams.get('sharedThumbnail');
  const hasSharedContent = !!(sharedType && sharedId);

  const createMutation = useMutation({
    mutationFn: () =>
      createShowcasePost({
        title,
        description,
        toolsUsed: toolsUsed || null,
        imageUrl: imageUrl || null,
        sharedContentType: hasSharedContent ? sharedType : null,
        sharedContentId: hasSharedContent ? sharedId : null,
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

      <div>
        <div className="section-kicker">
          <Sparkles className="w-3.5 h-3.5" />
          Share your work
        </div>
        <h1 className="editorial-heading editorial-heading--page font-serif" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.8rem)' }}>
          Share your project
        </h1>
        <p className="editorial-lede">
          Tell the community what you built and which AI tools helped you build it.
        </p>
      </div>

      {hasSharedContent && (
        <div className="shared-content-chip shared-content-chip--preview">
          {sharedThumbnail && <img src={sharedThumbnail} alt="" />}
          <span>
            <Link2 className="w-3.5 h-3.5" />
            Sharing {sharedType?.toLowerCase()}: <strong>{sharedTitle}</strong>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="sidebar-panel space-y-5">
        <div>
          <label className="form-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. A study-buddy chatbot for my chemistry class"
            maxLength={200}
            required
            className="form-field"
          />
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does it do? What was the hardest part? What would you tell someone trying this themselves?"
            maxLength={3000}
            required
            className="form-field"
            style={{ height: '10rem' }}
          />
        </div>

        <div>
          <label className="form-label">Tools used <span className="normal-case font-medium text-stone-400">(optional)</span></label>
          <input
            type="text"
            value={toolsUsed}
            onChange={(e) => setToolsUsed(e.target.value)}
            placeholder="e.g. Claude, Cursor, Midjourney"
            maxLength={300}
            className="form-field"
          />
        </div>

        <div>
          <label className="form-label">Cover image <span className="normal-case font-medium text-stone-400">(optional)</span></label>
          <ImageUploadWidget folder="ShowcasePosts" currentUrl={imageUrl} onUploaded={(url) => setImageUrl(url || null)} />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim() || !description.trim()}
            className="btn-primary"
          >
            {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Publish project
          </button>
        </div>
      </form>
    </div>
  );
};