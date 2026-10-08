import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

// Our own input + suggestion list on top of Google's AutocompleteSuggestion API.
// (Google's <gmp-place-autocomplete> widget takes over the whole screen on phones;
// this keeps the suggestions in a dropdown right under the box.)
export default function PlaceSearch({ onSelect, onUnavailable }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const placesRef = useRef(null);
  const tokenRef = useRef(null);
  const skipFetchRef = useRef(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    loadGoogleMaps()
      .then((google) => (placesRef.current = google.maps.places))
      .catch((err) => {
        console.error(err);
        onUnavailable?.();
      });
  }, [onUnavailable]);

  // Fetch suggestions as the user types (debounced).
  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false; // query was just filled in by a pick
      return;
    }
    const input = query.trim();
    if (!input) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const places = placesRef.current;
      if (!places) return;
      // One session token per search keeps it billed as a single autocomplete session.
      tokenRef.current ??= new places.AutocompleteSessionToken();
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: tokenRef.current,
          includedPrimaryTypes: ['establishment'],
        });
        if (cancelled) return;
        setSuggestions(suggestions.filter((s) => s.placePrediction));
        setOpen(true);
      } catch (err) {
        console.error('Place suggestions error:', err);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const pick = (prediction) => {
    skipFetchRef.current = true;
    setQuery(prediction.mainText?.text || prediction.text.text);
    setSuggestions([]);
    setOpen(false);
    tokenRef.current = null; // the session ends with the pick
    onSelect(prediction.toPlace());
  };

  return (
    <div className="tags-multiselect" ref={wrapRef}>
      <input
        type="search"
        className="e-input"
        placeholder="🔍 Search for a place (auto-fills name, address & coords)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="tags-ms-dropdown" role="listbox">
          {suggestions.map(({ placePrediction: p }) => (
            <button
              key={p.placeId}
              type="button"
              role="option"
              className="tags-ms-option place-search-option"
              onClick={() => pick(p)}
            >
              <span>
                <strong>{p.mainText?.text || p.text.text}</strong>
                {p.secondaryText?.text && (
                  <span className="place-search-secondary">{p.secondaryText.text}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
