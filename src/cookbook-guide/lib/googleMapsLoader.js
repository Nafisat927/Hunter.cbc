let loadPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!key) {
    return Promise.reject(
      new Error('Missing VITE_GOOGLE_MAPS_KEY in .env — place search autocomplete needs it.')
    );
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=beta`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

// Fallback for when Places Autocomplete didn't fill in coordinates
// (e.g. the address was typed manually instead of picked from the dropdown).
export async function geocodeAddress(address) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
  );
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}
