import { create } from 'zustand';
import api from '../services/api';
import type { EventWithDistance, EventDetail, EventCategory } from '@disconnect/shared';

interface EventState {
  events: EventWithDistance[];
  currentEvent: EventDetail | null;
  isLoading: boolean;

  fetchEvents: (lat: number, lng: number, category?: EventCategory) => Promise<void>;
  fetchEvent: (id: string) => Promise<void>;
  rsvp: (id: string) => Promise<void>;
  unRsvp: (id: string) => Promise<void>;
  createEvent: (data: {
    title: string;
    description?: string;
    location: { latitude: number; longitude: number };
    address?: string;
    startsAt: string;
    endsAt?: string;
    category: string;
    maxAttendees?: number;
    allAges: boolean;
  }) => Promise<string>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  currentEvent: null,
  isLoading: false,

  fetchEvents: async (lat, lng, category) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string | number> = { lat, lng };
      if (category) params.category = category;
      const { data } = await api.get('/events', { params });
      set({ events: data.events });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchEvent: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/events/${id}`);
      set({ currentEvent: data.event });
    } finally {
      set({ isLoading: false });
    }
  },

  rsvp: async (id) => {
    await api.post(`/events/${id}/rsvp`);
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, hasRsvp: true, attendeeCount: e.attendeeCount + 1 } : e,
      ),
      currentEvent: state.currentEvent?.id === id
        ? { ...state.currentEvent, hasRsvp: true, attendeeCount: state.currentEvent.attendeeCount + 1 }
        : state.currentEvent,
    }));
  },

  unRsvp: async (id) => {
    await api.delete(`/events/${id}/rsvp`);
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, hasRsvp: false, attendeeCount: e.attendeeCount - 1 } : e,
      ),
      currentEvent: state.currentEvent?.id === id
        ? { ...state.currentEvent, hasRsvp: false, attendeeCount: state.currentEvent.attendeeCount - 1 }
        : state.currentEvent,
    }));
  },

  createEvent: async (eventData) => {
    const { data } = await api.post('/events', eventData);
    return data.event.id;
  },

  deleteEvent: async (id) => {
    await api.delete(`/events/${id}`);
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
    }));
  },
}));
