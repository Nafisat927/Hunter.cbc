import { catConfig, cuisineEmoji } from '../lib/catConfig';

export default function PlaceDetailPanel({ place, onClose, currentUser, onEdit }) {
  const isOpen = !!place;
  const cfg = place ? catConfig[place.category] : null;

  return (
    <div className={`side-panel${isOpen ? ' open' : ''}`}>
      <button className="panel-close" title="Close" onClick={onClose}>
        ✕
      </button>

      <div className="panel-scroll">
        {place && (
          <div className="panel-body">
            <div className="panel-name-row">
              <span
                className="cat-badge"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
              {place.cuisine && (
                <>
                  <span className="badge-emoji">{cuisineEmoji[place.cuisine] || '🍴'}</span>
                  <span className="cuisine-badge">{place.cuisine}</span>
                </>
              )}
            </div>

            <div className="panel-name">
              <span className="badge-emoji">{cfg.emoji}</span>
              <span>{place.name}</span>
              {place.maps_url && (
                <a
                  href={place.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maps-link-btn"
                  title="Open in Google Maps"
                >
                  ↗
                </a>
              )}
            </div>

            <div className="panel-address">📍 {place.address}</div>

            <div className="panel-section-label">Recommended by</div>
            <div className="panel-recommender">
              <div className="rec-avatar" style={{ background: place.recommender.color }}>
                {place.recommender.avatarUrl ? (
                  <img
                    src={place.recommender.avatarUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  place.recommender.avatar
                )}
              </div>
              <div className="rec-info">
                <div className="rec-name">{place.recommender.name}</div>
                <div className="rec-role">{place.recommender.role}</div>
              </div>
            </div>

            {place.tags?.length > 0 && (
              <>
                <div className="panel-section-label">Tags</div>
                <div className="dishes-list">
                  {place.tags.map((t) => (
                    <span key={t} className="tag-pill-display">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            {place.dishes?.length > 0 && (
              <>
                <div className="panel-section-label">Must-try dishes</div>
                <div className="dishes-list">
                  {place.dishes.map((d) => (
                    <span key={d} className="dish-tag">
                      {d}
                    </span>
                  ))}
                </div>
              </>
            )}

            {place.notes?.trim() && (
              <>
                <div className="panel-section-label">Notes</div>
                <div className="panel-notes">{place.notes}</div>
              </>
            )}

            {place.photos?.length > 0 && (
              <>
                <div className="panel-section-label">Photos</div>
                <div className="panel-photos">
                  {place.photos.map((url) => (
                    <div key={url} className="photo">
                      <img src={url} alt="" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
