/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/tutorials', label: 'Tutorials' },
  { to: '/videos', label: 'Videos' },
  { to: '/courses', label: 'Courses' },
];

// Lets someone browsing Videos or Tutorials discover Courses (and vice
// versa) without a dedicated top-level nav entry — Courses "lives inside"
// both sections via this tab row, per how the feature was scoped.
export const LearningNavTabs: React.FC = () => {
  const location = useLocation();

  return (
    <div className="facet-row" role="tablist" aria-label="Learning content sections">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          role="tab"
          aria-selected={location.pathname.startsWith(tab.to)}
          className={location.pathname.startsWith(tab.to) ? 'facet-chip facet-chip--active' : 'facet-chip'}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};