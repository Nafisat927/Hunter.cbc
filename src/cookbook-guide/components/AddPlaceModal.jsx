import { useCallback, useEffect, useState } from 'react';
import Modal from './Modal';
import PlaceSearch from './PlaceSearch';
import SingleSelectDropdown from './SingleSelectDropdown';
import TagsMultiSelect from './TagsMultiSelect';
import DishesInput from './DishesInput';
import { categoryOptions, cuisineOptions } from '../lib/formOptions';
import { sbClient } from '../lib/supabaseClient';
import { geocodeAddress } from '../lib/googleMapsLoader';
import { uploadPhotos } from '../lib/photoUpload';
import PhotoUploadField from './PhotoUploadField';

const cuisineSelectOptions = cuisineOptions.map((c) => ({ value: c, label: c }));
const priceSelectOptions = [
  { value: '1', label: '$ ($1–25)' },
  { value: '2', label: '$$ ($25–50)' },
  { value: '3', label: '$$$ ($50–100)' },
  { value: '4', label: '$$$$ ($100+)' },
];

const emptyForm = {
  name: '',
  category: '',
  cuisine: '',
  address: '',
  lat: null,
  lng: null,
  price: '',
  dishes: [],
  tags: [],
  notes: '',
  mapsUrl: '',
};

export default function AddPlaceModal({ open, onClose, currentUser, editingPlace, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [pendingPhotoFiles, setPendingPhotoFiles] = useState([]);

  // Populate the form when editing, reset when adding fresh.
  useEffect(() => {
    if (open) {
      setForm(
        editingPlace
          ? {
              name: editingPlace.name,
              category: editingPlace.category,
              cuisine: editingPlace.cuisine,
              address: editingPlace.address,
              lat: editingPlace.lat,
              lng: editingPlace.lng,
              price: String(editingPlace.price || ''),
              dishes: editingPlace.dishes || [],
              tags: editingPlace.tags || [],
              notes: editingPlace.notes || '',
              mapsUrl: editingPlace.maps_url || '',
            }
          : emptyForm
      );
      setError('');
      setSearchStatus('');
      setExistingPhotoUrls(editingPlace?.photos || []);
      setPendingPhotoFiles([]);
    }
  }, [open, editingPlace]);

  // A suggestion was picked in PlaceSearch: pull its details into the form.
  const handlePlaceSelect = async (place) => {
    try {
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'googleMapsURI'],
      });
      const lat = place.location.lat();
      const lng = place.location.lng();
      const mapsUrl =
        place.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      setForm((f) => ({
        ...f,
        name: f.name || place.displayName || '',
        address: place.formattedAddress || '',
        lat,
        lng,
        mapsUrl,
      }));
      setSearchStatus('✅ Details filled in');
      setTimeout(() => setSearchStatus(''), 3000);
    } catch (err) {
      console.error('Place fetch error:', err);
      setSearchStatus('⚠️ Could not get details');
    }
  };

  const handleSearchUnavailable = useCallback(
    () => setSearchStatus('⚠️ Place search unavailable (check VITE_GOOGLE_MAPS_KEY)'),
    []
  );

  const updateField = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleAddressBlur = async () => {
    if (form.lat && form.lng) return; // already have coords from autocomplete
    if (!form.address.trim()) return;
    const coords = await geocodeAddress(form.address.trim());
    if (coords) updateField('lat', coords.lat), updateField('lng', coords.lng);
  };

  const handleClose = () => {
    setForm(emptyForm);
    setError('');
    setExistingPhotoUrls([]);
    setPendingPhotoFiles([]);
    onClose();
  };

  const handleSubmit = async () => {
    setError('');

    if (
      !form.name.trim() ||
      !form.category ||
      !form.cuisine ||
      !form.address.trim() ||
      !form.price
    ) {
      setError('Please fill in all required fields (*)');
      return;
    }

    let lat = form.lat;
    let lng = form.lng;
    if (!lat || !lng) {
      setError('⏳ Looking up coordinates...');
      const coords = await geocodeAddress(form.address.trim());
      if (!coords) {
        setError('⚠️ Could not find coordinates for this address. Try adding the city name.');
        return;
      }
      lat = coords.lat;
      lng = coords.lng;
      setError('');
    }

    const meta = currentUser?.user_metadata || {};
    const recName =
      `${meta.first_name || ''} ${meta.last_initial || ''}`.trim() ||
      currentUser?.email ||
      'Eboard Member';
    const recRole = meta.role || 'Eboard';
    const recAvatarUrl = meta.avatar_url || null;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      cuisine: form.cuisine,
      address: form.address.trim(),
      lat,
      lng,
      recommender_name: recName,
      recommender_role: recRole,
      recommender_avatar_url: recAvatarUrl,
      dishes: form.dishes,
      tags: form.tags,
      notes: form.notes.trim(),
      price: parseInt(form.price),
      maps_url: form.mapsUrl || null,
    };

    setSaving(true);
    let dbError;
    if (editingPlace) {
      const newUrls = await uploadPhotos('place-photos', editingPlace.id, pendingPhotoFiles);
      payload.photos = [...existingPhotoUrls, ...newUrls];
      ({ error: dbError } = await sbClient.from('places').update(payload).eq('id', editingPlace.id));
    } else {
      payload.created_at = new Date().toISOString();
      const { data: inserted, error: insertErr } = await sbClient
        .from('places')
        .insert(payload)
        .select()
        .single();
      dbError = insertErr;
      if (!dbError && pendingPhotoFiles.length > 0) {
        const newUrls = await uploadPhotos('place-photos', inserted.id, pendingPhotoFiles);
        await sbClient.from('places').update({ photos: newUrls }).eq('id', inserted.id);
      }
    }
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    await onSaved?.();
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editingPlace ? 'Edit place' : 'Add a place'}
      width="clamp(360px, 41vw, 570px)"
    >
      <div className="add-form-grid">
        <div className="span2" style={{ position: 'relative' }}>
          <PlaceSearch onSelect={handlePlaceSelect} onUnavailable={handleSearchUnavailable} />
          <div style={{ fontSize: '0.78rem', color: 'rgba(26,26,46,0.55)', marginTop: 4, minHeight: 16 }}>
            {searchStatus}
          </div>
        </div>

        <input
          type="text"
          className="e-input span2"
          placeholder="Place name *"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
        />

        <SingleSelectDropdown
          placeholder="Category *"
          options={categoryOptions}
          value={form.category}
          onChange={(v) => updateField('category', v)}
        />

        <SingleSelectDropdown
          placeholder="Cuisine *"
          options={cuisineSelectOptions}
          value={form.cuisine}
          onChange={(v) => updateField('cuisine', v)}
        />

        <input
          type="text"
          className="e-input span2"
          placeholder="Address *"
          value={form.address}
          onChange={(e) => updateField('address', e.target.value)}
          onBlur={handleAddressBlur}
        />

        {/* Same in-app dropdown as Category/Cuisine, so the list opens right under the box
            (the browser's native <select> popup can open far from it on phones). */}
        <div className="span2">
          <SingleSelectDropdown
            placeholder="Price *"
            options={priceSelectOptions}
            value={form.price}
            onChange={(v) => updateField('price', v)}
            searchable={false}
          />
        </div>

        <div className="span2">
          <TagsMultiSelect value={form.tags} onChange={(v) => updateField('tags', v)} />
        </div>

        <div className="span2">
          <DishesInput value={form.dishes} onChange={(v) => updateField('dishes', v)} />
        </div>

        <textarea
          className="e-input span2"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
        />

        <div className="span2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PhotoUploadField
            existingUrls={existingPhotoUrls}
            pendingFiles={pendingPhotoFiles}
            onAddFiles={(files) => setPendingPhotoFiles((f) => [...f, ...files])}
            onRemoveExisting={(url) =>
              setExistingPhotoUrls((urls) => urls.filter((u) => u !== url))
            }
            onRemovePending={(i) =>
              setPendingPhotoFiles((files) => files.filter((_, idx) => idx !== i))
            }
          />
        </div>
      </div>

      <div className="e-error">{error}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="e-btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : editingPlace ? 'Save changes' : 'Add place'}
        </button>
        <button className="e-btn-secondary" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
