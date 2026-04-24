import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, createTestBeacon, db } from './setup';

describe('Beacons API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('GET /api/beacons', () => {
    it('returns nearby active beacons', async () => {
      const { user, token } = await createTestUser();
      await createTestBeacon(user.id, { message: 'Come hang!' });

      const res = await request(app)
        .get('/api/beacons')
        .query({ lat: 30.2672, lng: -97.7431, radius: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.beacons).toHaveLength(1);
      expect(res.body.beacons[0].message).toBe('Come hang!');
      expect(res.body.beacons[0].location.latitude).toBeCloseTo(30.2672, 2);
      expect(res.body.beacons[0].location.longitude).toBeCloseTo(-97.7431, 2);
      expect(res.body.beacons[0].creator.firstName).toBe('TestUser');
    });

    it('excludes expired beacons', async () => {
      const { user, token } = await createTestUser();
      await createTestBeacon(user.id, {
        message: 'Expired',
        expires_at: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .get('/api/beacons')
        .query({ lat: 30.2672, lng: -97.7431, radius: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.beacons).toHaveLength(0);
    });

    it('excludes beacons from blocked users', async () => {
      const { user: user1, token: token1 } = await createTestUser({ phone: '+15550004001' });
      const { user: user2 } = await createTestUser({ phone: '+15550004002' });
      await createTestBeacon(user2.id);

      await db('blocks').insert({ blocker_id: user1.id, blocked_id: user2.id });

      const res = await request(app)
        .get('/api/beacons')
        .query({ lat: 30.2672, lng: -97.7431, radius: 10 })
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.beacons).toHaveLength(0);
    });
  });

  describe('POST /api/beacons', () => {
    it('creates a beacon', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/beacons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Playing frisbee at Zilker!',
          activity: 'Frisbee',
          location: { latitude: 30.267, longitude: -97.773 },
          placeName: 'Zilker Park',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });

    it('enforces 1 active beacon per user limit', async () => {
      const { user, token } = await createTestUser();
      await createTestBeacon(user.id);

      const res = await request(app)
        .post('/api/beacons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Second beacon',
          location: { latitude: 30.27, longitude: -97.74 },
        });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('beacon_limit');
    });

    it('blocks minors from creating beacons', async () => {
      const { token } = await createTestUser({
        dateOfBirth: '2012-06-01',
        isMinor: true,
      });

      const res = await request(app)
        .post('/api/beacons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Test',
          location: { latitude: 30.27, longitude: -97.74 },
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/beacons/:id/interest', () => {
    it('expresses interest in a beacon', async () => {
      const { user: creator } = await createTestUser({ phone: '+15550005001' });
      const beacon = await createTestBeacon(creator.id);
      const { token: otherToken } = await createTestUser({ phone: '+15550005002' });

      const res = await request(app)
        .post(`/api/beacons/${beacon.id}/interest`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for expired beacon', async () => {
      const { user: creator } = await createTestUser({ phone: '+15550005003' });
      const beacon = await createTestBeacon(creator.id, {
        expires_at: new Date(Date.now() - 1000),
      });
      const { token: otherToken } = await createTestUser({ phone: '+15550005004' });

      const res = await request(app)
        .post(`/api/beacons/${beacon.id}/interest`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/beacons/:id', () => {
    it('allows creator to delete their beacon', async () => {
      const { user, token } = await createTestUser();
      const beacon = await createTestBeacon(user.id);

      const res = await request(app)
        .delete(`/api/beacons/${beacon.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('prevents non-creator from deleting', async () => {
      const { user: creator } = await createTestUser({ phone: '+15550006001' });
      const beacon = await createTestBeacon(creator.id);
      const { token: otherToken } = await createTestUser({ phone: '+15550006002' });

      const res = await request(app)
        .delete(`/api/beacons/${beacon.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
    });
  });
});
