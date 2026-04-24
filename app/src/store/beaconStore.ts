import { create } from 'zustand';
import api from '../services/api';
import type { BeaconWithCreator } from '@disconnect/shared';

interface BeaconState {
  beacons: BeaconWithCreator[];
  isLoading: boolean;

  fetchBeacons: (lat: number, lng: number) => Promise<void>;
  createBeacon: (data: {
    message: string;
    activity?: string;
    location: { latitude: number; longitude: number };
    placeName?: string;
  }) => Promise<void>;
  expressInterest: (id: string) => Promise<void>;
  deleteBeacon: (id: string) => Promise<void>;
}

export const useBeaconStore = create<BeaconState>((set) => ({
  beacons: [],
  isLoading: false,

  fetchBeacons: async (lat, lng) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/beacons', { params: { lat, lng } });
      set({ beacons: data.beacons });
    } finally {
      set({ isLoading: false });
    }
  },

  createBeacon: async (beaconData) => {
    await api.post('/beacons', beaconData);
    // Refresh beacons list so the new one appears on the map
    if (beaconData.location) {
      const { data } = await api.get('/beacons', {
        params: { lat: beaconData.location.latitude, lng: beaconData.location.longitude },
      });
      set({ beacons: data.beacons });
    }
  },

  expressInterest: async (id) => {
    await api.post(`/beacons/${id}/interest`);
    set((state) => ({
      beacons: state.beacons.map((b) =>
        b.id === id ? { ...b, hasExpressedInterest: true, interestCount: b.interestCount + 1 } : b,
      ),
    }));
  },

  deleteBeacon: async (id) => {
    await api.delete(`/beacons/${id}`);
    set((state) => ({
      beacons: state.beacons.filter((b) => b.id !== id),
    }));
  },
}));
