/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types/api';
import { ExternalLink } from 'lucide-react';
import { ShareMenu } from './ShareMenu';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const priceLabel = course.pricingType === 'Free' ? 'Free' : course.price || 'Paid';
  const priceModifier = course.pricingType === 'Free' ? 'pricing-badge--free' : 'pricing-badge--paid';

  return (
    <article className="editorial-card content-card group">
      {course.thumbnailUrl && (
        <a
          href={course.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="content-card__media"
        >
          <span className={`pricing-badge ${priceModifier}`}>{priceLabel}</span>
          <img src={course.thumbnailUrl} alt={course.title} />
        </a>
      )}

      <div className="content-card__body">
        <div className="content-card__copy">
          <div className="content-card__eyebrow-row">
            <Link
              to={`/courses?category=${course.courseCategoryId}`}
              onClick={(e) => e.stopPropagation()}
              className="content-card__eyebrow content-card__eyebrow--link"
            >
              {course.courseCategoryName}
            </Link>
            {!course.thumbnailUrl && (
              <span className={`pricing-badge pricing-badge--inline ${priceModifier}`}>{priceLabel}</span>
            )}
          </div>
          <a href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="content-card__title font-serif">{course.title}</h3>
          </a>
          <p className="content-card__summary line-clamp-3">{course.description}</p>
        </div>

        <div className="content-card__meta">
          <span>{course.provider}</span>
          <ShareMenu
            variant="icon"
            contentType="Course"
            contentId={course.id}
            slug={course.slug}
            title={course.title}
            summary={course.description}
            thumbnailUrl={course.thumbnailUrl}
          />
          <a
            href={course.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 content-card__eyebrow--link"
          >
            Start course
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};