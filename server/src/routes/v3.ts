import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '../config/database';

const router = Router();

// ─── Onboarding & User Preferences ──────────────────────────────────

const OnboardingSchema = z.object({
  firstName: z.string().min(1),
  age: z.number().min(13).max(120),
  goals: z.array(
    z.object({
      type: z.enum(['focus', 'health', 'relationships', 'growth', 'creativity', 'rest']),
      label: z.string(),
      icon: z.string().optional(),
      customName: z.string().optional(),
    }),
  ),
  triggerApps: z.array(z.string()),
  estimatedDailyScreenTime: z.number().min(0).max(24),
  frictionSettings: z.object({
    level: z.enum(['gentle', 'moderate', 'firm']),
    pauseEnabled: z.boolean(),
    mirrorEnabled: z.boolean(),
    countdownEnabled: z.boolean(),
    costEnabled: z.boolean(),
    countdownSeconds: z.number().min(5).max(60),
  }),
});

// Complete onboarding
router.post('/users/me/onboarding', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = OnboardingSchema.parse(req.body);

    // Update user profile
    await db('users').where({ id: req.user.userId }).update({
      first_name: data.firstName,
      age: data.age,
      onboarding_completed: true,
      updated_at: db.fn.now(),
    });

    // Create or update preferences (upsert)
    const existing = await db('user_preferences_v3').where({ user_id: req.user.userId }).first();

    if (existing) {
      await db('user_preferences_v3')
        .where({ user_id: req.user.userId })
        .update({
          goals: JSON.stringify(data.goals),
          trigger_apps: JSON.stringify(data.triggerApps),
          estimated_daily_screen_time: data.estimatedDailyScreenTime,
          friction_settings: JSON.stringify(data.frictionSettings),
          updated_at: db.fn.now(),
        });
    } else {
      await db('user_preferences_v3').insert({
        user_id: req.user.userId,
        goals: JSON.stringify(data.goals),
        trigger_apps: JSON.stringify(data.triggerApps),
        estimated_daily_screen_time: data.estimatedDailyScreenTime,
        friction_settings: JSON.stringify(data.frictionSettings),
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(400).json({ error: 'Failed to save onboarding data' });
  }
});

// Get user preferences
router.get('/users/me/preferences', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db('users').where({ id: req.user.userId }).first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prefs = await db('user_preferences_v3').where({ user_id: req.user.userId }).first();

    res.json({
      profile: {
        id: user.id,
        firstName: user.first_name,
        age: user.age,
        email: user.email,
        createdAt: user.created_at,
      },
      goals: prefs?.goals ? JSON.parse(prefs.goals) : [],
      triggerApps: prefs?.trigger_apps ? JSON.parse(prefs.trigger_apps) : [],
      estimatedDailyScreenTime: prefs?.estimated_daily_screen_time ?? 3,
      frictionSettings: prefs?.friction_settings
        ? JSON.parse(prefs.friction_settings)
        : {
            level: 'moderate',
            pauseEnabled: true,
            mirrorEnabled: true,
            countdownEnabled: true,
            costEnabled: true,
            countdownSeconds: 10,
          },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
router.patch('/users/me/preferences', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updates: Record<string, any> = { updated_at: db.fn.now() };

    if (req.body.goals) updates.goals = JSON.stringify(req.body.goals);
    if (req.body.triggerApps) updates.trigger_apps = JSON.stringify(req.body.triggerApps);
    if (req.body.estimatedDailyScreenTime !== undefined) {
      updates.estimated_daily_screen_time = req.body.estimatedDailyScreenTime;
    }
    if (req.body.frictionSettings) {
      updates.friction_settings = JSON.stringify(req.body.frictionSettings);
    }

    const existing = await db('user_preferences_v3').where({ user_id: req.user.userId }).first();

    if (!existing) {
      await db('user_preferences_v3').insert({
        user_id: req.user.userId,
        ...updates,
      });
    } else {
      await db('user_preferences_v3').where({ user_id: req.user.userId }).update(updates);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(400).json({ error: 'Failed to update preferences' });
  }
});

// ─── Sessions ─────────────────────────────────────────────────────

const StartSessionSchema = z.object({
  intent: z.string().optional(),
  duration: z.number().min(1).max(480), // max 8 hours
  mood: z.enum(['great', 'good', 'meh', 'bad', 'awful']).optional(),
});

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = StartSessionSchema.parse(req.body);

    const [session] = await db('sessions_v3')
      .insert({
        user_id: req.user.userId,
        intent: data.intent,
        planned_duration: data.duration,
        status: 'active',
        started_at: new Date(),
      })
      .returning('*');

    // If mood provided, create check-in
    if (data.mood) {
      await db('check_ins_v3').insert({
        user_id: req.user.userId,
        session_id: session.id,
        type: 'pre_session',
        mood: data.mood,
        data: JSON.stringify({ intent: data.intent }),
      });
    }

    res.json(session);
  } catch (error) {
    console.error('Start session error:', error);
    res.status(400).json({ error: 'Failed to start session' });
  }
});

// Get active session
router.get('/sessions/active', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const active = await db('sessions_v3')
      .where({ user_id: req.user.userId, status: 'active' })
      .orderBy('started_at', 'desc')
      .first();

    res.json(active ?? null);
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});

// Complete a session
router.post('/sessions/:id/complete', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { mood, notes } = req.body;

    const session = await db('sessions_v3').where({ id, user_id: req.user.userId }).first();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const endedAt = new Date();
    const durationMs = endedAt.getTime() - new Date(session.started_at).getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    const [updated] = await db('sessions_v3')
      .where({ id })
      .update({
        status: 'completed',
        ended_at: endedAt,
        actual_duration: durationMinutes,
        notes,
        updated_at: new Date(),
      })
      .returning('*');

    // Create post-session check-in if mood provided
    if (mood) {
      await db('check_ins_v3').insert({
        user_id: req.user.userId,
        session_id: id,
        type: 'post_session',
        mood,
        data: JSON.stringify({ notes }),
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(400).json({ error: 'Failed to complete session' });
  }
});

// Cancel/abandon a session
router.post('/sessions/:id/cancel', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const [updated] = await db('sessions_v3')
      .where({ id, user_id: req.user.userId })
      .update({
        status: 'cancelled',
        ended_at: new Date(),
        notes: reason,
        updated_at: new Date(),
      })
      .returning('*');

    res.json(updated);
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(400).json({ error: 'Failed to cancel session' });
  }
});

// Get session history
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await db('sessions_v3')
      .where({ user_id: req.user.userId })
      .orderBy('started_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json(history);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// ─── Break Attempts ───────────────────────────────────────────────

const BreakAttemptSchema = z.object({
  appName: z.string(),
  triggerType: z.enum(['impulse', 'notification', 'boredom', 'habit', 'other']),
  frictionSteps: z.array(
    z.object({
      step: z.enum(['pause', 'mirror', 'countdown', 'cost']),
      completed: z.boolean(),
      duration: z.number().optional(),
    }),
  ),
  outcome: z.enum(['continued', 'closed', 'timeout']),
  sessionId: z.string().optional(),
});

router.post('/break-attempts', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = BreakAttemptSchema.parse(req.body);

    const [attempt] = await db('break_attempts_v3')
      .insert({
        user_id: req.user.userId,
        app_name: data.appName,
        trigger_type: data.triggerType,
        friction_steps: JSON.stringify(data.frictionSteps),
        outcome: data.outcome,
        session_id: data.sessionId,
      })
      .returning('*');

    res.json(attempt);
  } catch (error) {
    console.error('Create break attempt error:', error);
    res.status(400).json({ error: 'Failed to record break attempt' });
  }
});

// Get break attempt history
router.get('/break-attempts', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const attempts = await db('break_attempts_v3')
      .where('user_id', req.user.userId)
      .where('created_at', '>=', since)
      .orderBy('created_at', 'desc');

    res.json(attempts);
  } catch (error) {
    console.error('Get break attempts error:', error);
    res.status(500).json({ error: 'Failed to get break attempts' });
  }
});

// ─── Stats & Insights ───────────────────────────────────────────

router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Sessions
    const completedSessions = await db('sessions_v3')
      .where('user_id', req.user.userId)
      .where('status', 'completed')
      .where('started_at', '>=', since);

    const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0);
    const totalSessions = completedSessions.length;

    // Break attempts
    const attempts = await db('break_attempts_v3')
      .where('user_id', req.user.userId)
      .where('created_at', '>=', since);

    const closedCount = attempts.filter((a) => a.outcome === 'closed').length;
    const totalAttempts = attempts.length;

    // Streak
    const streak = await calculateStreak(req.user.userId);

    // Best day
    const sessionsByDay = new Map<string, number>();
    completedSessions.forEach((s) => {
      const day = new Date(s.started_at).toDateString();
      sessionsByDay.set(day, (sessionsByDay.get(day) || 0) + (s.actual_duration || 0));
    });

    let bestDay = { date: '', minutes: 0 };
    sessionsByDay.forEach((mins, date) => {
      if (mins > bestDay.minutes) {
        bestDay = { date, minutes: mins };
      }
    });

    // Average mood
    const checkIns = await db('check_ins_v3')
      .where('user_id', req.user.userId)
      .where('created_at', '>=', since);

    const moodValues: Record<string, number> = { great: 5, good: 4, meh: 3, bad: 2, awful: 1 };
    const avgMood =
      checkIns.length > 0
        ? checkIns.reduce((sum, c) => sum + (moodValues[c.mood] || 3), 0) / checkIns.length
        : 3;

    res.json({
      totalSessions,
      totalMinutes,
      avgMinutesPerSession: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
      breakAttemptsTotal: totalAttempts,
      breakAttemptsClosed: closedCount,
      breakSuccessRate: totalAttempts > 0 ? Math.round((closedCount / totalAttempts) * 100) : 0,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      bestDay: bestDay.minutes > 0 ? bestDay : null,
      avgMood: Math.round(avgMood * 10) / 10,
      totalCheckIns: checkIns.length,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ─── Check-ins ─────────────────────────────────────────────────

const CheckInSchema = z.object({
  type: z.enum(['pre_session', 'post_session', 'scrolling_episode']),
  mood: z.enum(['great', 'good', 'meh', 'bad', 'awful']),
  sessionId: z.string().optional(),
  data: z.record(z.any()).optional(),
});

router.post('/checkins', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = CheckInSchema.parse(req.body);

    const [checkIn] = await db('check_ins_v3')
      .insert({
        user_id: req.user.userId,
        session_id: data.sessionId,
        type: data.type,
        mood: data.mood,
        data: data.data ? JSON.stringify(data.data) : null,
      })
      .returning('*');

    res.json(checkIn);
  } catch (error) {
    console.error('Create check-in error:', error);
    res.status(400).json({ error: 'Failed to create check-in' });
  }
});

router.get('/checkins', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await db('check_ins_v3')
      .where('user_id', req.user.userId)
      .where('created_at', '>=', since)
      .orderBy('created_at', 'desc');

    res.json(history);
  } catch (error) {
    console.error('Get check-ins error:', error);
    res.status(500).json({ error: 'Failed to get check-ins' });
  }
});

// ─── Alternatives (suggestions) ─────────────────────────────────

router.get('/alternatives', async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's goals to personalize suggestions
    const prefs = await db('user_preferences_v3').where({ user_id: req.user.userId }).first();

    const goals = prefs?.goals ? JSON.parse(prefs.goals) : [];
    const goalTypes = goals.map((g: any) => g.type);

    // Activity suggestions based on goals and time available
    const duration = parseInt(req.query.duration as string) || 15; // minutes
    const suggestions = getAlternatives(goalTypes, duration);

    res.json(suggestions);
  } catch (error) {
    console.error('Get alternatives error:', error);
    res.status(500).json({ error: 'Failed to get alternatives' });
  }
});

// ─── Helpers ───────────────────────────────────────────────────

async function calculateStreak(userId: string): Promise<{ current: number; longest: number }> {
  // Get all completed sessions ordered by date
  const sessions = await db('sessions_v3')
    .where('user_id', userId)
    .where('status', 'completed')
    .orderBy('started_at', 'desc');

  // Get unique dates
  const dates = [...new Set(sessions.map((s) => new Date(s.started_at).toDateString()))];

  if (dates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const hasToday = dates.includes(today);
  const hasYesterday = dates.includes(yesterday);

  if (hasToday || hasYesterday) {
    currentStreak = 1;
    const startDate = hasToday ? new Date() : new Date(Date.now() - 86400000);

    for (let i = 1; i < 365; i++) {
      const checkDate = new Date(startDate.getTime() - i * 86400000);
      if (dates.includes(checkDate.toDateString())) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = currentStreak;
  let tempStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

function getAlternatives(goalTypes: string[], duration: number) {
  const allActivities = {
    focus: [
      { name: 'Read a book', duration: 15, benefit: 'Builds knowledge and focus' },
      { name: 'Write in journal', duration: 10, benefit: 'Clarifies thoughts' },
      { name: 'Practice deep work', duration: 45, benefit: 'Accomplish important tasks' },
      { name: 'Learn something new', duration: 20, benefit: 'Expands your mind' },
    ],
    health: [
      { name: 'Go for a walk', duration: 15, benefit: 'Boosts mood and energy' },
      { name: 'Do a quick workout', duration: 20, benefit: 'Builds strength' },
      { name: 'Stretch or yoga', duration: 10, benefit: 'Relieves tension' },
      { name: 'Drink water', duration: 1, benefit: 'Stays hydrated' },
    ],
    relationships: [
      { name: 'Call a friend', duration: 15, benefit: 'Strengthens connections' },
      { name: 'Write a letter', duration: 20, benefit: 'Shows you care' },
      { name: 'Plan quality time', duration: 10, benefit: 'Invests in relationships' },
    ],
    growth: [
      { name: 'Learn a skill', duration: 20, benefit: 'Expands capabilities' },
      { name: 'Reflect on goals', duration: 10, benefit: 'Stays aligned' },
      { name: 'Practice meditation', duration: 10, benefit: 'Builds awareness' },
    ],
    creativity: [
      { name: 'Draw or doodle', duration: 15, benefit: 'Unlocks creativity' },
      { name: 'Write a poem', duration: 10, benefit: 'Expresses feelings' },
      { name: 'Play an instrument', duration: 20, benefit: 'Creates joy' },
    ],
    rest: [
      { name: 'Take a nap', duration: 20, benefit: 'Restores energy' },
      { name: 'Practice breathing', duration: 5, benefit: 'Calms the mind' },
      { name: 'Go outside', duration: 10, benefit: 'Refreshes perspective' },
    ],
  };

  // Prioritize activities matching user's goals
  const relevant = goalTypes.flatMap(
    (type) => allActivities[type as keyof typeof allActivities] || [],
  );

  // If no goals matched, use all activities
  const pool = relevant.length > 0 ? relevant : Object.values(allActivities).flat();

  // Filter by duration
  const suitable = pool.filter((a) => a.duration <= duration + 10); // allow some flexibility

  // Shuffle and return top suggestions
  const shuffled = suitable.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 8);
}

export default router;
