import { useState } from 'react';
import { cuisineEmoji } from '../lib/catConfig';
import { predefinedTags } from '../lib/formOptions';

const priceOptions = [
  { val: '1', label: '$' },
  { val: '2', label: '$$' },
  { val: '3', label: '$$$' },
  { val: '4', label: '$$$$' },
];

const ratingOptions = [
  { val: '1', label: '👍' },
  { val: '2', label: '👍👍' },
  { val: '3', label: '👍👍👍' },
];

function collectTags(places) {
  const set = new Set(predefinedTags);
  places.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
  return [...set];
}

export default function FilterPanel({ open, onClose, filters, places }) {
  const {
    activeCuisines, activePrices, activeRatings, activeTags,
    toggleCuisine, togglePrice, toggleRating, toggleTag,
    sortedCuisines,
  } = filters;

  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [customTags, setCustomTags] = useState([]);
  const [priceInfoOpen, setPriceInfoOpen] = useState(false);
  const [ratingInfoOpen, setRatingInfoOpen] = useState(false);

  const allTags = collectTags(places);
  const combinedTags = [...new Set([...allTags, ...customTags])];
  const filteredTagOptions = combinedTags.filter((t) =>
    t.toLowerCase().includes(tagSearch.trim().toLowerCase())
  );
  const exactMatch = combinedTags.some(
    (t) => t.toLowerCase() === tagSearch.trim().toLowerCase()
  );

  return (
    <div className={`filter-panel${open ? ' open' : ''}`}>
      <button className="filter-panel-close" onClick={onClose}>
        ✕
      </button>

      <div className="filter-panel-scroll">
        <div className="filter-panel-title">Filters</div>

        <div className="filter-section">
          <div className="filter-section-title">Tags</div>
          <div className="filter-section-chips">
            <div className="tags-wrap">
              <button
                className={`tags-btn${activeTags.size > 0 ? ' has-active' : ''}`}
                onClick={() => setTagsOpen((o) => !o)}
              >
                <span className="tags-plus">+</span>
              </button>
              {tagsOpen && (
                <div className="tags-popup-inline">
                  <input
                    type="text"
                    className="tags-search"
                    placeholder="Search or create a tag..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="tags-list">
                    {filteredTagOptions.map((tag) => (
                      <div
                        key={tag}
                        className={`tag-option${activeTags.has(tag) ? ' selected' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        <span>{tag}</span>
                        <span className="tag-check">✓</span>
                      </div>
                    ))}
                  </div>
                  {tagSearch.trim() && !exactMatch && (
                    <button
                      className="tags-create"
                      onClick={() => {
                        const newTag = tagSearch.trim();
                        setCustomTags((t) => [...t, newTag]);
                        toggleTag(newTag);
                        setTagSearch('');
                      }}
                    >
                      + Create "{tagSearch.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="selected-tags">
              {[...activeTags].map((tag) => (
                <div key={tag} className="tag-pill">
                  <span>{tag}</span>
                  <span className="tag-remove" onClick={() => toggleTag(tag)}>
                    ✕
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-section-title">Rating</div>
          <div className="filter-section-chips">
            <button
              className={`chip-rating${activeRatings.has('all') ? ' active' : ''}`}
              onClick={() => toggleRating('all')}
            >
              ⭐ All
            </button>
            {ratingOptions.map(({ val, label }) => (
              <button
                key={val}
                className={`chip-rating${activeRatings.has(val) ? ' active' : ''}`}
                onClick={() => toggleRating(val)}
              >
                {label}
              </button>
            ))}
            <div className="price-info-wrap">
              <button
                className="price-info-btn"
                onClick={() => setRatingInfoOpen((o) => !o)}
              >
                𝐢
              </button>
              <div className={`price-tooltip${ratingInfoOpen ? ' visible' : ''}`}>
                <strong>Rating</strong>
                <span>👍 = Good</span>
                <span>👍👍 = Great</span>
                <span>👍👍👍 = Amazing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-section-title">Price</div>
          <div className="filter-section-chips">
            <button
              className={`chip-price${activePrices.has('all') ? ' active' : ''}`}
              onClick={() => togglePrice('all')}
            >
              💰 All
            </button>
            {priceOptions.map(({ val, label }) => (
              <button
                key={val}
                className={`chip-price${activePrices.has(val) ? ' active' : ''}`}
                onClick={() => togglePrice(val)}
              >
                {label}
              </button>
            ))}
            <div className="price-info-wrap">
              <button
                className="price-info-btn"
                onClick={() => setPriceInfoOpen((o) => !o)}
              >
                𝐢
              </button>
              <div className={`price-tooltip${priceInfoOpen ? ' visible' : ''}`}>
                <strong>Per Person Price</strong>
                <span>$ = $1–25</span>
                <span>$$ = $25–50</span>
                <span>$$$ = $50–100</span>
                <span>$$$$ = $100+</span>
              </div>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-section-title">Cuisine</div>
          <div className="filter-section-chips">
            <button
              className={`chip-cuisine${activeCuisines.has('all') ? ' active' : ''}`}
              onClick={() => toggleCuisine('all')}
            >
              🌍 All
            </button>
            {sortedCuisines.map((cuisine) => (
              <button
                key={cuisine}
                className={`chip-cuisine${activeCuisines.has(cuisine) ? ' active' : ''}`}
                onClick={() => toggleCuisine(cuisine)}
              >
                {cuisineEmoji[cuisine] || '🍴'} {cuisine}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
