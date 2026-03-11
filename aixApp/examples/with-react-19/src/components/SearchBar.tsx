import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';

export function getSearchUrl(query: string, rid: string) {
  return `/search?q=${encodeURIComponent(query)}&rid=${rid}`;
}

interface SearchBarProps {
  /** When provided (e.g. on /search), input stays in sync with URL so user can edit and re-search. */
  queryFromUrl?: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** Size variant for hero vs nav. */
  variant?: 'default' | 'hero';
}

export default function SearchBar({
  queryFromUrl = undefined,
  placeholder = 'Ask anything…',
  autoFocus = true,
  variant = 'default',
}: SearchBarProps) {
  const [value, setValue] = useState(queryFromUrl ?? '');
  const navigate = useNavigate();

  useEffect(() => {
    if (queryFromUrl !== undefined) setValue(queryFromUrl);
  }, [queryFromUrl]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) navigate(getSearchUrl(q, nanoid()));
  }

  const formClass =
    variant === 'hero'
      ? 'discover-search-form discover-search-form--hero'
      : 'discover-search-form';

  return (
    <form onSubmit={handleSubmit} className={formClass} role="search">
      <label className="discover-search-label" htmlFor="discover-search-input">
        <input
          id="discover-search-input"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="discover-search-input"
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label="Search for an answer"
        />
        <button type="submit" className="discover-search-btn" aria-label="Search">
          <span className="discover-search-btn-text">Search</span>
          <span className="discover-search-btn-arrow" aria-hidden>→</span>
        </button>
      </label>
    </form>
  );
}
