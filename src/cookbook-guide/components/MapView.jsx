import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { catConfig } from '../lib/catConfig';

const CARTO_KEY = import.meta.env.VITE_CARTO_KEY;

const TILE_URL = CARTO_KEY
  ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Fixed landmark pin, not from Supabase, not filterable. Category: 'college'.
const HUNTER_COLLEGE = { lat: 40.7685, lng: -73.9645, label: 'College' };

export default function MapView({ places, onSelectPlace }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [40.73, -73.99],
      13
    );

    L.tileLayer(TILE_URL, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Static Hunter College landmark pin, added once, independent of the places data.
    const hunterIcon = L.divIcon({
      className: '',
      html: '<div style="font-size:1.8rem;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.2))">🎓</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 4],
    });
    L.marker([HUNTER_COLLEGE.lat, HUNTER_COLLEGE.lng], { icon: hunterIcon })
      .bindTooltip(HUNTER_COLLEGE.label, {
        permanent: false,
        direction: 'top',
        className: 'hunter-tooltip',
      })
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((place) => {
      const cfg = catConfig[place.category];
      if (!cfg) return;

      const icon = L.divIcon({
        className: '',
        html: `<div class="emoji-marker" title="${place.name}">${cfg.emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([place.lat, place.lng], { icon });

      marker.bindPopup(
        `<div class="popup-inner">
          <strong>${place.name}</strong>
          <span>${cfg.label} · ${place.cuisine}</span>
        </div>`,
        { closeButton: false, minWidth: 100 }
      );

      marker.on('click', () => onSelectPlace?.(place));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [places, onSelectPlace]);

  return <div id="map" ref={containerRef} style={{ flex: 1, zIndex: 1 }} />;
}
