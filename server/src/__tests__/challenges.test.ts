import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, db } from './setup';

describe('Challenges API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  describe('GET /api/challenges/templates', () => {
    it('returns challenge templates', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .get('/api/challenges/templates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.templates).toBeDefined();
      expect(Array.isArray(res.body.templates)).toBe(true);
      expect(res.body.templates.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/challenges', () => {
    it('creates a public challenge', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Phone-Free Mornings',
          description: 'No phone before 9am',
          durationDays: 7,
          dailyRequirement: 'No phone before 9am',
          category: 'phone_free',
          startsAt: tomorrow(),
          isPublic: true,
          lat: 30.2672,
          lng: -97.7431,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });

    it('rejects minors from creating challenges', async () => {
      const { token } = await createTestUser({ isMinor: true, dateOfBirth: '2012-01-01' });

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Teen Challenge',
          durationDays: 7,
          dailyRequirement: 'Something daily',
          category: 'custom',
          startsAt: tomorrow(),
          isPublic: false,
        });

      expect(res.status).toBe(403);
    });

    it('rejects invalid category', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Bad Challenge',
          durationDays: 7,
          dailyRequirement: 'Something',
          category: 'invalid_category',
          startsAt: tomorrow(),
          isPublic: true,
        });

      expect(res.status).toBe(400);
    });

    it('rejects duration over 365 days', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Way Too Long',
          durationDays: 400,
          dailyRequirement: 'Something',
          category: 'custom',
          startsAt: tomorrow(),
          isPublic: true,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/challenges?type=mine', () => {
    it('returns user challenges', async () => {
      const { token } = await createTestUser();

      // Create a challenge
      const createRes = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'My Challenge',
          durationDays: 14,
          dailyRequirement: 'Walk 30 min',
          category: 'walk',
          startsAt: tomorrow(),
          isPublic: false,
        });

      const challengeId = createRes.body.id;

      // Join it
      await request(app)
        .post(`/api/challenges/${challengeId}/join`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/challenges')
        .query({ type: 'mine' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.challenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/challenges?type=public', () => {
    it('requires lat and lng', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .get('/api/challenges')
        .query({ type: 'public' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('validation');
    });
  });

  describe('POST /api/challenges/:id/join', () => {
    it('joins a challenge', async () => {
      const { token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Group Challenge',
          durationDays: 7,
          dailyRequirement: 'No screens after 9pm',
          category: 'digital_sunset',
          startsAt: tomorrow(),
          isPublic: true,
          lat: 30.2672,
          lng: -97.7431,
        });

      const res = await request(app)
        .post(`/api/challenges/${createRes.body.id}/join`)
        .set('Authorization', `Bearer ${joinerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent challenge', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/challenges/00000000-0000-0000-0000-000000000000/join')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/challenges/:id', () => {
    it('returns challenge detail', async () => {
      const { token } = await createTestUser();

      const createRes = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Detail Challenge',
          description: 'Testing detail endpoint',
          durationDays: 30,
          dailyRequirement: 'Log 3 gratitudes',
          category: 'gratitude',
          startsAt: tomorrow(),
          isPublic: true,
          lat: 30.2672,
          lng: -97.7431,
        });

      const res = await request(app)
        .get(`/api/challenges/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.challenge).toBeDefined();
      expect(res.body.challenge.title).toBe('Detail Challenge');
      expect(res.body.challenge.durationDays).toBe(30);
    });

    it('returns 404 for non-existent challenge', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .get('/api/challenges/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/challenges/:id/log', () => {
    it('logs a day completion', async () => {
      const { token } = await createTestUser();

      const createRes = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Logging Challenge',
          durationDays: 7,
          dailyRequirement: 'Do the thing',
          category: 'custom',
          startsAt: tomorrow(),
          isPublic: false,
        });

      // Join first
      await request(app)
        .post(`/api/challenges/${createRes.body.id}/join`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post(`/api/challenges/${createRes.body.id}/log`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dayNumber: 1, completed: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid day number', async () => {
      const { token } = await createTestUser();

      const createRes = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Validate Challenge',
          durationDays: 7,
          dailyRequirement: 'Run',
          category: 'custom',
          startsAt: tomorrow(),
          isPublic: false,
        });

      const res = await request(app)
        .post(`/api/challenges/${createRes.body.id}/log`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dayNumber: 0, completed: true });

      expect(res.status).toBe(400);
    });
  });
});
