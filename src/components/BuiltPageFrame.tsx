/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BuiltPageFrameProps {
  /** The full HTML document Mark built. */
  html: string;
  title: string;
  className?: string;
}

/**
 * The ONLY place a page built by Mark is ever shown. It is AI-written code, so it is treated as untrusted:
 *
 *  - It runs in an <iframe sandbox> WITHOUT "allow-same-origin". That makes it a separate, opaque origin:
 *    it cannot read this site's cookies, localStorage (where the login tokens live) or DOM, and cannot call
 *    this site's API as the visitor. Adding "allow-same-origin" next to "allow-scripts" would let the page
 *    remove its own sandbox, so never add it.
 *  - No "allow-top-navigation": the page cannot redirect the surrounding site.
 *  - The HTML itself also carries a Content-Security-Policy (added by the server) that blocks network requests.
 *  - Links the page opens in a new tab leave the sandbox ("allow-popups-to-escape-sandbox") so the sites they
 *    point at work normally.
 */
export const BuiltPageFrame: React.FC<BuiltPageFrameProps> = ({ html, title, className }) => (
  <iframe
    title={`${title} — page built by Mark`}
    srcDoc={html}
    sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"
    referrerPolicy="no-referrer"
    loading="lazy"
    className={className ?? 'built-frame'}
  />
);
