import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, createTestEvent, db } from './setup';

describe('Events API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('GET /api/events', () => {
    it('returns nearby events', async () => {
      const { user, token } = await createTestUser();
      await createTestEvent(user.id);

      const res = await request(app)
        .get('/api/events')
        .query({ lat: 30.2672, lng: -97.7431, radius: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.events[0].title).toBe('Test Event');
      expect(res.body.events[0].location.latitude).toBeCloseTo(30.2672, 2);
      expect(res.body.events[0].location.longitude).toBeCloseTo(-97.7431, 2);
    });

    it('excludes events from blocked users', async () => {
      const { user: user1, token: token1 } = await createTestUser({ phone: '+15550001001' });
      const { user: user2 } = await createTestUser({ phone: '+15550001002' });
      await createTestEvent(user2.id);

      await db('blocks').insert({ blocker_id: user1.id, blocked_id: user2.id });

      const res = await request(app)
        .get('/api/events')
        .query({ lat: 30.2672, lng: -97.7431, radius: 10 })
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(0);
    });

    it('filters all_ages events for minors', async () => {
      const { user: adult } = await createTestUser({ phone: '+15550002001' });
      const { token: minorToken } = await createTestUser({
        phone: '+15550002002',
        dateOfBirth: '2012-06-01',
        isMinor: true,
      });

      await createTestEvent(adult.id, { all_ages: true, title: 'Family Event' });
      await createTestEvent(adult.id, { all_ages: false, title: 'Adults Only' });

      const res = await request(app)
        .get('/api/events')
        .query({ lat: 30.2672, lng: -97.7431, radius: 10 })
        .set('Authorization', `Bearer ${minorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.events[0].title).toBe('Family Event');
    });

    it('filters by category', async () => {
      const { user, token } = await createTestUser();
      await createTestEvent(user.id, { category: 'outdoors', title: 'Hike' });
      await createTestEvent(user.id, { category: 'sports', title: 'Basketball' });

      const res = await request(app)
        .get('/api/events')
        .query({ lat: 30.2672, lng: -97.7431, radius: 10, category: 'sports' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.events[0].title).toBe('Basketball');
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/events')
        .query({ lat: 30.2672, lng: -97.7431 });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/events', () => {
    it('creates an event', async () => {
      const { token } = await createTestUser();
      const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Trail Run',
          description: 'Morning run on the trail',
          location: { latitude: 30.27, longitude: -97.74 },
          address: '456 Park Ave',
          startsAt,
          category: 'sports',
          allAges: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.id).toBeDefined();
    });

    it('blocks minors from creating events', async () => {
      const { token } = await createTestUser({
        dateOfBirth: '2012-06-01',
        isMinor: true,
      });

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test',
          location: { latitude: 30.27, longitude: -97.74 },
          startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          category: 'games',
          allAges: true,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/events/:id/rsvp', () => {
    it('adds an RSVP', async () => {
      const { user, token } = await createTestUser();
      const event = await createTestEvent(user.id);

      const res = await request(app)
        .post(`/api/events/${event.id}/rsvp`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('respects max attendees', async () => {
      const { user: creator } = await createTestUser({ phone: '+15550003001' });
      const event = await createTestEvent(creator.id, { max_attendees: 1 });

      // Fill the event
      const { user: user1 } = await createTestUser({ phone: '+15550003002' });
      await db('event_rsvps').insert({ event_id: event.id, user_id: user1.id });

      // Try to RSVP when full
      const { token: token2 } = await createTestUser({ phone: '+15550003003' });
      const res = await request(app)
        .post(`/api/events/${event.id}/rsvp`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/events/:id', () => {
    it('returns event detail with attendees', async () => {
      const { user, token } = await createTestUser();
      const event = await createTestEvent(user.id);

      await db('event_rsvps').insert({ event_id: event.id, user_id: user.id });

      const res = await request(app)
        .get(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.event.id).toBe(event.id);
      expect(res.body.event.attendees).toHaveLength(1);
      expect(res.body.event.hasRsvp).toBe(true);
      expect(res.body.event.chatUnlocked).toBe(true);
    });

    it('returns 404 for non-existent event', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .get('/api/events/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
