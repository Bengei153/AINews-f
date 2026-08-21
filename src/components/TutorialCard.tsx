/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Tutorial, DifficultyLevel } from '../types/api';
import { Eye, GraduationCap, Layers } from 'lucide-react';

interface TutorialCardProps {
  tutorial: Tutorial;
}

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial }) => {
  return (
    <article className="editorial-card content-card group">
      <Link to={`/tutorials/${tutorial.slug}`} className="content-card__media" aria-label={tutorial.title}>
        {tutorial.coverImageUrl ? (
          <img src={tutorial.coverImageUrl} alt={tutorial.title} />
        ) : (
          <div className="content-card__visual content-card__visual--tutorial">
            <Layers className="w-7 h-7" />
          </div>
        )}
      </Link>

      <div className="content-card__header">
        <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${DIFFICULTY_STYLES[tutorial.difficultyLevel]}`}>
          {tutorial.difficultyLevel}
        </span>
        <Link
          to={`/tutorials?tool=${encodeURIComponent(tutorial.toolName)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-bold text-stone-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          {tutorial.toolName}
        </Link>
      </div>

      <div className="content-card__body">
        <div className="content-card__copy">
          <Link to={`/tutorials/${tutorial.slug}`} className="block">
            <h3 className="content-card__title font-serif">
              {tutorial.title}
            </h3>
          </Link>
          <p className="content-card__summary line-clamp-3">{tutorial.summary}</p>
        </div>

        <div className="content-card__meta">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {tutorial.viewCount.toLocaleString()} views
          </span>
        </div>
      </div>
    </article>
  );
};
