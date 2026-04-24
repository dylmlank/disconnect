import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: 0,
    longitude: 0,
    loading: true,
    error: null,
  });

  const fetchLocation = useCallback(async () => {
    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: 'Location permission is required to find events and beacons near you.',
      }));
      return;
    }

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        loading: false,
        error: null,
      });
    } catch {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: 'Could not get your location. Please try again.',
      }));
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, []);

  return { ...location, retry: fetchLocation };
}
