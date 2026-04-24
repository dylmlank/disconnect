import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser } from './setup';

describe('Blocks API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/blocks', () => {
    it('blocks a user', async () => {
      const { token } = await createTestUser({ phone: '+15550007001' });
      const { user: blocked } = await createTestUser({ phone: '+15550007002' });

      const res = await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: blocked.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/blocks', () => {
    it('returns blocked users', async () => {
      const { user: blocker, token } = await createTestUser({ phone: '+15550008001' });
      const { user: blocked } = await createTestUser({ phone: '+15550008002', firstName: 'Blocked' });

      await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: blocked.id });

      const res = await request(app)
        .get('/api/blocks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.blockedUsers).toHaveLength(1);
      expect(res.body.blockedUsers[0].firstName).toBe('Blocked');
    });
  });

  describe('DELETE /api/blocks/:userId', () => {
    it('unblocks a user', async () => {
      const { token } = await createTestUser({ phone: '+15550009001' });
      const { user: blocked } = await createTestUser({ phone: '+15550009002' });

      await request(app)
        .post('/api/blocks')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: blocked.id });

      const res = await request(app)
        .delete(`/api/blocks/${blocked.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify unblocked
      const listRes = await request(app)
        .get('/api/blocks')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.body.blockedUsers).toHaveLength(0);
    });
  });
});
