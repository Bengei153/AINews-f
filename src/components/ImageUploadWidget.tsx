/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { uploadImage, ImageUploadFolder } from '../api/media';

interface ImageUploadWidgetProps {
  folder: ImageUploadFolder;
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
}

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({ folder, onUploaded, currentUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deliberately controlled by the currentUrl prop rather than mirrored into
  // local state — this is what lets the parent form's reset (after a
  // successful submit) actually clear the preview here too, instead of this
  // widget silently holding onto a stale image.
  const previewUrl = currentUrl || null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Only JPEG, PNG, WebP, or GIF images are allowed.');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onUploaded(url);
    } catch (err: any) {
      setError(err?.detail || 'Upload failed — try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onUploaded('');
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelected}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative w-full max-w-xs">
          <img src={previewUrl} alt="Upload preview" className="w-full h-32 object-cover rounded-lg border border-stone-200" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1.5 right-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 text-xs font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-300 rounded-lg px-4 py-3 cursor-pointer transition-colors disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              Upload an image
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};