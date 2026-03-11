import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { querySearch } from '../aiApi';
import type { QueryResult } from '../aiApi';
import type { FirestoreUser } from '../types/user';
import type { SavedAnswerSource, SavedAnswerRelate, PostVisibility } from '../types/userData';
import { saveDiscovery } from '../services/userData';
import { loadPreferences } from '../services/settingsPreferences';
import { db } from '../firebase';
import { nanoid } from 'nanoid';
import { getSearchUrl } from './SearchBar';

const EXAMPLE_QUERIES = [
  'How does photosynthesis work?',
  'What causes the seasons?',
  'How do vaccines work?',
];

function AnswerBlock({ markdown }: { markdown: string }) {
  return (
    <div className="discover-answer">
      <h3 className="discover-section-title">Answer</h3>
      <div className="discover-markdown">
        <Markdown>{markdown}</Markdown>
      </div>
    </div>
  );
}

function RelatesBlock({ relates }: { relates: SavedAnswerRelate[] }) {
  const navigate = useNavigate();
  if (relates.length === 0) return null;
  return (
    <div className="discover-relates">
      <h3 className="discover-section-title">Related questions</h3>
      <div className="discover-relates-list">
        {relates.map(({ question }) => (
          <button
            key={question}
            type="button"
            className="discover-relate-btn"
            onClick={() => navigate(getSearchUrl(question, nanoid()))}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

function SourcesBlock({ sources }: { sources: SavedAnswerSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="discover-sources">
      <h3 className="discover-section-title">Sources</h3>
      <div className="discover-sources-grid">
        {sources.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="discover-source-card"
          >
            <span className="discover-source-name">{s.name}</span>
            <span className="discover-source-domain">{new URL(s.url).hostname}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

interface DiscoverResultProps {
  user: FirestoreUser | null;
}

export default function DiscoverResult({ user }: DiscoverResultProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = decodeURIComponent(searchParams.get('q') || '').trim();
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(!!query);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveVisibility, setSaveVisibility] = useState<PostVisibility>(() => loadPreferences().defaultSaveVisibility);

  useEffect(() => {
    if (!query) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    setResult(null);
    querySearch(query, nanoid(), true, ctrl.signal)
      .then((r) => {
        setResult(r);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResult(null);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [query]);

  async function handleSave() {
    if (!user || !result || saving || saved) return;
    setSaving(true);
    try {
      await saveDiscovery(db, user.id, {
        query,
        markdown: result.markdown,
        sources: result.sources,
        relates: result.relates,
        visibility: saveVisibility,
        ...(saveVisibility === 'public' && {
          author: { id: user.id, name: user.name ?? '', userid: user.userid ?? '' },
        }),
      });
      setSaved(true);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!query) {
    return (
      <div className="discover-result-wrap">
        <p className="discover-empty">Enter a question above to see an AI answer.</p>
        <p className="discover-examples-label">Try asking:</p>
        <div className="discover-examples-list">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              className="discover-relate-btn"
              onClick={() => navigate(getSearchUrl(q, nanoid()))}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="discover-result-wrap">
        <div className="discover-loading" role="status" aria-live="polite">
          <span className="discover-loading-spinner" aria-hidden />
          <span>Finding an answer…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="discover-result-wrap">
        <p className="discover-error">{error}</p>
        <button
          type="button"
          className="discover-try-again-btn"
          onClick={() => navigate(getSearchUrl(query, nanoid()))}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="discover-result-wrap">
      <div className="discover-query-heading">{query}</div>
      <AnswerBlock markdown={result.markdown} />
      <RelatesBlock relates={result.relates} />
      <SourcesBlock sources={result.sources} />
      {user && (
        <div className="discover-save-row">
          {saved ? (
            <span className="discover-saved">Saved to your feed.</span>
          ) : (
            <>
              <div className="discover-save-visibility">
                <span className="discover-save-visibility-label">Save to:</span>
                <label className="discover-save-visibility-option">
                  <input
                    type="radio"
                    name="discover-save-visibility"
                    checked={saveVisibility === 'public'}
                    onChange={() => setSaveVisibility('public')}
                    disabled={saving}
                  />
                  <span>Public feed</span>
                </label>
                <label className="discover-save-visibility-option">
                  <input
                    type="radio"
                    name="discover-save-visibility"
                    checked={saveVisibility === 'private'}
                    onChange={() => setSaveVisibility('private')}
                    disabled={saving}
                  />
                  <span>Only my page</span>
                </label>
              </div>
              <button
                type="button"
                className="discover-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save to my feed'}
              </button>
            </>
          )}
        </div>
      )}
      {!user && (
        <p className="discover-signin-hint">Sign in to save this discovery to your feed.</p>
      )}
    </div>
  );
}
