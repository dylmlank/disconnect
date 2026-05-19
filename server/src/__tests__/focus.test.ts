import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, db } from './setup';

describe('Focus Sessions API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/focus', () => {
    it('starts a focus session', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 25, intention: 'Deep work on API' });

      expect(res.status).toBe(201);
      expect(res.body.session).toBeDefined();
      expect(res.body.session.durationMinutes).toBe(25);
      expect(res.body.session.intention).toBe('Deep work on API');
      expect(res.body.session.completed).toBe(false);
      expect(res.body.session.endedAt).toBeNull();
    });

    it('rejects duration under 5 minutes', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 3 });

      expect(res.status).toBe(400);
    });

    it('rejects duration over 180 minutes', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 200 });

      expect(res.status).toBe(400);
    });

    it('starts session without intention', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 60 });

      expect(res.status).toBe(201);
      expect(res.body.session.intention).toBeNull();
    });
  });

  describe('POST /api/focus/:id/complete', () => {
    it('completes an active session', async () => {
      const { token } = await createTestUser();

      const startRes = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 25 });

      const sessionId = startRes.body.session.id;

      const res = await request(app)
        .post(`/api/focus/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session.completed).toBe(true);
      expect(res.body.session.endedAt).not.toBeNull();
    });

    it('returns 404 for already-completed session', async () => {
      const { token } = await createTestUser();

      const startRes = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 25 });

      const sessionId = startRes.body.session.id;

      // Complete it
      await request(app)
        .post(`/api/focus/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      // Try to complete again
      const res = await request(app)
        .post(`/api/focus/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('returns 404 for another user session', async () => {
      const { token: token1 } = await createTestUser({ firstName: 'User1' });
      const { token: token2 } = await createTestUser({ firstName: 'User2' });

      const startRes = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token1}`)
        .send({ durationMinutes: 25 });

      const sessionId = startRes.body.session.id;

      const res = await request(app)
        .post(`/api/focus/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/focus/:id/cancel', () => {
    it('cancels an active session', async () => {
      const { token } = await createTestUser();

      const startRes = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 45, intention: 'Reading' });

      const sessionId = startRes.body.session.id;

      const res = await request(app)
        .post(`/api/focus/${sessionId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session.completed).toBe(false);
      expect(res.body.session.endedAt).not.toBeNull();
    });
  });

  describe('GET /api/focus/active', () => {
    it('returns active sessions', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 25 });

      const res = await request(app)
        .get('/api/focus/active')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(1);
    });

    it('excludes completed sessions', async () => {
      const { token } = await createTestUser();

      const startRes = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 25 });

      await request(app)
        .post(`/api/focus/${startRes.body.session.id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/focus/active')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(0);
    });
  });

  describe('GET /api/focus/history', () => {
    it('returns completed session history', async () => {
      const { token } = await createTestUser();

      // Start and complete a session
      const startRes = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 25, intention: 'Coding' });

      await request(app)
        .post(`/api/focus/${startRes.body.session.id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      // Start but cancel another
      const start2 = await request(app)
        .post('/api/focus')
        .set('Authorization', `Bearer ${token}`)
        .send({ durationMinutes: 10 });

      await request(app)
        .post(`/api/focus/${start2.body.session.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/focus/history')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Only completed sessions in history
      expect(res.body.sessions).toHaveLength(1);
      expect(res.body.sessions[0].intention).toBe('Coding');
    });
  });
});
