import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import SingleSelectDropdown from './SingleSelectDropdown';
import TagsMultiSelect from './TagsMultiSelect';
import DishesInput from './DishesInput';
import { categoryOptions, cuisineOptions } from '../lib/formOptions';
import { sbClient } from '../lib/supabaseClient';
import { loadGoogleMaps, geocodeAddress } from '../lib/googleMapsLoader';
import { uploadPhotos } from '../lib/photoUpload';
import PhotoUploadField from './PhotoUploadField';

const cuisineSelectOptions = cuisineOptions.map((c) => ({ value: c, label: c }));

const emptyForm = {
  name: '',
  category: '',
  cuisine: '',
  address: '',
  lat: null,
  lng: null,
  price: '',
  rating: '',
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
  const autocompleteContainerRef = useRef(null);
  const autocompleteElRef = useRef(null);

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
              rating: String(editingPlace.rating || ''),
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

  // Set up the Google Places autocomplete element once the modal is open.
  useEffect(() => {
    if (!open || !autocompleteContainerRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !autocompleteContainerRef.current) return;
        // Clear any previous element (e.g. modal re-opened)
        autocompleteContainerRef.current.innerHTML = '';

        const el = new google.maps.places.PlaceAutocompleteElement({
          types: ['establishment'],
        });
        el.style.cssText = 'width:100%;display:block;';
        el.style.setProperty('color-scheme', 'light');
        el.style.setProperty('background-color', '#FAFAF8');
        el.style.setProperty('color', 'var(--ink)');
        el.style.setProperty('border', '1.5px solid #E8E4DC');
        el.style.setProperty('border-radius', '10px');
        el.setAttribute('placeholder', 'Search for a place (auto-fills name, address & coords)');
        autocompleteContainerRef.current.appendChild(el);
        autocompleteElRef.current = el;

        ['gmp-placeselect', 'gmp-select'].forEach((evtName) => {
          el.addEventListener(evtName, async (e) => {
            const place = e.place || e.placePrediction?.toPlace?.();
            if (!place) return;
            try {
              await place.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location', 'googleMapsURI'],
              });
              const lat = place.location.lat();
              const lng = place.location.lng();
              const mapsUrl =
                place.googleMapsURI ||
                `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
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
          });
        });
      })
      .catch((err) => {
        console.error(err);
        setSearchStatus('⚠️ Place search unavailable (check VITE_GOOGLE_MAPS_KEY)');
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

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
      !form.price ||
      !form.rating
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
      rating: parseInt(form.rating),
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
          <div ref={autocompleteContainerRef} />
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

        <select
          className="e-input"
          value={form.price}
          onChange={(e) => updateField('price', e.target.value)}
        >
          <option value="">Price *</option>
          <option value="1">$ ($1–25)</option>
          <option value="2">$$ ($25–50)</option>
          <option value="3">$$$ ($50–100)</option>
          <option value="4">$$$$ ($100+)</option>
        </select>

        <select
          className="e-input"
          value={form.rating}
          onChange={(e) => updateField('rating', e.target.value)}
        >
          <option value="">Rating *</option>
          <option value="1">👍 Good</option>
          <option value="2">👍👍 Great</option>
          <option value="3">👍👍👍 Amazing</option>
        </select>

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
