/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Tutorial, DifficultyLevel } from '../types/api';
import { Eye, GraduationCap } from 'lucide-react';

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
    <article className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md hover:border-stone-300 transition-all duration-200">
      <div className="p-4 pb-0 flex items-center justify-between">
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

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <Link to={`/tutorials/${tutorial.slug}`} className="block">
            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-tight">
              {tutorial.title}
            </h3>
          </Link>
          <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">{tutorial.summary}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-4 mt-4 border-t border-stone-100 font-medium">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-stone-400" />
            {tutorial.viewCount.toLocaleString()} views
          </span>
        </div>
      </div>
    </article>
  );
};