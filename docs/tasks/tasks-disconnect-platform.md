# Tasks: Disconnect Platform Expansion — Social Productivity Hub

| Field        | Value                                              |
|-------------|-----------------------------------------------------|
| Status      | Not Started                                         |
| Created     | 2026-05-12                                          |
| Author      | Dylan                                               |
| Spec        | `docs/specs/rfc-disconnect-platform.md`             |
| Design      | `docs/designs/design-disconnect-platform.md`        |
| Phase       | Tasks                                               |

## Task Execution Order

Tasks are ordered by dependency. Complete in order within each phase.

---

### Phase 1: Foundation (Schema + Shared Types + Navigation)

#### Task 1: Add shared types for new entities

| Field | Value |
|-------|-------|
| ID | T-P01 |
| Type | Modify |
| Estimated Effort | Medium |
| Dependencies | None |

**Description**: Extend `shared/src/types.ts` with interfaces for Circle, Challenge, FocusSession, Habit, CheckIn, Reaction, and all related types. Add new files `shared/src/habits.ts` (curated habit definitions with research citations) and `shared/src/challenges.ts` (challenge template definitions).

**Files**:
- `shared/src/types.ts` — add Circle, CircleMember, Challenge, ChallengeParticipant, ChallengeLog, FocusSession, HabitDefinition, HabitLog, CheckIn, Reaction, CircleFeedItem interfaces
- `shared/src/habits.ts` — create with 10 curated habits (exercise, nature, mindfulness, reading, journaling, deep_work, screen_free_evening, sleep, cold_exposure, social_connection) each with research note + citation
- `shared/src/challenges.ts` — create with 5 pre-built challenge templates
- `shared/src/index.ts` — export new modules

**Acceptance Criteria**:
- [ ] All new entity types compile without errors
- [ ] 10 curated habits defined with id, name, description, researchNote, citation, emoji
- [ ] 5 challenge templates defined with title, description, durationDays, dailyRequirement, category, researchNote
- [ ] Types importable from both app/ and server/

---

#### Task 2: Create database migrations

| Field | Value |
|-------|-------|
| ID | T-P02 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | None |
| Parallel With | T-P01 |

**Description**: Create migrations 009-014 as defined in the design document. Each migration creates tables with proper constraints, indexes, and foreign keys.

**Files**:
- `server/src/db/migrations/009_create_circles.ts`
- `server/src/db/migrations/010_create_challenges.ts`
- `server/src/db/migrations/011_create_focus_sessions.ts`
- `server/src/db/migrations/012_create_habits.ts`
- `server/src/db/migrations/013_create_checkins.ts`
- `server/src/db/migrations/014_create_reactions.ts`

**Acceptance Criteria**:
- [ ] All migrations have up() and down() methods
- [ ] Foreign keys reference correct tables
- [ ] Indexes created for common query patterns
- [ ] `circles` table has unique invite_code
- [ ] `habit_logs` has unique constraint on (user_id, habit_id, logged_date)
- [ ] `check_ins` has unique constraint on (user_id, check_in_date)

---

#### Task 3: Update app navigation to 4 tabs with Hub

| Field | Value |
|-------|-------|
| ID | T-P03 |
| Type | Modify |
| Estimated Effort | Small |
| Dependencies | None |
| Parallel With | T-P01, T-P02 |

**Description**: Change the bottom tab navigator from 3 tabs (Events, Map, Profile) to 4 tabs (Events, Map, Hub, Profile). Create a placeholder HubScreen and HubStack navigator. The Hub tab uses ⚡ or a relevant Ionicons icon.

**Files**:
- `app/src/navigation/RootNavigator.tsx` — add HubTab + HubStack
- `app/src/screens/hub/HubScreen.tsx` — placeholder "Hub coming soon" screen

**Acceptance Criteria**:
- [ ] 4 tabs visible in the bottom navigator
- [ ] Hub tab navigates to HubScreen
- [ ] Existing Events, Map, Profile tabs unchanged
- [ ] App compiles and runs without errors

---

### Phase 2: Circles (Foundation for Social Features)

#### Task 4: Implement Circle server (model + routes)

| Field | Value |
|-------|-------|
| ID | T-P04 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-P02 |

**Description**: Build the Circles API — create, join, leave, list, get detail, remove member, get feed. Circle creation generates a random 8-char invite code. Max 3 circles per user, max 8 members per circle. Under-18 cannot create circles. Circle feed aggregates recent activity from members (last 24h, max 50 items).

**Files**:
- `server/src/models/circle.ts` — Circle DB queries
- `server/src/routes/circles.ts` — All circle endpoints
- `server/src/index.ts` — register circle routes

**Acceptance Criteria**:
- [ ] POST /circles creates a circle with random invite code
- [ ] POST /circles/:id/join works with valid invite code
- [ ] Max 3 circles per user enforced
- [ ] Max 8 members per circle enforced
- [ ] Creator can remove members; others cannot
- [ ] GET /circles/:id/feed returns activity from last 24h

---

#### Task 5: Build Circle app screens

| Field | Value |
|-------|-------|
| ID | T-P05 |
| Type | New Files |
| Estimated Effort | Large |
| Dependencies | T-P03, T-P04 |

**Description**: Build CirclesScreen (list user's circles), CircleDetailScreen (feed + members), CreateCircleScreen (name input), JoinCircleScreen (invite code input). Wire into HubStack navigation.

**Files**:
- `app/src/screens/hub/CirclesScreen.tsx`
- `app/src/screens/hub/CircleDetailScreen.tsx`
- `app/src/screens/hub/CreateCircleScreen.tsx`
- `app/src/screens/hub/JoinCircleScreen.tsx`
- `app/src/store/circleStore.ts`
- `app/src/components/CircleFeedItem.tsx`

**Acceptance Criteria**:
- [ ] User can see their circles in a list
- [ ] User can create a circle and see the invite code
- [ ] User can join a circle via invite code
- [ ] Circle detail shows member list + activity feed
- [ ] All screens follow existing dark theme style

---

### Phase 3: Habits (Daily Engagement Loop)

#### Task 6: Implement Habits server (model + routes)

| Field | Value |
|-------|-------|
| ID | T-P06 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-P02, T-P01 |

**Description**: Build the Habits API — add/remove tracked habits (max 5), log daily completion (single tap = POST), get today's logs, get streaks. Uses the curated habit list from shared package. Supports 1 custom habit.

**Files**:
- `server/src/models/habit.ts` — Habit DB queries (streak calculation, daily log check)
- `server/src/routes/habits.ts` — All habit endpoints
- `server/src/index.ts` — register habit routes

**Acceptance Criteria**:
- [ ] User can add up to 5 habits from the curated list
- [ ] User can add 1 custom habit
- [ ] POST /habits/:habitId/log creates a log for today (idempotent on same day)
- [ ] GET /habits/streaks returns consecutive-day streak per habit
- [ ] Streak resets at midnight in the user's implied timezone (based on log timestamps)

---

#### Task 7: Build Habits app screen

| Field | Value |
|-------|-------|
| ID | T-P07 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-P03, T-P06 |

**Description**: Build HabitsScreen with tap-to-log habit rows. Each habit shows: emoji, name, research citation, streak count, and a checkmark/circle to log. Also a "manage habits" section to add/remove tracked habits. Wire into HubStack.

**Files**:
- `app/src/screens/hub/HabitsScreen.tsx`
- `app/src/components/HabitRow.tsx`
- `app/src/store/habitStore.ts`
- `app/src/constants/habits.ts` — re-export shared habits for app use

**Acceptance Criteria**:
- [ ] User sees their tracked habits with today's completion state
- [ ] Single tap logs a habit (checkmark appears immediately)
- [ ] Research citation visible per habit (one sentence)
- [ ] Streak counter shown per habit
- [ ] User can add/remove habits from the curated list

---

### Phase 4: Check-ins (Daily Reflection)

#### Task 8: Implement Check-ins server (model + routes)

| Field | Value |
|-------|-------|
| ID | T-P08 |
| Type | New Files |
| Estimated Effort | Small |
| Dependencies | T-P02 |
| Parallel With | T-P06 |

**Description**: Build Check-in API — submit daily check-in (mood 1-5, 3 good things, intention), get today's check-in, get history (last 30). One check-in per day, immutable after creation.

**Files**:
- `server/src/models/checkin.ts` — Check-in DB queries
- `server/src/routes/checkins.ts` — Check-in endpoints
- `server/src/index.ts` — register check-in routes

**Acceptance Criteria**:
- [ ] POST /checkins creates a check-in (one per day only)
- [ ] Second POST on same day returns 409
- [ ] GET /checkins/today returns today's check-in or null
- [ ] GET /checkins returns last 30 check-ins paginated
- [ ] Check-ins are immutable (no PATCH/PUT)

---

#### Task 9: Build Check-in app screen

| Field | Value |
|-------|-------|
| ID | T-P09 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-P03, T-P08 |

**Description**: Build CheckInScreen — mood selector (5 emojis), three text inputs for "good things" (100 chars each), intention field. Submit closes the screen with encouraging message. Wire into HubStack.

**Files**:
- `app/src/screens/hub/CheckInScreen.tsx`
- `app/src/components/MoodSelector.tsx`
- `app/src/store/checkinStore.ts`

**Acceptance Criteria**:
- [ ] Mood selector shows 5 emoji options (1=rough, 5=amazing)
- [ ] 3 text fields for "good things" (required)
- [ ] Intention field (optional)
- [ ] Submit takes < 60 seconds to complete
- [ ] After submit: encouraging message + "Now go live." prompt
- [ ] Cannot submit twice in one day

---

### Phase 5: Challenges

#### Task 10: Implement Challenges server (model + routes)

| Field | Value |
|-------|-------|
| ID | T-P10 |
| Type | New Files |
| Estimated Effort | Large |
| Dependencies | T-P02, T-P04 |

**Description**: Build Challenges API — create (circle-scoped or public with location), join, log daily completion, get progress. Include challenge templates endpoint. Public challenges scoped by location radius. Progress shows per-participant completion (no ranking). Includes cron job for daily reminders.

**Files**:
- `server/src/models/challenge.ts` — Challenge DB queries
- `server/src/routes/challenges.ts` — All challenge endpoints
- `server/src/jobs/sendChallengeReminders.ts` — Daily reminder cron
- `server/src/index.ts` — register routes + job

**Acceptance Criteria**:
- [ ] GET /challenges/templates returns pre-built challenge definitions
- [ ] POST /challenges creates a challenge (public or circle-scoped)
- [ ] POST /challenges/:id/join adds user as participant
- [ ] POST /challenges/:id/log records daily completion (one per day per user)
- [ ] GET /challenges/:id/progress shows completion % per participant
- [ ] Public challenges filtered by location radius
- [ ] Reminder job sends push notification at user-chosen time

---

#### Task 11: Build Challenge app screens

| Field | Value |
|-------|-------|
| ID | T-P11 |
| Type | New Files |
| Estimated Effort | Large |
| Dependencies | T-P03, T-P10 |

**Description**: Build ChallengesScreen (browse/join public + circle challenges), ChallengeDetailScreen (progress tracker + daily log button), CreateChallengeScreen (from template or custom). Wire into HubStack.

**Files**:
- `app/src/screens/hub/ChallengesScreen.tsx`
- `app/src/screens/hub/ChallengeDetailScreen.tsx`
- `app/src/screens/hub/CreateChallengeScreen.tsx`
- `app/src/components/ChallengeCard.tsx`
- `app/src/store/challengeStore.ts`
- `app/src/constants/challengeTemplates.ts`

**Acceptance Criteria**:
- [ ] User can browse available challenges (public + from their circles)
- [ ] User can join a challenge
- [ ] User can log daily completion with optional photo
- [ ] Progress screen shows each participant's day-by-day completion
- [ ] Research note displayed on challenge detail
- [ ] Create screen allows using a template or custom

---

### Phase 6: Focus Sessions

#### Task 12: Implement Focus Sessions server + WebSocket presence

| Field | Value |
|-------|-------|
| ID | T-P12 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-P02, T-P04 |

**Description**: Build Focus Sessions API — start session, complete session, cancel session, get active sessions in a circle, get history. Add WebSocket handler for real-time focus presence (who in my circle is currently focusing). Store active sessions in Redis for quick lookups.

**Files**:
- `server/src/models/focusSession.ts` — Focus session DB queries
- `server/src/routes/focus.ts` — Focus session endpoints
- `server/src/ws/focusPresence.ts` — WebSocket presence handler
- `server/src/index.ts` — register routes + WS handler

**Acceptance Criteria**:
- [ ] POST /focus starts a session (persisted in DB)
- [ ] POST /focus/:id/complete marks session as completed
- [ ] GET /focus/active?circleId returns who's currently focusing
- [ ] WebSocket broadcasts updates when circle members start/finish sessions
- [ ] Active sessions tracked in Redis for performance

---

#### Task 13: Build Focus Session app screen

| Field | Value |
|-------|-------|
| ID | T-P13 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-P03, T-P12 |

**Description**: Build FocusScreen — start a session (select duration 25/50/90/custom + intention + circle), minimal timer display during session (just the countdown + who else is focusing), auto-complete on timer end. Wire into HubStack.

**Files**:
- `app/src/screens/hub/FocusScreen.tsx`
- `app/src/components/FocusTimer.tsx`
- `app/src/hooks/useFocusTimer.ts` — client-side countdown timer logic
- `app/src/store/focusStore.ts`

**Acceptance Criteria**:
- [ ] User can select duration and start a session
- [ ] Timer screen is MINIMAL — only shows countdown + active co-workers
- [ ] Timer is client-side (accurate ±1s), server records start/end
- [ ] When timer ends: session marked complete, screen closes
- [ ] Focus time added to profile weekly stats

---

### Phase 7: Reactions + Hub Assembly

#### Task 14: Implement Reactions server

| Field | Value |
|-------|-------|
| ID | T-P14 |
| Type | New Files |
| Estimated Effort | Small |
| Dependencies | T-P02 |
| Parallel With | T-P06, T-P08, T-P10, T-P12 |

**Description**: Build generic Reactions API — react to any target (habit_log, check_in, challenge_log, focus_session) with an emoji. One reaction per user per target.

**Files**:
- `server/src/models/reaction.ts` — Reaction DB queries
- `server/src/routes/reactions.ts` — Reaction endpoints
- `server/src/index.ts` — register routes

**Acceptance Criteria**:
- [ ] POST /reactions creates a reaction (or replaces existing)
- [ ] DELETE /reactions/:id removes a reaction
- [ ] One reaction per user per target enforced
- [ ] Reactions returned with feed items in circle feeds

---

#### Task 15: Build the Hub overview screen

| Field | Value |
|-------|-------|
| ID | T-P15 |
| Type | Modify |
| Estimated Effort | Medium |
| Dependencies | T-P05, T-P07, T-P09, T-P11, T-P13 |

**Description**: Replace the placeholder HubScreen with the real daily overview: today's habits (compact row with tap-to-log), check-in prompt (if not done today), active challenge progress, focus session starter (showing who's currently focusing), and circles list. This is the user's daily home.

**Files**:
- `app/src/screens/hub/HubScreen.tsx` — full implementation
- `app/src/components/ReactionButton.tsx`

**Acceptance Criteria**:
- [ ] Hub shows today's habits with completion state
- [ ] Hub shows check-in prompt if not completed today
- [ ] Hub shows active challenge with day progress
- [ ] Hub shows "Start Focus" button with active co-worker count
- [ ] Hub shows circles with latest activity summary
- [ ] Entire Hub is usable in under 2 minutes
- [ ] No infinite scroll anywhere

---

### Phase 8: Testing + Integration

#### Task 16: Write server integration tests for new features

| Field | Value |
|-------|-------|
| ID | T-P16 |
| Type | Test |
| Estimated Effort | Large |
| Dependencies | T-P04, T-P06, T-P08, T-P10, T-P12, T-P14 |

**Description**: Write integration tests for all new API endpoints. Test happy paths, error cases, permission checks (minor restrictions, circle membership), edge cases (duplicate logs, max members, timezone).

**Files**:
- `server/src/__tests__/circles.test.ts`
- `server/src/__tests__/habits.test.ts`
- `server/src/__tests__/checkins.test.ts`
- `server/src/__tests__/challenges.test.ts`
- `server/src/__tests__/focus.test.ts`
- `server/src/__tests__/reactions.test.ts`

**Acceptance Criteria**:
- [ ] All endpoints have happy-path + error-case tests
- [ ] Circle membership limits tested (max 3 circles, max 8 members)
- [ ] Habit log idempotency tested (same day = no duplicate)
- [ ] Check-in immutability tested (cannot edit after creation)
- [ ] Challenge progress calculation verified
- [ ] Under-18 restrictions tested where applicable

---

#### Task 17: Update seed data for development

| Field | Value |
|-------|-------|
| ID | T-P17 |
| Type | Modify |
| Estimated Effort | Small |
| Dependencies | T-P02 |
| Parallel With | any |

**Description**: Update the seed script to include sample circles, challenges, habits, check-ins, and focus sessions for development and demo purposes.

**Files**:
- `server/src/db/seeds/001_dev_data.ts` — extend with new feature data

**Acceptance Criteria**:
- [ ] Seed creates 2 circles with 3-4 members each
- [ ] Seed creates 2 active challenges (1 public, 1 circle-scoped) with some progress logged
- [ ] Seed creates habit logs for the past week for sample users
- [ ] Seed creates check-ins for the past 3 days

---

## Execution Notes for AI Agents

- Run `npx tsc --noEmit` in both server/ and app/ after each task
- Run `npx vitest run` after completing each phase (requires running DB)
- All new routes must use the `authenticate` middleware
- All new stores follow Zustand patterns from `app/src/store/eventStore.ts`
- All new screens follow the dark theme: `#0a0a0a` bg, `#1a1a1a` cards, `#4ade80` accent, `#262626` borders
- Use zod for request validation on all new routes (pattern from existing routes)
- Circle feed query must filter to last 24 hours only (anti-addiction)
- Habit IDs must match those defined in `shared/src/habits.ts`

## Progress Tracking

| Task ID | Status | Notes |
|---------|--------|-------|
| T-P01 | Not Started | |
| T-P02 | Not Started | |
| T-P03 | Not Started | |
| T-P04 | Not Started | |
| T-P05 | Not Started | |
| T-P06 | Not Started | |
| T-P07 | Not Started | |
| T-P08 | Not Started | |
| T-P09 | Not Started | |
| T-P10 | Not Started | |
| T-P11 | Not Started | |
| T-P12 | Not Started | |
| T-P13 | Not Started | |
| T-P14 | Not Started | |
| T-P15 | Not Started | |
| T-P16 | Not Started | |
| T-P17 | Not Started | |
