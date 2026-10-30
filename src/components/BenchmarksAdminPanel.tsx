/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminBenchmarkBoard,
  saveBenchmarkCategory,
  deleteBenchmarkCategory,
  saveBenchmarkModel,
  deleteBenchmarkModel,
  importBenchmarkData,
  describeApiError,
  BenchmarkCategory,
  BenchmarkModel,
  ImportBenchmarkPayload,
  ImportBenchmarkResult,
} from '../api/benchmarks';
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';

interface BenchmarksAdminPanelProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

// Deliberately unpublished and zero-scored, so pasting it in unchanged can never put made-up numbers on the public page.
const IMPORT_TEMPLATE = `{
  "categories": [
    { "name": "Frontend & UI", "description": "Builds clean, working web interfaces", "weight": 1 },
    { "name": "Reasoning", "description": "Multi-step problem solving", "weight": 1 }
  ],
  "models": [
    {
      "name": "Example Model A",
      "creator": "Example Lab",
      "notes": "Replace with your real data",
      "isOpenWeights": false,
      "isPublished": false,
      "scores": { "Frontend & UI": 0, "Reasoning": 0 }
    }
  ]
}`;

// Self-contained (own queries and mutations), same shape as the other admin panels, so it drops
// into AdminPage as one tab without threading state through it.
export const BenchmarksAdminPanel: React.FC<BenchmarksAdminPanelProps> = ({ onNotify }) => {
  const queryClient = useQueryClient();

  const { data: board, isLoading, isError } = useQuery({
    queryKey: ['admin-benchmark-board'],
    queryFn: getAdminBenchmarkBoard,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-benchmark-board'] });
    queryClient.invalidateQueries({ queryKey: ['benchmark-board'] });
  };

  if (isLoading) {
    return (
      <div className="bench-admin__empty">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…
      </div>
    );
  }

  if (isError || !board) {
    return <div className="bench-admin__empty">Couldn’t load the benchmark board.</div>;
  }

  return (
    <div className="bench-admin">
      <ImportCard onNotify={onNotify} onDone={refresh} />
      <CategoriesCard categories={board.categories} onNotify={onNotify} onChanged={refresh} />
      <ModelsCard models={board.models} categories={board.categories} onNotify={onNotify} onChanged={refresh} />
    </div>
  );
};

// --- Import ----------------------------------------------------------------

const ImportCard: React.FC<{ onNotify: BenchmarksAdminPanelProps['onNotify']; onDone: () => void }> = ({ onNotify, onDone }) => {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportBenchmarkResult | null>(null);

  const importMutation = useMutation({
    mutationFn: (payload: ImportBenchmarkPayload) => importBenchmarkData(payload),
    onSuccess: (res) => {
      setResult(res);
      onDone();
      onNotify('success', 'Import finished.');
    },
    onError: (err) => onNotify('error', describeApiError(err)),
  });

  const handleImport = () => {
    setResult(null);
    let payload: ImportBenchmarkPayload;
    try {
      payload = JSON.parse(text);
    } catch (e: any) {
      setParseError(`That isn’t valid JSON: ${e?.message ?? 'parse error'}`);
      return;
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      setParseError('The JSON must be an object with "categories" and/or "models".');
      return;
    }
    setParseError(null);
    importMutation.mutate(payload);
  };

  return (
    <section className="bench-admin__card">
      <h3 className="font-serif">Import from JSON</h3>
      <p className="bench-admin__hint">
        Paste a whole board (or a new round of results) in one go. It merges: models and categories are matched by name, existing
        ones are updated, new ones are created, and any score you don’t mention is left alone. A bad row is skipped and reported — it
        never blocks the good ones. Scores can be keyed by category name or slug.
      </p>
      <textarea
        className="bench-input bench-input--code"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{ "categories": [ … ], "models": [ … ] }'
        spellCheck={false}
        aria-label="Benchmark JSON"
      />
      {parseError && <p className="bench-admin__result" role="alert" style={{ background: 'transparent', color: '#b91c1c', padding: 0 }}>{parseError}</p>}
      <div className="bench-admin__actions" style={{ marginTop: '.85rem' }}>
        <button type="button" className="btn-primary btn-primary--small" onClick={handleImport} disabled={!text.trim() || importMutation.isPending}>
          {importMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Upload className="w-3.5 h-3.5" aria-hidden="true" />}
          Import
        </button>
        <button type="button" className="btn-secondary btn-secondary--small" onClick={() => setText(IMPORT_TEMPLATE)}>
          Insert template
        </button>
      </div>

      {result && (
        <div className="bench-admin__result" role="status">
          Categories: {result.categoriesCreated} created, {result.categoriesUpdated} updated · Models: {result.modelsCreated} created,{' '}
          {result.modelsUpdated} updated.
          {result.errors.length > 0 && (
            <>
              <br />
              {result.errors.length} row{result.errors.length === 1 ? ' was' : 's were'} skipped:
              <ul>
                {result.errors.map((message, i) => (
                  <li key={i}>{message}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
};

// --- Categories ------------------------------------------------------------

interface CategoryDraft {
  id: string | null;
  name: string;
  description: string;
  weight: string;
  sortOrder: string;
}

const CategoriesCard: React.FC<{
  categories: BenchmarkCategory[];
  onNotify: BenchmarksAdminPanelProps['onNotify'];
  onChanged: () => void;
}> = ({ categories, onNotify, onChanged }) => {
  const [draft, setDraft] = useState<CategoryDraft | null>(null);

  const startNew = () =>
    setDraft({ id: null, name: '', description: '', weight: '1', sortOrder: String(categories.length) });
  const startEdit = (c: BenchmarkCategory) =>
    setDraft({ id: c.id, name: c.name, description: c.description, weight: String(c.weight), sortOrder: String(c.sortOrder) });

  const saveMutation = useMutation({
    mutationFn: (d: CategoryDraft) =>
      saveBenchmarkCategory(d.id, {
        name: d.name.trim(),
        description: d.description.trim(),
        weight: Number(d.weight),
        sortOrder: Number(d.sortOrder),
      }),
    onSuccess: () => {
      setDraft(null);
      onChanged();
      onNotify('success', 'Category saved.');
    },
    onError: (err) => onNotify('error', describeApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBenchmarkCategory(id),
    onSuccess: () => {
      onChanged();
      onNotify('success', 'Category deleted.');
    },
    onError: (err) => onNotify('error', describeApiError(err)),
  });

  const handleDelete = (c: BenchmarkCategory) => {
    if (window.confirm(`Delete “${c.name}”? Every model’s score in this category is deleted too, and overall ratings are recalculated.`)) {
      deleteMutation.mutate(c.id);
    }
  };

  const weightValid = draft ? Number(draft.weight) >= 0.1 && Number(draft.weight) <= 10 : false;

  return (
    <section className="bench-admin__card">
      <div className="bench-admin__head">
        <div>
          <h3 className="font-serif">Categories</h3>
          <p className="bench-admin__hint">What models are compared on. Weight sets how much a category counts toward the overall rating (1 = normal, 2 = counts double).</p>
        </div>
        <button type="button" className="btn-secondary btn-secondary--small" onClick={startNew}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add category
        </button>
      </div>

      {categories.length === 0 && !draft && <p className="bench-admin__empty">No categories yet. Add one, or import a board above.</p>}

      {categories.map((c) => (
        <div key={c.id} className="bench-admin__row">
          <div>
            <strong>{c.name}</strong>
            <small>
              weight {c.weight} · order {c.sortOrder} · /{c.slug}
              {c.description ? ` · ${c.description}` : ''}
            </small>
          </div>
          <div className="bench-admin__actions">
            <button type="button" className="btn-secondary btn-secondary--small" onClick={() => startEdit(c)} aria-label={`Edit ${c.name}`}>
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button type="button" className="btn-danger btn-danger--small" onClick={() => handleDelete(c)} aria-label={`Delete ${c.name}`}>
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}

      {draft && (
        <form
          className="bench-admin__form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <label className="bench-admin__field">
            <span>Name</span>
            <input className="bench-input" value={draft.name} maxLength={60} required onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="bench-admin__field">
            <span>Weight (0.1–10)</span>
            <input className="bench-input" type="number" step="0.1" min={0.1} max={10} value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} />
          </label>
          <label className="bench-admin__field">
            <span>Order</span>
            <input className="bench-input" type="number" min={0} max={1000} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
          </label>
          <label className="bench-admin__field is-wide">
            <span>What it measures (one line)</span>
            <input className="bench-input" value={draft.description} maxLength={200} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </label>
          <div className="bench-admin__actions is-wide">
            <button type="submit" className="btn-primary btn-primary--small" disabled={!draft.name.trim() || !weightValid || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              Save category
            </button>
            <button type="button" className="btn-secondary btn-secondary--small" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

// --- Models ----------------------------------------------------------------

interface ModelDraft {
  id: string | null;
  name: string;
  creator: string;
  notes: string;
  isOpenWeights: boolean;
  isPublished: boolean;
  /** Text per category slug, so a field can be empty ("not tested") without turning into 0. */
  scores: Record<string, string>;
}

const emptyDraft = (): ModelDraft => ({ id: null, name: '', creator: '', notes: '', isOpenWeights: false, isPublished: true, scores: {} });

const ModelsCard: React.FC<{
  models: BenchmarkModel[];
  categories: BenchmarkCategory[];
  onNotify: BenchmarksAdminPanelProps['onNotify'];
  onChanged: () => void;
}> = ({ models, categories, onNotify, onChanged }) => {
  const [draft, setDraft] = useState<ModelDraft | null>(null);

  const startEdit = (m: BenchmarkModel) =>
    setDraft({
      id: m.id,
      name: m.name,
      creator: m.creator,
      notes: m.notes,
      isOpenWeights: m.isOpenWeights,
      isPublished: m.isPublished,
      scores: Object.fromEntries(Object.entries(m.scores).map(([slug, value]) => [slug, String(value)])),
    });

  // Blank fields mean "not tested"; anything else must be a number from 0 to 100.
  const parsedScores = (d: ModelDraft): { scores: Record<string, number>; invalid: string[] } => {
    const scores: Record<string, number> = {};
    const invalid: string[] = [];
    categories.forEach((c) => {
      const raw = (d.scores[c.slug] ?? '').trim();
      if (raw === '') return;
      const value = Number(raw);
      if (Number.isNaN(value) || value < 0 || value > 100) invalid.push(c.name);
      else scores[c.slug] = value;
    });
    return { scores, invalid };
  };

  const saveMutation = useMutation({
    mutationFn: (d: ModelDraft) =>
      saveBenchmarkModel(d.id, {
        name: d.name.trim(),
        creator: d.creator.trim(),
        notes: d.notes.trim(),
        isOpenWeights: d.isOpenWeights,
        isPublished: d.isPublished,
        scores: parsedScores(d).scores,
      }),
    onSuccess: () => {
      setDraft(null);
      onChanged();
      onNotify('success', 'Model saved.');
    },
    onError: (err) => onNotify('error', describeApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBenchmarkModel(id),
    onSuccess: () => {
      onChanged();
      onNotify('success', 'Model deleted.');
    },
    onError: (err) => onNotify('error', describeApiError(err)),
  });

  const handleDelete = (m: BenchmarkModel) => {
    if (window.confirm(`Delete “${m.name}” and all of its scores?`)) deleteMutation.mutate(m.id);
  };

  const invalid = draft ? parsedScores(draft).invalid : [];

  return (
    <section className="bench-admin__card">
      <div className="bench-admin__head">
        <div>
          <h3 className="font-serif">Models</h3>
          <p className="bench-admin__hint">Unpublished models show here but not on the public page. Leave a score blank if the model hasn’t been tested in that category.</p>
        </div>
        <button type="button" className="btn-secondary btn-secondary--small" onClick={() => setDraft(emptyDraft())} disabled={categories.length === 0}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add model
        </button>
      </div>

      {categories.length === 0 && <p className="bench-admin__empty">Add at least one category before adding models.</p>}
      {models.length === 0 && categories.length > 0 && !draft && <p className="bench-admin__empty">No models yet.</p>}

      {models.map((m) => (
        <div key={m.id} className="bench-admin__row">
          <div>
            <strong>
              {m.name}
              {!m.isPublished && <span className="bench-admin__badge">Unpublished</span>}
            </strong>
            <small>
              {m.creator || 'No creator'} · overall {m.overall === null ? '—' : m.overall.toFixed(1)} · {Object.keys(m.scores).length} of {categories.length} categories
            </small>
          </div>
          <div className="bench-admin__actions">
            <button type="button" className="btn-secondary btn-secondary--small" onClick={() => startEdit(m)} aria-label={`Edit ${m.name}`}>
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button type="button" className="btn-danger btn-danger--small" onClick={() => handleDelete(m)} aria-label={`Delete ${m.name}`}>
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}

      {draft && (
        <form
          className="bench-admin__form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <label className="bench-admin__field">
            <span>Model name</span>
            <input className="bench-input" value={draft.name} maxLength={150} required onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="bench-admin__field">
            <span>Creator</span>
            <input className="bench-input" value={draft.creator} maxLength={100} onChange={(e) => setDraft({ ...draft, creator: e.target.value })} />
          </label>
          <label className="bench-admin__field is-wide">
            <span>Note (where or when it was tested)</span>
            <input className="bench-input" value={draft.notes} maxLength={300} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </label>
          <div className="bench-admin__field is-wide">
            <span>Scores out of 100</span>
            <div className="bench-admin__scores">
              {categories.map((c) => (
                <label key={c.id} className="bench-admin__field">
                  <span>{c.name}</span>
                  <input
                    className="bench-input"
                    inputMode="decimal"
                    placeholder="—"
                    value={draft.scores[c.slug] ?? ''}
                    onChange={(e) => setDraft({ ...draft, scores: { ...draft.scores, [c.slug]: e.target.value } })}
                  />
                </label>
              ))}
            </div>
          </div>
          <label className="bench-admin__check">
            <input type="checkbox" checked={draft.isOpenWeights} onChange={(e) => setDraft({ ...draft, isOpenWeights: e.target.checked })} />
            Open weights
          </label>
          <label className="bench-admin__check">
            <input type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} />
            Published
          </label>
          {invalid.length > 0 && (
            <p className="is-wide" role="alert" style={{ color: '#b91c1c', fontSize: '.78rem', fontWeight: 700 }}>
              Scores must be numbers from 0 to 100: {invalid.join(', ')}.
            </p>
          )}
          <div className="bench-admin__actions is-wide">
            <button type="submit" className="btn-primary btn-primary--small" disabled={!draft.name.trim() || invalid.length > 0 || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              Save model
            </button>
            <button type="button" className="btn-secondary btn-secondary--small" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
