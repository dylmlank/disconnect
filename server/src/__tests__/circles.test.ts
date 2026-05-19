import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, db } from './setup';

describe('Circles API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/circles', () => {
    it('creates a circle and auto-adds creator as member', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Study Squad' });

      expect(res.status).toBe(201);
      expect(res.body.circle).toBeDefined();
      expect(res.body.circle.name).toBe('Study Squad');
      expect(res.body.circle.inviteCode).toHaveLength(8);
      expect(res.body.circle.memberCount).toBe(1);
    });

    it('rejects minors from creating circles', async () => {
      const { token } = await createTestUser({ isMinor: true, dateOfBirth: '2012-01-01' });

      const res = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Circle' });

      expect(res.status).toBe(403);
    });

    it('enforces max 3 circles per user', async () => {
      const { token } = await createTestUser();

      // Create 3 circles
      for (let i = 0; i < 3; i++) {
        const r = await request(app)
          .post('/api/circles')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: `Circle ${i}` });
        expect(r.status).toBe(201);
      }

      // 4th should fail
      const res = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Circle 4' });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('max_circles');
    });

    it('rejects empty name', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/circles/:id/join', () => {
    it('joins a circle by invite code', async () => {
      const { token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Test Circle' });

      const inviteCode = createRes.body.circle.inviteCode;
      const circleId = createRes.body.circle.id;

      const res = await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode });

      expect(res.status).toBe(200);
      expect(res.body.circle.name).toBe('Test Circle');
    });

    it('rejects invalid invite code', async () => {
      const { token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Private Circle' });

      const circleId = createRes.body.circle.id;

      const res = await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode: 'badcode1' });

      expect(res.status).toBe(404);
    });

    it('rejects duplicate membership', async () => {
      const { token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Test Circle' });

      const inviteCode = createRes.body.circle.inviteCode;
      const circleId = createRes.body.circle.id;

      // First join
      await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode });

      // Second join attempt
      const res = await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('already_member');
    });
  });

  describe('GET /api/circles', () => {
    it('lists user circles', async () => {
      const { token } = await createTestUser();

      await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Circle A' });

      await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Circle B' });

      const res = await request(app)
        .get('/api/circles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.circles).toHaveLength(2);
    });
  });

  describe('GET /api/circles/:id', () => {
    it('returns circle detail with members', async () => {
      const { token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Detail Circle' });

      const circleId = createRes.body.circle.id;
      const inviteCode = createRes.body.circle.inviteCode;

      await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode });

      const res = await request(app)
        .get(`/api/circles/${circleId}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.circle.name).toBe('Detail Circle');
      expect(res.body.circle.members).toHaveLength(2);
    });

    it('returns 404 for non-member', async () => {
      const { token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { token: outsiderToken } = await createTestUser({ firstName: 'Outsider' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Private Circle' });

      const res = await request(app)
        .get(`/api/circles/${createRes.body.circle.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/circles/:id/leave', () => {
    it('allows member to leave', async () => {
      const { token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Leaveable Circle' });

      const circleId = createRes.body.circle.id;
      const inviteCode = createRes.body.circle.inviteCode;

      await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode });

      const res = await request(app)
        .delete(`/api/circles/${circleId}/leave`)
        .set('Authorization', `Bearer ${joinerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('deletes circle when creator leaves', async () => {
      const { token } = await createTestUser();

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Doomed Circle' });

      const circleId = createRes.body.circle.id;

      const res = await request(app)
        .delete(`/api/circles/${circleId}/leave`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify circle is gone
      const detail = await request(app)
        .get(`/api/circles/${circleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(detail.status).toBe(404);
    });
  });

  describe('DELETE /api/circles/:id/members/:userId', () => {
    it('creator can remove a member', async () => {
      const { user: creator, token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { user: joiner, token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Strict Circle' });

      const circleId = createRes.body.circle.id;
      const inviteCode = createRes.body.circle.inviteCode;

      await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode });

      const res = await request(app)
        .delete(`/api/circles/${circleId}/members/${joiner.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('non-creator cannot remove members', async () => {
      const { user: creator, token: creatorToken } = await createTestUser({ firstName: 'Creator' });
      const { user: joiner, token: joinerToken } = await createTestUser({ firstName: 'Joiner' });

      const createRes = await request(app)
        .post('/api/circles')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Protected Circle' });

      const circleId = createRes.body.circle.id;
      const inviteCode = createRes.body.circle.inviteCode;

      await request(app)
        .post(`/api/circles/${circleId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .send({ inviteCode });

      // Joiner tries to remove creator
      const res = await request(app)
        .delete(`/api/circles/${circleId}/members/${creator.id}`)
        .set('Authorization', `Bearer ${joinerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
