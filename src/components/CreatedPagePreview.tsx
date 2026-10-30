/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { DeliveryMode } from '../api/createdPages';
import { Download, ExternalLink, Link2, Plug, Sparkles } from 'lucide-react';

export interface PreviewablePage {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: string;
  toolsUsedText: string;
  deliveryMode: DeliveryMode;
  deliveryUrl: string;
  coverImageUrl: string | null;
  slug?: string;
}

const DELIVERY: Record<DeliveryMode, { label: string; icon: React.ReactNode }> = {
  Download: { label: 'Download', icon: <Download className="w-4 h-4" aria-hidden="true" /> },
  Link: { label: 'Open', icon: <Link2 className="w-4 h-4" aria-hidden="true" /> },
  ConnectBackend: { label: 'Open', icon: <Plug className="w-4 h-4" aria-hidden="true" /> },
};

interface CreatedPagePreviewProps {
  /** Null before the page exists (nothing has been said to Mark yet). */
  page: PreviewablePage | null;
  device: 'desktop' | 'mobile';
}

/**
 * A faithful miniature of the public project page (ProjectDetailPage), drawn from the draft as it
 * stands — so the builder sees what visitors will see, and watches it change as Mark writes.
 * Nothing here is interactive on purpose: the delivery button is shown, not followed.
 */
export const CreatedPagePreview: React.FC<CreatedPagePreviewProps> = ({ page, device }) => {
  const tools = (page?.toolsUsedText ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const delivery = DELIVERY[page?.deliveryMode ?? 'Link'] ?? DELIVERY.Link;
  const hasLink = !!page?.deliveryUrl.trim();
  const address = `ai-brief.space/projects/${page?.slug || 'your-project'}`;

  return (
    <div className={`studio-browser studio-browser--${device}`}>
      <div className="studio-browser__chrome" aria-hidden="true">
        <span /> <span /> <span />
        <div className="studio-browser__address">{address}</div>
      </div>

      {!page || (!page.title && !page.shortDescription && !page.detailedDescription) ? (
        <div className="studio-preview__empty">
          <Sparkles className="w-8 h-8" aria-hidden="true" />
          <h3 className="font-serif">Your page appears here</h3>
          <p>Tell Mark what you built. As he writes it up, this preview fills in live.</p>
        </div>
      ) : (
        <article className="studio-preview">
          {page.coverImageUrl && <img className="studio-preview__cover" src={page.coverImageUrl} alt="" />}

          <div className="studio-preview__meta">
            <span className="studio-preview__chip">{page.category || 'Uncategorised'}</span>
            <span>by you</span>
          </div>

          <h1 className="studio-preview__title font-serif">{page.title || 'Untitled project'}</h1>
          <p className={`studio-preview__hook ${page.shortDescription ? '' : 'is-placeholder'}`}>
            {page.shortDescription || 'A one-sentence hook goes here.'}
          </p>

          <span className={`studio-preview__cta ${hasLink ? '' : 'is-disabled'}`}>
            {delivery.icon}
            {hasLink ? delivery.label : 'Add a link to enable this button'}
            {hasLink && <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />}
          </span>

          {tools.length > 0 && (
            <div className="studio-preview__tools">
              <span>Built with</span>
              {tools.map((tool) => (
                <em key={tool}>{tool}</em>
              ))}
            </div>
          )}

          {page.detailedDescription && (
            <div className="studio-md studio-preview__body">
              <ReactMarkdown>{page.detailedDescription}</ReactMarkdown>
            </div>
          )}
        </article>
      )}
    </div>
  );
};
