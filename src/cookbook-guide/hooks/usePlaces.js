import { useEffect, useState, useCallback } from 'react';
import { sbClient } from '../lib/supabaseClient';

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    cuisine: row.cuisine,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    recommender: {
      name: row.recommender_name,
      role: row.recommender_role,
      avatar: row.recommender_avatar || '👤',
      avatarUrl: row.recommender_avatar_url || null,
      color: row.recommender_color || '#E8E4DC',
    },
    dishes: row.dishes || [],
    notes: row.notes || '',
    tags: row.tags || [],
    photos: row.photos || [],
    price: row.price,
    rating: row.rating,
    maps_url: row.maps_url || null,
  };
}

export function usePlaces() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    const { data, error: sbError } = await sbClient
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });

    if (sbError) {
      console.error('Error loading places:', sbError.message);
      setError(sbError.message);
      setLoading(false);
      return;
    }

    setPlaces(data.map(mapRow));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  return { places, loading, error, reload: loadPlaces };
}
