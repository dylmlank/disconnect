import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, db } from './setup';

describe('Habits API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/habits', () => {
    it('adds a curated habit', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      expect(res.status).toBe(201);
      expect(res.body.habit).toBeDefined();
      expect(res.body.habit.habitId).toBe('exercise');
      expect(res.body.habit.position).toBe(0);
    });

    it('rejects unknown habit IDs', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'nonexistent_habit' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('validation');
    });

    it('enforces max 5 habits', async () => {
      const { token } = await createTestUser();
      const habitIds = ['exercise', 'nature', 'mindfulness', 'reading', 'journaling'];

      for (const habitId of habitIds) {
        const r = await request(app)
          .post('/api/habits')
          .set('Authorization', `Bearer ${token}`)
          .send({ habitId });
        expect(r.status).toBe(201);
      }

      // 6th should fail
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'deep_work' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('max_habits');
    });

    it('assigns sequential positions', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'nature' });

      expect(res.body.habit.position).toBe(1);
    });
  });

  describe('GET /api/habits', () => {
    it('returns habits and today logs', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'nature' });

      const res = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.habits).toHaveLength(2);
      expect(res.body.todayLogs).toHaveLength(0);
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('removes a habit', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      const res = await request(app)
        .delete('/api/habits/exercise')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's gone
      const list = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${token}`);

      expect(list.body.habits).toHaveLength(0);
    });

    it('returns 404 for non-existent habit', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .delete('/api/habits/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/habits/:habitId/log', () => {
    it('logs a habit for today', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      const res = await request(app)
        .post('/api/habits/exercise/log')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.log).toBeDefined();
      expect(res.body.log.habitId).toBe('exercise');
      expect(res.body.log.loggedDate).toBe(new Date().toISOString().slice(0, 10));
    });

    it('is idempotent — second log returns same entry', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      const first = await request(app)
        .post('/api/habits/exercise/log')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const second = await request(app)
        .post('/api/habits/exercise/log')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(first.body.log.id).toBe(second.body.log.id);
    });
  });

  describe('DELETE /api/habits/:habitId/log/:date', () => {
    it('unlogs a habit', async () => {
      const { token } = await createTestUser();
      const today = new Date().toISOString().slice(0, 10);

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      await request(app)
        .post('/api/habits/exercise/log')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const res = await request(app)
        .delete(`/api/habits/exercise/log/${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent log', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .delete('/api/habits/exercise/log/2020-01-01')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('rejects invalid date format', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .delete('/api/habits/exercise/log/not-a-date')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/habits/streaks', () => {
    it('returns streaks for tracked habits', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ habitId: 'exercise' });

      // Log today
      await request(app)
        .post('/api/habits/exercise/log')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      const res = await request(app)
        .get('/api/habits/streaks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.streaks).toHaveLength(1);
      expect(res.body.streaks[0].habitId).toBe('exercise');
      expect(res.body.streaks[0].currentStreak).toBeGreaterThanOrEqual(1);
    });
  });
});
