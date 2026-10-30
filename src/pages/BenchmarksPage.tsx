/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getBenchmarkBoard,
  buildBenchmarkShareUrl,
  buildBenchmarkImageUrl,
  BenchmarkBoard,
  BenchmarkCategory,
  BenchmarkModel,
} from '../api/benchmarks';
import { isDemoMode } from '../api/client';
import { ArrowLeftRight, BarChart3, Check, Copy, ExternalLink, Share2, Swords, Trophy } from 'lucide-react';

const formatScore = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : value.toFixed(1);

/** A model's score in one category, or its overall rating when no category is given. */
const scoreOf = (model: BenchmarkModel, categorySlug: string | null): number | null =>
  categorySlug === null ? model.overall : model.scores[categorySlug] ?? null;

export const BenchmarksPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const compareRef = useRef<HTMLElement>(null);

  const { data: board, isLoading, isError, refetch } = useQuery({
    queryKey: ['benchmark-board'],
    queryFn: getBenchmarkBoard,
  });

  const models = board?.models ?? [];
  const categories = board?.categories ?? [];

  // --- URL state: every selection lives in the query string so a link is a snapshot. ---
  const rawCategory = params.get('category');
  const category: BenchmarkCategory | null = categories.find((c) => c.slug === rawCategory) ?? null;

  const slugs = useMemo(() => new Set(models.map((m) => m.slug)), [models]);
  const rawA = params.get('a');
  const rawB = params.get('b');
  const pickedA = rawA && slugs.has(rawA) ? rawA : null;
  const pickedB = rawB && slugs.has(rawB) ? rawB : null;

  // With nothing picked yet, compare the two top-ranked models so the section is never empty.
  const firstOtherThan = (exclude: string | null) => models.find((m) => m.slug !== exclude)?.slug ?? null;
  const slugA = pickedA ?? firstOtherThan(pickedB);
  const slugB = pickedB && pickedB !== slugA ? pickedB : firstOtherThan(slugA);

  const modelA = models.find((m) => m.slug === slugA) ?? null;
  const modelB = models.find((m) => m.slug === slugB) ?? null;

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next, { replace: true });
  };

  const setCategory = (slug: string | null) => updateParams({ category: slug });
  const setCompare = (a: string | null, b: string | null) => updateParams({ a, b });

  const compareWith = (slug: string) => {
    // The clicked model becomes B; A stays as it is unless that would put a model against itself.
    const nextA = slugA && slugA !== slug ? slugA : firstOtherThan(slug);
    setCompare(nextA, slug);
    compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const lastUpdated = useMemo(() => {
    const stamps = models.map((m) => Date.parse(m.lastModified)).filter((n) => !Number.isNaN(n));
    return stamps.length ? new Date(Math.max(...stamps)) : null;
  }, [models]);

  return (
    <div className="directory-page bench-page">
      <header className="bench-hero">
        <span className="section-kicker">
          <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
          Benchmarks
        </span>
        <h1 className="editorial-heading editorial-heading--page font-serif">
          Which AI model is best at <em>what</em>?
        </h1>
        <p className="editorial-lede">
          One overall score hides a lot. Here every model is scored out of 100 in each category, so you can rank
          them by the thing you actually need — or put any two head to head and share the result.
        </p>
        {board && models.length > 0 && (
          <dl className="bench-hero__stats">
            <div>
              <dt>Models</dt>
              <dd>{models.length}</dd>
            </div>
            <div>
              <dt>Categories</dt>
              <dd>{categories.length}</dd>
            </div>
            {lastUpdated && (
              <div>
                <dt>Updated</dt>
                <dd>{lastUpdated.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
              </div>
            )}
          </dl>
        )}
      </header>

      {isLoading && (
        <div className="bench-state" role="status">
          <div className="bench-spinner" aria-hidden="true" />
          Loading benchmarks…
        </div>
      )}

      {isError && (
        <div className="bench-state bench-state--error" role="alert">
          <p>The benchmarks couldn’t be loaded.</p>
          <button type="button" className="btn-secondary btn-secondary--small" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}

      {board && models.length === 0 && (
        <div className="bench-state">
          <Trophy className="w-8 h-8" aria-hidden="true" />
          <p>No benchmarks have been published yet. Check back soon.</p>
        </div>
      )}

      {board && models.length > 0 && categories.length > 0 && (
        <>
          <Leaderboard
            board={board}
            category={category}
            onCategoryChange={setCategory}
            onCompare={compareWith}
            shareUrl={buildBenchmarkShareUrl({ category: category?.slug })}
          />

          <section ref={compareRef} className="bench-card" aria-labelledby="bench-compare-title">
            <header className="bench-card__header">
              <div>
                <h2 id="bench-compare-title" className="bench-card__title font-serif">
                  <Swords className="w-5 h-5" aria-hidden="true" /> Head to head
                </h2>
                <p className="bench-card__sub">Every category side by side. The higher score in each row is highlighted.</p>
              </div>
            </header>

            {modelA && modelB ? (
              <HeadToHead
                board={board}
                modelA={modelA}
                modelB={modelB}
                onChange={setCompare}
                categorySlug={category?.slug ?? null}
                version={lastUpdated ? String(lastUpdated.getTime()) : undefined}
              />
            ) : (
              <p className="bench-empty">Add at least two models to compare them.</p>
            )}
          </section>

          <p className="bench-footnote">
            Scores are entered by the AI Brief team on a 0–100 scale. A model’s overall rating is the weighted average of
            the categories it has been tested in; a category it hasn’t been tested in is skipped, not counted as zero.
          </p>
        </>
      )}
    </div>
  );
};

// --- Leaderboard -----------------------------------------------------------

interface LeaderboardProps {
  board: BenchmarkBoard;
  category: BenchmarkCategory | null;
  onCategoryChange: (slug: string | null) => void;
  onCompare: (slug: string) => void;
  shareUrl: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ board, category, onCategoryChange, onCompare, shareUrl }) => {
  const { categories, models } = board;
  const slug = category?.slug ?? null;

  const ranked = useMemo(
    () =>
      models
        .map((model) => ({ model, score: scoreOf(model, slug) }))
        .filter((row): row is { model: BenchmarkModel; score: number } => row.score !== null)
        .sort((x, y) => y.score - x.score || x.model.name.localeCompare(y.model.name)),
    [models, slug]
  );
  const untested = models.length - ranked.length;

  // The best score in each category column, so the leader of every category stands out at a glance.
  const columnBest = useMemo(() => {
    const best: Record<string, number> = {};
    categories.forEach((c) => {
      const values = models.map((m) => m.scores[c.slug]).filter((v): v is number => v !== undefined);
      if (values.length) best[c.slug] = Math.max(...values);
    });
    return best;
  }, [categories, models]);

  return (
    <section className="bench-card" aria-labelledby="bench-board-title">
      <header className="bench-card__header">
        <div>
          <h2 id="bench-board-title" className="bench-card__title font-serif">
            <Trophy className="w-5 h-5" aria-hidden="true" /> Leaderboard
          </h2>
          <p className="bench-card__sub">
            {category ? category.description || `Ranked by ${category.name}.` : 'Ranked by overall rating — the weighted average of every category.'}
          </p>
        </div>
        <CopyLinkButton url={shareUrl} label="Share this ranking" />
      </header>

      <div className="bench-chips" role="group" aria-label="Rank by">
        <button
          type="button"
          className={`facet-chip ${slug === null ? 'facet-chip--active' : ''}`}
          aria-pressed={slug === null}
          onClick={() => onCategoryChange(null)}
        >
          Overall
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`facet-chip ${slug === c.slug ? 'facet-chip--active' : ''}`}
            aria-pressed={slug === c.slug}
            onClick={() => onCategoryChange(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="bench-scroll">
        <table className="bench-table" style={{ ['--bench-cats' as string]: categories.length } as React.CSSProperties}>
          <thead>
            <tr>
              <th className="bench-table__rank" scope="col">#</th>
              <th scope="col">Model</th>
              <th scope="col" className="bench-table__bar-head">{category ? category.name : 'Overall'}</th>
              {categories.map((c) => (
                <th key={c.id} scope="col" className={`bench-table__cat ${slug === c.slug ? 'is-selected' : ''}`}>
                  <button type="button" onClick={() => onCategoryChange(c.slug)} title={`Rank by ${c.name}`}>
                    {c.name}
                  </button>
                </th>
              ))}
              <th scope="col" className="bench-table__action"><span className="sr-only">Compare</span></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ model, score }, index) => (
              <tr key={model.id} className={index === 0 ? 'is-leader' : ''}>
                <td className="bench-table__rank">{index + 1}</td>
                <td>
                  <div className="bench-model">
                    <strong>{model.name}</strong>
                    <span>
                      {model.creator || 'Independent'}
                      {model.isOpenWeights && <em className="bench-tag">Open weights</em>}
                    </span>
                  </div>
                </td>
                <td className="bench-table__bar-cell">
                  <div className="bench-bar" role="img" aria-label={`${model.name}: ${formatScore(score)} out of 100`}>
                    <div className="bench-bar__track">
                      <div className="bench-bar__fill" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                    </div>
                    <span className="bench-bar__value">{formatScore(score)}</span>
                  </div>
                </td>
                {categories.map((c) => {
                  const value = model.scores[c.slug];
                  const isBest = value !== undefined && value === columnBest[c.slug];
                  return (
                    <td key={c.id} className={`bench-table__cat ${slug === c.slug ? 'is-selected' : ''} ${isBest ? 'is-best' : ''}`}>
                      {formatScore(value)}
                    </td>
                  );
                })}
                <td className="bench-table__action">
                  <button type="button" className="bench-link" onClick={() => onCompare(model.slug)}>
                    <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" /> Compare
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {untested > 0 && (
        <p className="bench-note">
          {untested} model{untested === 1 ? ' hasn’t' : 's haven’t'} been tested in {category ? category.name : 'any category'} yet, so
          {untested === 1 ? ' it is' : ' they are'} not ranked here.
        </p>
      )}
    </section>
  );
};

// --- Head to head ----------------------------------------------------------

interface HeadToHeadProps {
  board: BenchmarkBoard;
  modelA: BenchmarkModel;
  modelB: BenchmarkModel;
  onChange: (a: string | null, b: string | null) => void;
  categorySlug: string | null;
  /** Changes whenever the scores do, so the preview image below is never a stale cached copy. */
  version?: string;
}

const HeadToHead: React.FC<HeadToHeadProps> = ({ board, modelA, modelB, onChange, categorySlug, version }) => {
  const rows = [
    { key: 'overall', label: 'Overall', hint: 'Weighted average of every category', a: modelA.overall, b: modelB.overall, isOverall: true },
    ...board.categories.map((c) => ({
      key: c.slug,
      label: c.name,
      hint: c.description,
      a: modelA.scores[c.slug] ?? null,
      b: modelB.scores[c.slug] ?? null,
      isOverall: false,
    })),
  ];

  const compared = rows.filter((r) => !r.isOverall && r.a !== null && r.b !== null);
  const aWins = compared.filter((r) => (r.a as number) > (r.b as number)).length;
  const bWins = compared.filter((r) => (r.b as number) > (r.a as number)).length;

  let verdict: string;
  if (compared.length === 0) verdict = 'These two have no category in common yet, so only their overall ratings can be compared.';
  else if (aWins === bWins) verdict = `${modelA.name} and ${modelB.name} split the ${compared.length} categories they share, ${aWins} each.`;
  else {
    const [leader, wins] = aWins > bWins ? [modelA, aWins] : [modelB, bWins];
    verdict = `${leader.name} leads in ${wins} of the ${compared.length} categories both were tested in.`;
  }

  const shareParams = { a: modelA.slug, b: modelB.slug, category: categorySlug };

  return (
    <div className="bench-h2h">
      <div className="bench-h2h__pickers">
        <ModelSelect label="Model A" value={modelA.slug} models={board.models} exclude={modelB.slug} onChange={(slug) => onChange(slug, modelB.slug)} />
        <button
          type="button"
          className="bench-swap"
          onClick={() => onChange(modelB.slug, modelA.slug)}
          aria-label="Swap the two models"
          title="Swap"
        >
          <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <ModelSelect label="Model B" value={modelB.slug} models={board.models} exclude={modelA.slug} onChange={(slug) => onChange(modelA.slug, slug)} />
      </div>

      <p className="bench-verdict" aria-live="polite">{verdict}</p>

      <div className="bench-h2h__rows">
        <div className="bench-h2h__names" aria-hidden="true">
          <strong>{modelA.name}</strong>
          <span />
          <strong>{modelB.name}</strong>
        </div>
        {rows.map((row) => {
          const bothScored = row.a !== null && row.b !== null;
          const aLeads = bothScored && (row.a as number) >= (row.b as number);
          const bLeads = bothScored && (row.b as number) >= (row.a as number);
          return (
            <div key={row.key} className={`bench-h2h__row ${row.isOverall ? 'is-overall' : ''}`}>
              <div className="bench-h2h__side bench-h2h__side--a">
                <span className="bench-h2h__who">{modelA.name}</span>
                <div className="bench-h2h__track"><div className={`bench-h2h__bar ${aLeads ? 'is-win' : ''}`} style={{ width: `${row.a ?? 0}%` }}>
                  <span>{formatScore(row.a)}</span>
                </div></div>
              </div>
              <div className="bench-h2h__label" title={row.hint || undefined}>{row.label}</div>
              <div className="bench-h2h__side bench-h2h__side--b">
                <span className="bench-h2h__who">{modelB.name}</span>
                <div className="bench-h2h__track"><div className={`bench-h2h__bar ${bLeads ? 'is-win' : ''}`} style={{ width: `${row.b ?? 0}%` }}>
                  <span>{formatScore(row.b)}</span>
                </div></div>
              </div>
            </div>
          );
        })}
      </div>

      <SharePanel
        title={`${modelA.name} vs ${modelB.name}`}
        shareUrl={buildBenchmarkShareUrl(shareParams)}
        imageUrl={buildBenchmarkImageUrl(shareParams, version)}
      />
    </div>
  );
};

const ModelSelect: React.FC<{
  label: string;
  value: string;
  models: BenchmarkModel[];
  exclude: string;
  onChange: (slug: string) => void;
}> = ({ label, value, models, exclude, onChange }) => (
  <label className="bench-select">
    <span>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {models.map((m) => (
        <option key={m.id} value={m.slug} disabled={m.slug === exclude}>
          {m.name}
          {m.creator ? ` — ${m.creator}` : ''}
        </option>
      ))}
    </select>
  </label>
);

// --- Sharing ---------------------------------------------------------------

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard access can be refused (insecure context, permissions). Fall back to the old route.
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      return ok;
    } catch {
      return false;
    }
  }
};

const CopyLinkButton: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopy = async () => {
    const ok = await copyText(url);
    setState(ok ? 'copied' : 'failed');
    window.setTimeout(() => setState('idle'), 2500);
  };

  return (
    <button type="button" className="btn-secondary btn-secondary--small" onClick={handleCopy} aria-live="polite">
      {state === 'copied' ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Share2 className="w-3.5 h-3.5" aria-hidden="true" />}
      {state === 'copied' ? 'Link copied' : state === 'failed' ? 'Copy failed' : label}
    </button>
  );
};

const SharePanel: React.FC<{ title: string; shareUrl: string; imageUrl: string }> = ({ title, shareUrl, imageUrl }) => {
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // A new comparison means a new image, so a previous load failure no longer applies.
  React.useEffect(() => setImageFailed(false), [imageUrl]);

  const handleCopy = async () => {
    if (await copyText(shareUrl)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: `${title} — AI model benchmarks on AI Brief`, url: shareUrl });
    } catch {
      // Closing the share sheet rejects with AbortError; that's a choice, not a failure.
    }
  };

  return (
    <div className="bench-share">
      <div className="bench-share__copy">
        <h3 className="font-serif">Share this comparison</h3>
        <p>
          Anyone who gets this link sees the preview card shown here when it’s posted in a chat or social feed, then lands on this
          page with the same two models selected.
        </p>
        <div className="bench-share__actions">
          <button type="button" className="btn-primary btn-primary--small" onClick={handleCopy} aria-live="polite">
            {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          {canNativeShare && (
            <button type="button" className="btn-secondary btn-secondary--small" onClick={handleNativeShare}>
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Share…
            </button>
          )}
          {!isDemoMode() && (
            <a className="bench-link" href={imageUrl} target="_blank" rel="noopener noreferrer">
              Open image <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <figure className="bench-share__preview">
        {isDemoMode() || imageFailed ? (
          <div className="bench-share__placeholder">
            {isDemoMode() ? 'The preview image is drawn by the API, so it isn’t available in demo mode.' : 'The preview image couldn’t be loaded right now.'}
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`Preview card for ${title}, showing both models’ scores in every category`}
            width={1200}
            height={630}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        <figcaption>What people see when you share the link</figcaption>
      </figure>
    </div>
  );
};
