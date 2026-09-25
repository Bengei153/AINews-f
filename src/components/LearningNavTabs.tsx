/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/courses', label: 'Courses' },
  { to: '/videos', label: 'Videos' },
];

// Courses and videos are the two dedicated learning formats. Practical
// tutorials live with the tools they help people use.
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
