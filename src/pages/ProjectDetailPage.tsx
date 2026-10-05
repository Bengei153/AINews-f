/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { getCreatedPageBySlug } from '../api/createdPages';
import { getAiTools } from '../api/aiTools';
import { ArrowLeft, Download, Link2, Plug, ExternalLink, AlertCircle, Loader2, PlayCircle } from 'lucide-react';

const DELIVERY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  Download: { label: 'Download', icon: <Download className="w-4 h-4" /> },
  Link: { label: 'Open', icon: <Link2 className="w-4 h-4" /> },
  ConnectBackend: { label: 'Open', icon: <Plug className="w-4 h-4" /> },
};

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['created-page', slug],
    queryFn: () => getCreatedPageBySlug(slug!),
    enabled: !!slug,
  });

  const { data: aiTools } = useQuery({ queryKey: ['ai-tools'], queryFn: () => getAiTools(false) });

  const toolsUsed = React.useMemo(() => {
    if (!page) return [];
    return page.toolsUsedText.split(',').map((t) => t.trim()).filter(Boolean);
  }, [page]);

  const findMatchingTool = (name: string) => aiTools?.find((t) => t.name.toLowerCase() === name.toLowerCase());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-stone-300 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-stone-800">Project not found</h3>
        <Link to="/projects" className="text-xs font-bold text-emerald-700 underline">Back to Projects</Link>
      </div>
    );
  }

  const delivery = DELIVERY_META[page.deliveryMode] ?? DELIVERY_META.Link;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </Link>

      {page.coverImageUrl && (
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-stone-200">
          <img src={page.coverImageUrl} alt={page.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="space-y-4 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            {page.category}
          </span>
          <span className="text-xs font-bold text-stone-500">by {page.creatorName}</span>
        </div>
        <h1 className="font-serif text-3xl font-black text-stone-900 tracking-tight leading-tight">{page.title}</h1>
        <p className="text-sm text-stone-600">{page.shortDescription}</p>

        <a
          href={page.deliveryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md transition-colors"
        >
          {delivery.icon}
          {delivery.label}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {page.deliveryMode === 'ConnectBackend' && <TryItWidget url={page.deliveryUrl} />}

      {toolsUsed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Built with</span>
          {toolsUsed.map((toolName) => {
            const match = findMatchingTool(toolName);
            return match ? (
              <Link
                key={toolName}
                to={`/tools#tool-card-${match.id}`}
                className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                {toolName}
              </Link>
            ) : (
              <span key={toolName} className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                {toolName}
              </span>
            );
          })}
        </div>
      )}

      {page.detailedDescription && (
        <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:text-sm prose-p:leading-relaxed prose-p:text-stone-700 prose-li:text-sm prose-li:text-stone-700">
          <ReactMarkdown>{page.detailedDescription}</ReactMarkdown>
        </article>
      )}
    </div>
  );
};

// Calls the creator's URL directly from the visitor's own browser — deliberately never proxied
// through our server (see the backend CHANGES.md for why: fetching arbitrary user-submitted
// URLs server-side is a real SSRF risk a simple link field doesn't need to carry). A CORS
// failure here is expected for most APIs not built to allow it and isn't a bug in this page.
const TryItWidget: React.FC<{ url: string }> = ({ url }) => {
  const [result, setResult] = useState<{ ok: boolean; body: string } | null>(null);
  const [isTrying, setIsTrying] = useState(false);

  const handleTry = async () => {
    setIsTrying(true);
    setResult(null);
    try {
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      setResult({ ok: response.ok, body: text.slice(0, 2000) });
    } catch {
      setResult({ ok: false, body: "Couldn't reach it from your browser — this is often just the site blocking cross-origin requests (CORS), not necessarily broken." });
    } finally {
      setIsTrying(false);
    }
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Plug className="w-3.5 h-3.5" />
          Try it live
        </h3>
        <button
          onClick={handleTry}
          disabled={isTrying}
          className="bg-white hover:bg-stone-100 disabled:opacity-60 border border-stone-200 text-stone-700 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          {isTrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
          Test endpoint
        </button>
      </div>
      {result && (
        <pre
          className={`text-[11px] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all ${
            result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
          }`}
        >
          {result.body || '(empty response)'}
        </pre>
      )}
    </div>
  );
};
