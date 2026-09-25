import { catConfig } from '../lib/catConfig';
import { sbClient } from '../lib/supabaseClient';
import Modal from './Modal';

export default function MyRecommendationsModal({
  open,
  onClose,
  currentUser,
  places,
  onEdit,
  onDeleted,
}) {
  const meta = currentUser?.user_metadata || {};
  const recName = `${meta.first_name || ''} ${meta.last_initial || ''}`.trim();
  const matchName = recName || currentUser?.email;

  // Matches the original's logic: places are tied to the user by the
  // recommender_name string stored on each row, not a user_id foreign key.
  const myPlaces = places.filter((p) => p.recommender.name === matchName);

  const handleDelete = async (place) => {
    if (!confirm(`Delete "${place.name}"? This cannot be undone.`)) return;
    const { error } = await sbClient.from('places').delete().eq('id', place.id);
    if (error) {
      alert(error.message);
      return;
    }
    await onDeleted?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your Recommendations"
      width="clamp(320px, 35vw, 520px)"
    >
      {myPlaces.length === 0 ? (
        <div style={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
          No recommendations yet.
        </div>
      ) : (
        myPlaces.map((place) => {
          const cfg = catConfig[place.category] || { emoji: '📍', label: place.category };
          return (
            <div className="my-rec-row" key={place.id}>
              <div className="my-rec-info">
                <div className="my-rec-name">{place.name}</div>
                <div className="my-rec-meta">
                  {cfg.emoji} {cfg.label} · {place.cuisine}
                </div>
              </div>
              <div className="my-rec-actions">
                <button
                  className="btn-rec-edit"
                  title="Edit"
                  onClick={() => {
                    onClose();
                    onEdit(place);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="btn-rec-delete"
                  title="Delete"
                  onClick={() => handleDelete(place)}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })
      )}
    </Modal>
  );
}
