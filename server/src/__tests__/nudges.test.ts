import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, createTestUser, createTestCircle, db } from './setup';

describe('Nudges API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  async function setupCircleWithMembers() {
    const { user: creator, token: creatorToken } = await createTestUser({ firstName: 'Alice' });
    const { user: member, token: memberToken } = await createTestUser({ firstName: 'Bob' });

    const { circle, inviteCode } = await createTestCircle(creator.id, 'Test Circle');

    // Add member to circle
    await db('circle_members').insert({ circle_id: circle.id, user_id: member.id });

    return { creator, creatorToken, member, memberToken, circle };
  }

  describe('POST /api/nudges', () => {
    it('sends a nudge to a circle member', async () => {
      const { creatorToken, member, circle } = await setupCircleWithMembers();

      const res = await request(app)
        .post('/api/nudges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ toUserId: member.id, circleId: circle.id });

      expect(res.status).toBe(201);
      expect(res.body.nudge).toBeDefined();
      expect(res.body.nudge.toUserId).toBe(member.id);
      expect(res.body.nudge.message).toBeTruthy();
    });

    it('sends a nudge with custom message', async () => {
      const { creatorToken, member, circle } = await setupCircleWithMembers();

      const res = await request(app)
        .post('/api/nudges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ toUserId: member.id, circleId: circle.id, message: 'Log your habits!' });

      expect(res.status).toBe(201);
      expect(res.body.nudge.message).toBe('Log your habits!');
    });

    it('prevents self-nudge', async () => {
      const { creator, creatorToken, circle } = await setupCircleWithMembers();

      const res = await request(app)
        .post('/api/nudges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ toUserId: creator.id, circleId: circle.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('self_nudge');
    });

    it('enforces cooldown — cannot nudge same person within 4 hours', async () => {
      const { creatorToken, member, circle } = await setupCircleWithMembers();

      // First nudge
      const first = await request(app)
        .post('/api/nudges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ toUserId: member.id, circleId: circle.id });
      expect(first.status).toBe(201);

      // Second nudge immediately — should fail
      const second = await request(app)
        .post('/api/nudges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ toUserId: member.id, circleId: circle.id });

      expect(second.status).toBe(429);
      expect(second.body.error).toBe('cooldown');
    });

    it('rejects nudge to non-circle-member', async () => {
      const { creatorToken, circle } = await setupCircleWithMembers();
      const { user: outsider } = await createTestUser({ firstName: 'Outsider' });

      const res = await request(app)
        .post('/api/nudges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ toUserId: outsider.id, circleId: circle.id });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('not_in_circle');
    });
  });

  describe('GET /api/nudges', () => {
    it('returns nudges sent to the user', async () => {
      const { creatorToken, member, memberToken, circle } = await setupCircleWithMembers();

      // Send a nudge
      await request(app)
        .post('/api/nudges')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ toUserId: member.id, circleId: circle.id });

      // Fetch from recipient's perspective
      const res = await request(app)
        .get('/api/nudges')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.nudges).toHaveLength(1);
      expect(res.body.nudges[0].fromName).toBe('Alice');
    });
  });

  describe('GET /api/nudges/circle/:circleId/activity', () => {
    it('returns member activity status', async () => {
      const { creatorToken, circle } = await setupCircleWithMembers();

      const res = await request(app)
        .get(`/api/nudges/circle/${circle.id}/activity`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.members).toHaveLength(2);
      // No one has done anything yet
      expect(res.body.members.every((m: any) => !m.activeToday)).toBe(true);
    });

    it('shows active status when member logs a habit', async () => {
      const { creatorToken, member, circle } = await setupCircleWithMembers();
      const today = new Date().toISOString().slice(0, 10);

      // Simulate member logging a habit
      await db('user_habits').insert({ user_id: member.id, habit_id: 'exercise', position: 0 });
      await db('habit_logs').insert({ user_id: member.id, habit_id: 'exercise', logged_date: today });

      const res = await request(app)
        .get(`/api/nudges/circle/${circle.id}/activity`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      const bob = res.body.members.find((m: any) => m.userId === member.id);
      expect(bob.activeToday).toBe(true);
      expect(bob.habitLogged).toBe(true);
    });
  });
});
