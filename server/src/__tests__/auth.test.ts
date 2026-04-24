import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { cleanDb, db } from './setup';

describe('Auth API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/auth/create-profile', () => {
    it('creates a new user profile', async () => {
      const res = await request(app)
        .post('/api/auth/create-profile')
        .set('Authorization', 'Bearer fake-token')
        .set('x-test-clerk-id', 'clerk_test_new_user')
        .send({
          firstName: 'NewUser',
          dateOfBirth: '2000-06-15',
          bio: 'Hello world',
          interests: ['hiking', 'yoga'],
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.firstName).toBe('NewUser');
      expect(res.body.user.isMinor).toBe(false);
    });

    it('returns 409 for duplicate clerk_id', async () => {
      // Create first profile
      await request(app)
        .post('/api/auth/create-profile')
        .set('Authorization', 'Bearer fake-token')
        .set('x-test-clerk-id', 'clerk_test_duplicate')
        .send({
          firstName: 'First',
          dateOfBirth: '2000-01-01',
          interests: ['hiking', 'yoga'],
        });

      // Try to create again with same clerk_id
      const res = await request(app)
        .post('/api/auth/create-profile')
        .set('Authorization', 'Bearer fake-token')
        .set('x-test-clerk-id', 'clerk_test_duplicate')
        .send({
          firstName: 'Second',
          dateOfBirth: '2000-01-01',
          interests: ['hiking', 'yoga'],
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('already_registered');
    });

    it('rejects users under 13', async () => {
      const res = await request(app)
        .post('/api/auth/create-profile')
        .set('Authorization', 'Bearer fake-token')
        .set('x-test-clerk-id', 'clerk_test_young')
        .send({
          firstName: 'TooYoung',
          dateOfBirth: '2020-01-01',
          interests: ['hiking', 'yoga'],
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('age_restricted');
    });

    it('correctly sets isMinor for 15-year-old', async () => {
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
      const dob = fifteenYearsAgo.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/auth/create-profile')
        .set('Authorization', 'Bearer fake-token')
        .set('x-test-clerk-id', 'clerk_test_minor')
        .send({
          firstName: 'MinorUser',
          dateOfBirth: dob,
          interests: ['hiking', 'yoga'],
        });

      expect(res.status).toBe(201);
      expect(res.body.user.isMinor).toBe(true);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/create-profile')
        .set('Authorization', 'Bearer fake-token')
        .set('x-test-clerk-id', 'clerk_test_invalid')
        .send({
          firstName: 'NoInterests',
          dateOfBirth: '2000-01-01',
        });

      expect(res.status).toBe(400);
    });

    it('rejects without auth header', async () => {
      const res = await request(app)
        .post('/api/auth/create-profile')
        .send({
          firstName: 'NoAuth',
          dateOfBirth: '2000-01-01',
          interests: ['hiking', 'yoga'],
        });

      expect(res.status).toBe(401);
    });
  });
});
