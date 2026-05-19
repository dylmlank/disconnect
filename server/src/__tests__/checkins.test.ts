import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, db } from './setup';

describe('Check-ins API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/checkins', () => {
    it('creates a daily check-in', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mood: 4,
          goodThing1: 'Had a great morning run',
          goodThing2: 'Good coffee',
          intention: 'Stay focused',
        });

      expect(res.status).toBe(201);
      expect(res.body.checkIn).toBeDefined();
      expect(res.body.checkIn.mood).toBe(4);
      expect(res.body.checkIn.goodThing1).toBe('Had a great morning run');
      expect(res.body.checkIn.intention).toBe('Stay focused');
      expect(res.body.checkIn.checkInDate).toBe(new Date().toISOString().slice(0, 10));
    });

    it('only requires one good thing', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mood: 3,
          goodThing1: 'Just one thing',
        });

      expect(res.status).toBe(201);
      expect(res.body.checkIn.goodThing1).toBe('Just one thing');
    });

    it('rejects duplicate check-in for same day', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 4, goodThing1: 'First' });

      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 5, goodThing1: 'Second attempt' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('already_checked_in');
    });

    it('rejects invalid mood (out of range)', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 6, goodThing1: 'Something good' });

      expect(res.status).toBe(400);
    });

    it('rejects mood 0', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 0, goodThing1: 'Something good' });

      expect(res.status).toBe(400);
    });

    it('rejects missing goodThing1', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 3 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/checkins/today', () => {
    it('returns null when no check-in today', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .get('/api/checkins/today')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.checkIn).toBeNull();
    });

    it('returns today check-in', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 5, goodThing1: 'Great day' });

      const res = await request(app)
        .get('/api/checkins/today')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.checkIn).not.toBeNull();
      expect(res.body.checkIn.mood).toBe(5);
    });
  });

  describe('GET /api/checkins', () => {
    it('returns check-in history', async () => {
      const { user, token } = await createTestUser();

      // Create a check-in for today via API
      await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 4, goodThing1: 'Today was good' });

      // Insert a historical check-in directly
      await db('check_ins').insert({
        user_id: user.id,
        mood: 3,
        good_thing_1: 'Yesterday was ok',
        check_in_date: '2026-01-01',
      });

      const res = await request(app)
        .get('/api/checkins')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.checkIns).toHaveLength(2);
      // Most recent first
      expect(res.body.checkIns[0].mood).toBe(4);
    });
  });
});
