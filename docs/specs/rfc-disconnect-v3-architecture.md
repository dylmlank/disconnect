# RFC: Disconnect v3 — Architecture & Build Plan

| Field   | Value      |
| ------- | ---------- |
| Status  | Draft      |
| Created | 2026-06-15 |
| Author  | Dylan      |

---

## Architecture Overview

### What We Keep (Infrastructure)

- **Auth system** — Clerk integration, authStore, token providers
- **Theme system** — useThemeStore, dark/light modes
- **Navigation shell** — React Navigation, but simplified tab structure
- **API layer** — services/api, token provider pattern
- **Backend** — Express server, PostgreSQL, Redis (schema will change)
- **Dev mode** — DevApp, DevNavigator pattern for development without Clerk

### What We Remove (v1/v2 Features)

- Events (EventListScreen, CreateEventScreen, EventDetailScreen, etc.)
- Beacons (BeaconMapScreen, CreateBeaconScreen)
- Circles/Social (CirclesScreen, CircleDetailScreen, DiscoverScreen)
- Challenges, Habits, Focus sessions (old versions)
- Meetup suggestions, Photo feed, Study rooms, Walk & Talk
- All v2-specific components (EventCard, CircleFeedItem, etc.)
- Old stores (eventStore, beaconStore, circleStore, etc.)

### What We Build (v3 Core)

---

## New App Structure

### Tab Navigation (Simplified)

```
Tab 1: Home       — Dashboard, active session, stats, quick actions
Tab 2: Insights   — Patterns, inventory, future self visualization
Tab 3: Settings   — Profile, blocked apps, goals, preferences
```

That's it. 3 tabs. Minimal.

---

## Screen-by-Screen Breakdown

### Onboarding Flow

**Screen 1: Welcome**

- "Your phone is stealing your life. Let's prove it."
- Brief explanation of the app's purpose
- "I understand, let's begin" button

**Screen 2: Basic Info**

- Age (required, 13+)
- First name (for personalized messages)

**Screen 3: Goals & Interests**

- "What have you been wanting to do more of?"
- Select 2-3: [Read] [Exercise] [Create] [Learn] [Connect] [Be outside] [Other...]
- These power the "Instead" suggestions

**Screen 4: Trigger Apps**

- "Which apps are stealing your time?"
- Show list of installed apps (where possible) or manual entry
- Pre-populate common ones: Instagram, TikTok, YouTube, Twitter/X, Reddit, Facebook, Snapchat
- User selects which to track/block

**Screen 5: Screen Time Estimate**

- "How much time do you spend on these apps per day?"
- Sliding scale: 1-8+ hours
- Used for initial inventory calculations

**Screen 6: The Commitment**

- Show the inventory: "At this rate, you'll spend X years scrolling by age 30"
- "Do you want to change this?"
- [Yes, I'm ready] → Proceed to home

---

### Home Screen (Tab 1)

**Sections:**

1. **Session Status** (prominent)
   - If no active session: "Ready to disconnect?" button
   - If session active: Timer, "In session", "End session" button (with friction)

2. **Today's Stats**
   - Time off apps today (hours/minutes)
   - Break attempts today
   - Streak counter (days)

3. **Quick Actions**
   - [Start Session] — choose duration (1h, 2h, 4h, custom)
   - [I'm Bored] — opens alternatives/suggestions
   - [Check In] — mood/energy quick rating

4. **Recent Activity** (minimal)
   - Last 3 sessions: duration, mood before/after
   - Last 3 break attempts: time, reason

---

### Insights Screen (Tab 2)

**Sections:**

1. **The Inventory**
   - Time lost this week (visual: bar/hours)
   - Time lost this year (scary number)
   - Time lost by age 30 (if applicable)
   - Opportunity cost vs stated goals

2. **Patterns**
   - "You reach for [app] most between X-Xpm when [emotion]"
   - Mood after scrolling: X/5
   - Mood after sessions: X/5
   - Trigger heatmap (time of day vs frequency)

3. **Future Self**
   - "At this rate, by [year] you'll have spent [X years] scrolling"
   - "Someone who [practiced X] instead would have [Y hours] by then"
   - Comparison toggle

4. **Identity Check**
   - "You said [value] matters to you"
   - "This week: X hours on goals, Y hours on apps"
   - "Which is true — your words or your actions?"

---

### Settings Screen (Tab 3)

**Sections:**

1. **Profile**
   - Name, age
   - Edit goals/interests

2. **Blocked Apps**
   - List of trigger apps
   - Add/remove apps
   - Toggle blocking on/off for each

3. **Session Preferences**
   - Default session duration
   - Recurring sessions (optional future feature)

4. **Friction Settings**
   - Break friction level: [Gentle / Moderate / Firm]
   - Enable/disable each step (pause, mirror, countdown, cost)
   - Emergency kill switch: always on, but can customize what gets logged

5. **Notifications**
   - Session reminders (optional)
   - Weekly summary (optional)

6. **Account**
   - Sign out
   - Delete account

---

## Data Models

### User

```typescript
interface User {
  id: string;
  clerk_id: string;
  first_name: string;
  age: number; // calculated from birth_date
  email?: string;
  phone?: string;
  created_at: Date;

  // v3 fields
  goals: Goal[]; // ['read', 'exercise', 'create', ...]
  trigger_apps: TriggerApp[];
  estimated_daily_screen_time: number; // hours, self-reported initially
  onboarding_completed_at: Date;
}
```

### TriggerApp

```typescript
interface TriggerApp {
  id: string;
  user_id: string;
  app_name: string; // "Instagram", "TikTok", etc.
  package_name?: string; // Android: com.instagram.android
  bundle_id?: string; // iOS: com.burbn.instagram
  is_blocking_enabled: boolean;
  created_at: Date;
}
```

### Session

```typescript
interface Session {
  id: string;
  user_id: string;
  started_at: Date;
  ended_at: Date | null; // null if active
  planned_duration_minutes: number;
  actual_duration_minutes: number | null; // calculated on end
  mood_before: number | null; // 1-5, optional check-in
  mood_after: number | null; // 1-5, optional check-in
  note: string | null; // "Read 2 chapters"
  status: 'active' | 'completed' | 'ended_early';
}
```

### BreakAttempt

```typescript
interface BreakAttempt {
  id: string;
  user_id: string;
  session_id: string | null; // null if impulse gate triggered outside session
  created_at: Date;
  app_name: string; // which app they tried to open
  reason: string; // what they typed
  mood: string | null; // "bored", "anxious", etc.
  completed: boolean; // did they go through with the break?
  cancelled_at: Date | null; // if they cancelled during countdown
  was_emergency: boolean; // used kill switch
}
```

### ImpulseLog

```typescript
interface ImpulseLog {
  id: string;
  user_id: string;
  created_at: Date;
  app_name: string;
  trigger: 'bored' | 'anxious' | 'lonely' | 'tired' | 'procrastinating' | 'habit' | 'other';
  mood_before: number | null; // 1-5
  mood_after: number | null; // 1-5, filled later if possible
  duration_seconds: number | null; // how long they scrolled
}
```

### CheckIn

```typescript
interface CheckIn {
  id: string;
  user_id: string;
  created_at: Date;
  type: 'session_start' | 'session_end' | 'post_scroll' | 'daily';
  mood: number; // 1-5
  energy: number; // 1-5
  focus: number; // 1-5
  note: string | null;
}
```

### Streak

```typescript
interface Streak {
  user_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  last_session_date: Date;
  updated_at: Date;
}
```

### UserStats (aggregated, can be calculated on demand)

```typescript
interface UserStats {
  user_id: string;

  // Time tracking
  total_offline_hours: number;
  total_break_attempts: number;
  avg_session_duration_minutes: number;

  // Patterns
  most_common_trigger: string;
  most_distracted_hour: number; // 0-23
  avg_mood_after_scroll: number;
  avg_mood_after_session: number;

  // Streaks
  current_streak: number;
  longest_streak: number;
}
```

---

## API Endpoints (New)

### Sessions

- `POST /api/sessions` — Start a new session
- `GET /api/sessions/current` — Get active session (if any)
- `PATCH /api/sessions/:id` — End/update session
- `GET /api/sessions` — List past sessions

### Break Attempts

- `POST /api/breaks` — Log a break attempt
- `GET /api/breaks` — Get break history

### Impulse Logs

- `POST /api/impulses` — Log impulse gate trigger
- `GET /api/impulses` — Get impulse patterns

### Check-ins

- `POST /api/checkins` — Submit mood/energy check-in
- `GET /api/checkins` — Get check-in history

### Stats & Inventory

- `GET /api/stats/summary` — Aggregated stats for dashboard
- `GET /api/stats/inventory` — Time loss calculations
- `GET /api/stats/patterns` — Impulse patterns, mood correlations

### Trigger Apps

- `GET /api/apps` — List user's trigger apps
- `POST /api/apps` — Add trigger app
- `DELETE /api/apps/:id` — Remove trigger app
- `PATCH /api/apps/:id` — Toggle blocking

### User Preferences

- `PATCH /api/users/me` — Update goals, settings
- `GET /api/users/me/goals` — Get user goals
- `PATCH /api/users/me/goals` — Update goals

---

## Technical Challenges

### 1. App Blocking / Impulse Gate

**iOS:**

- Screen Time API (DeviceActivityMonitor) can detect app launches but has limited overlay capability
- Workaround: Shortcuts automation can prompt on app open (requires user setup)
- Fallback: Manual check-in ("I'm about to scroll")

**Android:**

- Accessibility Service can detect app launches and show overlays
- UsageStatsManager can track app usage
- More flexible than iOS

**MVP Approach:**

- User manually initiates "session" which shows overlay when they return to the app
- Impulse gate triggered by user opening Disconnect app ("I'm about to break")
- Future: Platform-specific automation

### 2. Streak Tracking

- Streak increments when user completes a session of X+ minutes per day
- Streak breaks if no session for 24 hours (configurable)
- Stored in database, calculated nightly or on-demand

### 3. Pattern Detection

- Simple aggregation for MVP: most common trigger, most distracted hour
- Could be enhanced with ML later for predictive patterns

---

## Build Order

### Phase 1: Core Infrastructure

1. Define TypeScript models in `shared/` package
2. Create database migrations for new tables
3. Build new API endpoints
4. Update user store for v3 fields

### Phase 2: Onboarding

5. Build onboarding screens (6 screens)
6. Wire up to backend

### Phase 3: Session Management

7. Build session start/end flow
8. Session timer UI
9. Session history

### Phase 4: Break Friction

10. Build break attempt flow (pause → mirror → countdown → cost)
11. Emergency kill switch
12. Streak integration

### Phase 5: Insights

13. Inventory calculations
14. Pattern visualization
15. Future self projections

### Phase 6: Alternatives

16. "I'm bored" suggestions
17. Goal-aligned recommendations
18. Quick wins library

---

## Database Migration Plan

### New Tables

- `trigger_apps`
- `sessions`
- `break_attempts`
- `impulse_logs`
- `checkins`
- `streaks`

### Tables to Keep (with modifications)

- `users` — add goals, age, onboarding fields

### Tables to Drop (after migration)

- `events`, `event_attendees`, `event_chats`
- `beacons`, `beacon_interests`
- `circles`, `circle_members`, `circle_chats`
- `challenges`, `challenge_participants`
- `habits`, `habit_logs`
- etc.

**Note:** Don't drop tables yet. Keep them until v3 is stable, then clean up.
