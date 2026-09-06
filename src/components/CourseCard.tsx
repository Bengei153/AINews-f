/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types/api';
import { ExternalLink, GraduationCap } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <article className="editorial-card content-card group">
      <a
        href={course.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="content-card__media"
      >
        <span className={course.pricingType === 'Free' ? 'pricing-badge pricing-badge--free' : 'pricing-badge pricing-badge--paid'}>
          {course.pricingType === 'Free' ? 'Free' : course.price || 'Paid'}
        </span>
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} />
        ) : (
          <div className="content-card__visual content-card__visual--course">
            <GraduationCap className="w-10 h-10" />
          </div>
        )}
      </a>

      <div className="content-card__body">
        <div className="content-card__copy">
          <Link
            to={`/courses?category=${course.courseCategoryId}`}
            onClick={(e) => e.stopPropagation()}
            className="content-card__eyebrow content-card__eyebrow--link"
          >
            {course.courseCategoryName}
          </Link>
          <a href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="content-card__title font-serif">{course.title}</h3>
          </a>
          <p className="content-card__summary line-clamp-3">{course.description}</p>
        </div>

        <div className="content-card__meta">
          <span>{course.provider}</span>
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