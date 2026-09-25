import { useMemo, useState } from 'react';

function toggle(current, value, allValue, allOptions) {
  const next = new Set(current);
  if (value === allValue) {
    return new Set([allValue]);
  }
  next.delete(allValue);
  if (next.has(value)) {
    next.delete(value);
    if (next.size === 0) next.add(allValue);
  } else {
    next.add(value);
    if (allOptions.every((o) => next.has(o))) {
      return new Set([allValue]);
    }
  }
  return next;
}

export function useFilters(places) {
  const [activeTypes, setActiveTypes] = useState(new Set(['all']));
  const [activeCuisines, setActiveCuisines] = useState(new Set(['all']));
  const [activePrices, setActivePrices] = useState(new Set(['all']));
  const [activeRatings, setActiveRatings] = useState(new Set(['all']));
  const [activeTags, setActiveTags] = useState(new Set());

  const typeCounts = useMemo(() => {
    const counts = {};
    places.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
    counts.__total = places.length;
    return counts;
  }, [places]);

  const cuisineCounts = useMemo(() => {
    const counts = {};
    places.forEach((p) => (counts[p.cuisine] = (counts[p.cuisine] || 0) + 1));
    return counts;
  }, [places]);

  const sortedCuisines = useMemo(
    () => Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]).map(([c]) => c),
    [cuisineCounts]
  );

  const toggleType = (val) =>
    setActiveTypes((s) =>
      toggle(s, val, 'all', Object.keys(typeCounts).filter((k) => k !== '__total'))
    );
  const toggleCuisine = (val) =>
    setActiveCuisines((s) => toggle(s, val, 'all', sortedCuisines));
  const togglePrice = (val) =>
    setActivePrices((s) => toggle(s, val, 'all', ['1', '2', '3', '4']));
  const toggleRating = (val) =>
    setActiveRatings((s) => toggle(s, val, 'all', ['1', '2', '3']));
  const toggleTag = (tag) =>
    setActiveTags((s) => {
      const next = new Set(s);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchType = activeTypes.has('all') || activeTypes.has(p.category);
      const matchCuisine = activeCuisines.has('all') || activeCuisines.has(p.cuisine);
      const matchPrice =
        activePrices.has('all') || !p.price || activePrices.has(String(p.price));
      const matchRating =
        activeRatings.has('all') || !p.rating || activeRatings.has(String(p.rating));
      const matchTags =
        activeTags.size === 0 ||
        (p.tags && p.tags.some((t) => activeTags.has(t)));
      return matchType && matchCuisine && matchPrice && matchRating && matchTags;
    });
  }, [places, activeTypes, activeCuisines, activePrices, activeRatings, activeTags]);

  const anySecondaryActive =
    !activeCuisines.has('all') ||
    !activePrices.has('all') ||
    !activeRatings.has('all') ||
    activeTags.size > 0;

  return {
    activeTypes, activeCuisines, activePrices, activeRatings, activeTags,
    toggleType, toggleCuisine, togglePrice, toggleRating, toggleTag,
    typeCounts, sortedCuisines,
    filteredPlaces, anySecondaryActive,
  };
}
