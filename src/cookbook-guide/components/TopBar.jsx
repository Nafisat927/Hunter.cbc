import { logoDataUri } from '../lib/logo';

const typeConfig = [
  { cat: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { cat: 'cafe', label: 'Café', emoji: '☕' },
  { cat: 'dessert', label: 'Dessert', emoji: '🍰' },
  { cat: 'boba', label: 'Boba', emoji: '🧋' },
  { cat: 'bar', label: 'Bar', emoji: '🍸' },
];

export default function TopBar({ filters, filterPanelOpen, onToggleFilterPanel }) {
  const { activeTypes, toggleType, typeCounts, anySecondaryActive } = filters;

  return (
    <div className="top-bar">
      <header>
        <div className="logo-block">
          <div className="logo-img">
            <img src={logoDataUri} alt="CookBook Guide" />
          </div>
        </div>

        <button
          className={`search-toggle-btn${anySecondaryActive ? ' has-active' : ''}`}
          title="More filters"
          onClick={onToggleFilterPanel}
        >
          🔍
        </button>

        <div className="header-type-row">
          <button
            className={`chip${activeTypes.has('all') ? ' active' : ''}`}
            data-cat="all"
            onClick={() => toggleType('all')}
          >
            🗺️ All
            <span className="count-badge">{typeCounts.__total ?? ''}</span>
          </button>
          {typeConfig
            .slice()
            .sort((a, b) => (typeCounts[b.cat] || 0) - (typeCounts[a.cat] || 0))
            .map(({ cat, label, emoji }) => (
              <button
                key={cat}
                className={`chip${activeTypes.has(cat) ? ' active' : ''}`}
                data-cat={cat}
                onClick={() => toggleType(cat)}
              >
                {emoji} {label}
                {typeCounts[cat] ? <span className="count-badge">{typeCounts[cat]}</span> : null}
              </button>
            ))}
        </div>
      </header>
    </div>
  );
}
