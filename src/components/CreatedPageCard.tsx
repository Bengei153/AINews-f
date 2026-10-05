/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CreatedPageCard as CreatedPageCardType } from '../types/api';
import { Download, Link2, Plug, Eye } from 'lucide-react';

const DELIVERY_ICON: Record<CreatedPageCardType['deliveryMode'], React.ReactNode> = {
  Download: <Download className="w-3.5 h-3.5" />,
  Link: <Link2 className="w-3.5 h-3.5" />,
  ConnectBackend: <Plug className="w-3.5 h-3.5" />,
};

interface CreatedPageCardProps {
  page: CreatedPageCardType;
}

export const CreatedPageCard: React.FC<CreatedPageCardProps> = ({ page }) => {
  return (
    <article className="editorial-card content-card group">
      <Link to={`/projects/${page.slug}`} className="content-card__media">
        {page.coverImageUrl ? (
          <img src={page.coverImageUrl} alt={page.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
            {DELIVERY_ICON[page.deliveryMode]}
          </div>
        )}
      </Link>

      <div className="content-card__body">
        <div className="content-card__copy">
          <span className="content-card__eyebrow">{page.category}</span>
          <Link to={`/projects/${page.slug}`} className="block">
            <h3 className="content-card__title font-serif">{page.title}</h3>
          </Link>
          <p className="content-card__summary line-clamp-2">{page.shortDescription}</p>
        </div>

        <div className="content-card__meta flex items-center justify-between">
          <span className="flex items-center gap-1">
            {DELIVERY_ICON[page.deliveryMode]}
            {page.deliveryMode === 'ConnectBackend' ? 'Connect' : page.deliveryMode}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {page.viewCount}
          </span>
        </div>
      </div>
    </article>
  );
};
