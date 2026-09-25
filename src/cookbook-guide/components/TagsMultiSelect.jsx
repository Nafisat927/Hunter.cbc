import { useEffect, useRef, useState } from 'react';
import { predefinedTags } from '../lib/formOptions';

export default function TagsMultiSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customTags, setCustomTags] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const allOptions = [...new Set([...predefinedTags, ...customTags, ...value])];
  const filtered = allOptions.filter((t) =>
    t.toLowerCase().includes(search.trim().toLowerCase())
  );
  const exactMatch = allOptions.some(
    (t) => t.toLowerCase() === search.trim().toLowerCase()
  );

  const toggle = (tag) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  return (
    <div className="tags-multiselect" ref={ref}>
      <div className="tags-ms-display" onClick={() => setOpen((o) => !o)}>
        {value.length === 0 && <span className="tags-ms-placeholder">Select tags...</span>}
        {value.map((tag) => (
          <span
            key={tag}
            className="tags-ms-pill"
            onClick={(e) => {
              e.stopPropagation();
              toggle(tag);
            }}
          >
            {tag} <span>✕</span>
          </span>
        ))}
        <span className="tags-ms-arrow">▾</span>
      </div>
      {open && (
        <div className="tags-ms-dropdown">
          <input
            type="text"
            className="tags-ms-search"
            placeholder="Search or create..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {filtered.map((tag) => (
            <div
              key={tag}
              className={`tags-ms-option${value.includes(tag) ? ' selected' : ''}`}
              onClick={() => toggle(tag)}
            >
              <span>{tag}</span>
            </div>
          ))}
          {search.trim() && !exactMatch && (
            <div
              className="tags-ms-create"
              onClick={() => {
                const newTag = search.trim();
                setCustomTags((t) => [...t, newTag]);
                onChange([...value, newTag]);
                setSearch('');
              }}
            >
              + Create "{search.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
