import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';
import { discoverCirclesBySkill, searchCircles } from '../models/circle';
import { SKILL_TAXONOMY, searchSkills, getSkillsByCategory } from '@disconnect/shared';
import type { SkillCategory } from '@disconnect/shared';

const router = Router();

/**
 * GET /api/discover/skills
 * List all available skills in the taxonomy
 */
router.get('/skills', authenticate, async (req, res) => {
  try {
    const { category } = req.query;

    const skills = category ? getSkillsByCategory(category as SkillCategory) : SKILL_TAXONOMY;

    res.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

/**
 * GET /api/discover/skills/search
 * Search skills by name/alias
 */
router.get('/skills/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const skills = searchSkills(q);
    res.json({ skills });
  } catch (error) {
    console.error('Error searching skills:', error);
    res.status(500).json({ error: 'Failed to search skills' });
  }
});

/**
 * GET /api/discover/people
 * Find people by skill/interest
 */
router.get('/people', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { skillId, level, limit = 20 } = req.query;

    let query = db('user_skills as us')
      .join('users as u', 'u.id', 'us.user_id')
      .join('skills as s', 's.id', 'us.skill_id')
      .where('us.visibility', 'public')
      .whereNot('us.user_id', userId)
      .select(
        'u.id as user_id',
        'u.first_name',
        'u.photo_url',
        'u.bio',
        's.id as skill_id',
        's.name as skill_name',
        's.category as skill_category',
        'us.level',
        'us.notes',
      );

    if (skillId) {
      query = query.where('us.skill_id', skillId);
    }

    if (level && ['learning', 'practicing', 'teaching'].includes(level as string)) {
      query = query.where('us.level', level);
    }

    // Exclude blocked users
    query = query.whereNotIn('u.id', function (this: any) {
      this.select('blocked_id').from('blocks').where('blocker_id', userId);
    });

    const results = await query.limit(Math.min(50, Number(limit)));

    // Group by user
    const userMap = new Map<string, any>();
    for (const row of results) {
      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, {
          id: row.user_id,
          firstName: row.first_name,
          photoUrl: row.photo_url,
          bio: row.bio,
          skills: [],
        });
      }
      userMap.get(row.user_id)!.skills.push({
        id: row.skill_id,
        name: row.skill_name,
        category: row.skill_category,
        level: row.level,
        notes: row.notes,
      });
    }

    const users = Array.from(userMap.values());
    res.json({ users });
  } catch (error) {
    console.error('Error discovering people:', error);
    res.status(500).json({ error: 'Failed to discover people' });
  }
});

/**
 * GET /api/discover/circles
 * Find circles by skill or search query
 */
router.get('/circles', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { skillId, q, limit = 20 } = req.query;

    let circles;

    if (skillId && typeof skillId === 'string') {
      circles = await discoverCirclesBySkill({ userId, skillId, limit: Number(limit) });
    } else if (q && typeof q === 'string') {
      circles = await searchCircles({ userId, query: q, limit: Number(limit) });
    } else {
      // Return all public circles user is not a member of
      circles = await db('circles as c')
        .where('c.is_public', true)
        .whereNotIn('c.id', function (this: any) {
          this.select('circle_id').from('circle_members').where('user_id', userId);
        })
        .select(
          'c.*',
          db.raw(
            `(SELECT COUNT(*) FROM circle_members WHERE circle_members.circle_id = c.id)::int as member_count`,
          ),
        )
        .orderBy('member_count', 'desc')
        .limit(Number(limit));
    }

    res.json({ circles });
  } catch (error) {
    console.error('Error discovering circles:', error);
    res.status(500).json({ error: 'Failed to discover circles' });
  }
});

/**
 * GET /api/discover/resources
 * Find learning resources by skill
 */
router.get('/resources', authenticate, async (req, res) => {
  try {
    const { skillId, type, limit = 20 } = req.query;

    let query = db('resources as r')
      .join('users as u', 'u.id', 'r.uploader_id')
      .select('r.*', 'u.first_name as uploader_name', 'u.photo_url asuploader_photo')
      .orderBy('r.upvotes', 'desc')
      .limit(Math.min(50, Number(limit)));

    if (skillId) {
      query = query.whereIn('r.id', function (this: any) {
        this.select('resource_id').from('resource_skills').where('skill_id', skillId);
      });
    }

    if (type && ['article', 'book', 'course', 'video', 'tool', 'other'].includes(type as string)) {
      query = query.where('r.resource_type', type);
    }

    const resources = await query;

    res.json({ resources });
  } catch (error) {
    console.error('Error discovering resources:', error);
    res.status(500).json({ error: 'Failed to discover resources' });
  }
});

/**
 * GET /api/discover/events
 * Find learning events by skill
 */
router.get('/events', authenticate, async (req, res) => {
  try {
    const { skillId, lat, lng, radius = 25, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusMeters = Number(radius) * 1609.34; // miles to meters

    let query = db('events as e')
      .join('users as u', 'u.id', 'e.creator_id')
      .where('e.starts_at', '>', new Date())
      .select(
        'e.*',
        'u.first_name as creator_name',
        db.raw(
          `
          ST_Distance(
            ST_MakePoint(e.longitude, e.latitude)::geography,
            ST_MakePoint(?, ?)::geography
          ) as distance
        `,
          [longitude, latitude],
        ),
      )
      .whereRaw(
        `
        ST_DWithin(
          ST_MakePoint(e.longitude, e.latitude)::geography,
          ST_MakePoint(?, ?)::geography,
          ?
        )
      `,
        [longitude, latitude, radiusMeters],
      )
      .orderBy('distance')
      .limit(Math.min(50, Number(limit)));

    if (skillId) {
      query = query.whereIn('e.id', function (this: any) {
        this.select('event_id').from('event_skills').where('skill_id', skillId);
      });
    }

    const events = await query;

    res.json({ events });
  } catch (error) {
    console.error('Error discovering events:', error);
    res.status(500).json({ error: 'Failed to discover events' });
  }
});

/**
 * GET /api/discover/nearby
 * Find nearby people, circles, and events combined
 */
router.get('/nearby', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusMeters = Number(radius) * 1609.34;

    // Find nearby events
    const events = await db('events as e')
      .where('e.starts_at', '>', new Date())
      .whereRaw(
        `
        ST_DWithin(
          ST_MakePoint(e.longitude, e.latitude)::geography,
          ST_MakePoint(?, ?)::geography,
          ?
        )
      `,
        [longitude, latitude, radiusMeters],
      )
      .select('e.id', 'e.title', 'e.starts_at', 'e.category')
      .orderBy('e.starts_at')
      .limit(10);

    // Find nearby beacons
    const beacons = await db('beacons as b')
      .join('users as u', 'u.id', 'b.creator_id')
      .where('b.expires_at', '>', new Date())
      .whereRaw(
        `
        ST_DWithin(
          ST_MakePoint(b.longitude, b.latitude)::geography,
          ST_MakePoint(?, ?)::geography,
          ?
        )
      `,
        [longitude, latitude, radiusMeters],
      )
      .select('b.id', 'b.message', 'b.activity', 'u.first_name as creator_name')
      .limit(10);

    res.json({
      nearby: {
        events,
        beacons,
      },
    });
  } catch (error) {
    console.error('Error fetching nearby:', error);
    res.status(500).json({ error: 'Failed to fetch nearby content' });
  }
});

export default router;
