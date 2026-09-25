import { useEffect, useRef, useState } from 'react';

export default function SingleSelectDropdown({ placeholder, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="tags-multiselect" ref={ref}>
      <div className="tags-ms-display" onClick={() => setOpen((o) => !o)}>
        {selected ? (
          <span>{selected.label}</span>
        ) : (
          <span className="tags-ms-placeholder">{placeholder}</span>
        )}
        <span className="tags-ms-arrow">▾</span>
      </div>
      {open && (
        <div className="tags-ms-dropdown">
          <input
            type="text"
            className="tags-ms-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {filtered.map((o) => (
            <div
              key={o.value}
              className={`tags-ms-option${o.value === value ? ' selected' : ''}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
                setSearch('');
              }}
            >
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
