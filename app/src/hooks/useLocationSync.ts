import { useEffect, useRef } from 'react';
import { useLocation } from './useLocation';
import api from '../services/api';

// Updates the user's approximate location on the server when the app opens
// This powers the Discover feature (find nearby people)
export function useLocationSync() {
  const location = useLocation();
  const synced = useRef(false);

  useEffect(() => {
    if (location.loading || location.error || synced.current) return;
    synced.current = true;

    api.put('/users/me/location', {
      latitude: location.latitude,
      longitude: location.longitude,
    }).catch(() => {});
  }, [location.loading, location.error]);
}
