# RFC: Disconnect Platform Expansion — Social Productivity Hub

| Field        | Value                          |
|-------------|--------------------------------|
| Status      | Draft                          |
| Created     | 2026-05-12                     |
| Author      | Dylan                          |
| Phase       | Specification                  |

## Summary

Expand Disconnect from an anti-screen-time meetup app into a full **evidence-based social productivity platform**. The app keeps its existing Events + Beacons pillars and adds four new ones: Challenges, Focus Sessions, Habit Tracking, and Daily Check-ins — all powered by small-group accountability ("Circles") with public city-wide challenges layered on top.

Every new feature is grounded in peer-reviewed research and designed to be used briefly (under 2 minutes per session), with the real value happening offline.

## Problem Statement

Existing productivity and wellness apps fail for two reasons:

1. **They're solo** — habit trackers, meditation apps, and focus timers have ~95% churn within 30 days because there's no social accountability. Gollwitzer's research shows public commitment + partner checking raises goal follow-through by ~65%.

2. **They're designed to maximize screen time** — even "wellness" apps keep you scrolling, reading content, watching videos. The tool becomes the problem.

Disconnect already solves #2 with its anti-screen-time design. This expansion adds the social accountability layer that makes productivity practices actually stick — backed by research showing d=0.7 effect sizes for group-based behavior change.

## Goals

- **G1:** Add Circles (small groups of 3-8 friends) as the core social accountability unit
- **G2:** Launch group Challenges with evidence-backed defaults (7-day, 14-day, 30-day programs)
- **G3:** Add Focus Sessions — timed co-working with accountability partners
- **G4:** Add social Habit Tracking visible to your Circle
- **G5:** Add Daily Check-ins (gratitude/reflection journaling shared with Circle)
- **G6:** Maintain all existing Events + Beacons functionality unchanged
- **G7:** Keep average session length under 3 minutes — the new features must NOT create engagement loops
- **G8:** Every feature references the specific research backing it (transparency with users)

## Non-Goals

The following are explicitly **out of scope** for this expansion:

- **Content/articles** — no blog posts, educational content, or in-app reading. The app is a tool.
- **AI coaching** — no AI-generated advice, chatbots, or personalized recommendations
- **Leaderboards with rankings** — public challenges show participation, not ranked competition (avoids toxic comparison)
- **Meditation/audio content** — we don't replace Headspace. We prompt you to meditate and log it.
- **Wearable integrations (v2)** — Apple Watch, Fitbit, etc. are future scope
- **Monetization of new features (v1)** — all new pillars are free initially; paywall comes later
- **Direct messaging** — communication stays in group contexts (Circles, event chats)

## User Stories / Requirements

### Circles (Social Accountability Groups)

- **REQ-C1**: Users can create a Circle with a name and invite up to 7 others via invite code — *Must have*
- **REQ-C2**: Users can join up to 3 Circles simultaneously — *Must have*
- **REQ-C3**: Each Circle has a shared feed showing members' habits, check-ins, challenge progress, and focus sessions — *Must have*
- **REQ-C4**: Circle members can react to each other's activity with a single tap (e.g., 🔥 or 👏) — no text comments — *Must have*
- **REQ-C5**: Circle creators can remove members — *Must have*
- **REQ-C6**: Users can leave a Circle at any time — *Must have*
- **REQ-C7**: Circles are private — only members see the activity feed — *Must have*
- **REQ-C8**: Under-18 users can join Circles but cannot create them — *Should have*

### Challenges (Group Accountability Programs)

- **REQ-CH1**: Users can create or join challenges with a defined goal, duration (7/14/21/30 days), and daily requirement — *Must have*
- **REQ-CH2**: Challenges can be Circle-only (private) or city-wide (public, anyone can join) — *Must have*
- **REQ-CH3**: The app provides pre-built challenge templates based on research:
  - "Phone-Free Mornings" (7 days — no phone before 9am, based on Hunt et al. 2018)
  - "30-Day Daily Walk" (30 min outdoors/day, based on Hunter 2019 cortisol research)
  - "Deep Work Week" (2hr+ uninterrupted focus/day, based on Cal Newport/Gloria Mark)
  - "Digital Sunset" (14 days — no screens after 9pm, based on sleep hygiene research)
  - "Gratitude Sprint" (7 days — log 3 good things daily, based on Seligman 2005)
  — *Must have*
- **REQ-CH4**: Users log daily completion with a single tap + optional photo proof — *Must have*
- **REQ-CH5**: Challenge progress shows completion percentage per member (no ranking) — *Must have*
- **REQ-CH6**: Users who complete a challenge earn a badge visible on their profile — *Should have*
- **REQ-CH7**: Missed days are shown honestly (not hidden) — transparency drives accountability — *Must have*
- **REQ-CH8**: Challenge notifications: daily reminder at a user-chosen time, and "X completed today" updates — *Must have*
- **REQ-CH9**: Public challenges show total participant count and city completion rate — *Should have*

### Focus Sessions (Social Co-Working)

- **REQ-F1**: Users can start a timed focus session (25/50/90 min presets or custom) — *Must have*
- **REQ-F2**: Users can invite Circle members to join their focus session (co-working) — *Must have*
- **REQ-F3**: During a focus session, the app shows a minimal timer + who else is currently focusing — no other interaction — *Must have*
- **REQ-F4**: Completed sessions are logged and visible in the user's Circle feed — *Must have*
- **REQ-F5**: Users can set a focus intention ("Writing chapter 3", "Studying calculus") visible to co-workers — *Should have*
- **REQ-F6**: After the timer ends, the session auto-closes — no option to "keep browsing" — *Must have*
- **REQ-F7**: Weekly focus time is displayed on the profile (alongside screen time) — *Must have*
- **REQ-F8**: No video/audio — this is NOT a video call. Just presence awareness. — *Must have*

### Habit Tracking (Social Visibility)

- **REQ-H1**: Users can track up to 5 daily habits from a curated list of evidence-backed practices:
  - Exercise (30+ min) — Schuch 2016, d=0.68
  - Nature time (20+ min outdoors) — Hunter 2019, cortisol -21%
  - Mindfulness (10+ min) — Hofmann 2010, d=0.55
  - Reading (20+ min) — cognitive reserve research
  - Journaling — Seligman 2005, sustained d=0.36
  - Deep work (2+ hrs) — Newport/Mark
  - Screen-free evening — Hunt 2018, d=0.35
  - 7+ hrs sleep — Walker meta-analyses, d>1.0
  - Cold exposure — Souza 2018
  - Social connection (in-person) — Holt-Lunstad 2010
  — *Must have*
- **REQ-H2**: Habits are logged with a single tap (done/not done) — no elaborate tracking — *Must have*
- **REQ-H3**: Habit completion is shared with the user's Circle(s) automatically — *Must have*
- **REQ-H4**: Each habit shows the scientific backing (one sentence + citation) in the UI — *Must have*
- **REQ-H5**: Streak counter per habit — consecutive days completed — *Must have*
- **REQ-H6**: Habits reset at midnight local time — *Must have*
- **REQ-H7**: No punishment/shame for missed days — the design is encouraging, not guilt-inducing — *Must have*
- **REQ-H8**: Users can create 1 custom habit (beyond the curated list) — *Should have*

### Daily Check-ins (Micro-Journaling)

- **REQ-D1**: Users can complete a daily check-in consisting of:
  - Mood (1-5 scale, emoji-based)
  - "3 Good Things" (three short text entries, max 100 chars each) — Seligman 2005
  - One-word intention for tomorrow
  — *Must have*
- **REQ-D2**: Check-ins are shared with the user's Circle(s) — *Must have*
- **REQ-D3**: Circle members can react to check-ins with a single tap — *Must have*
- **REQ-D4**: Users can view their own check-in history (last 30 days) — *Must have*
- **REQ-D5**: Check-in takes under 60 seconds to complete — *Must have*
- **REQ-D6**: Optional daily reminder notification at user-chosen time — *Should have*
- **REQ-D7**: Check-ins cannot be edited after submission (authenticity) — *Must have*

### Non-Functional Requirements

#### Performance
- All new screens load within 1.5 seconds on 4G
- Focus session timer must be accurate to ±1 second (client-side, not server-dependent)
- Habit logging (single tap) must respond within 200ms

#### Privacy
- Circle activity is only visible to Circle members
- Check-in content is never used for advertising or sold
- Users can hide specific habits from specific Circles

#### Anti-Addiction Design
- No infinite scroll on any new screen
- Circle feed is limited to last 24 hours of activity (no endless history)
- Focus session screen shows ONLY the timer — no notifications, no other content
- After completing a check-in, the app suggests closing: "Great. Now go live."

#### Scalability
- Circles are small (max 8) — low query load per group
- Challenges may have 1000+ participants in public mode — needs efficient aggregation
- Focus sessions are client-side timers with server start/end logging only

## Impact Analysis

### Affected Systems

| System/Component | Impact Type | Description |
|-----------------|-------------|-------------|
| PostgreSQL Database | Extended | New tables: circles, circle_members, challenges, challenge_participants, challenge_logs, focus_sessions, habits, habit_logs, check_ins |
| Server API | Extended | New route files for each feature; existing auth middleware reused |
| Mobile App | Extended | New tab(s) or navigation sections; new screens per feature |
| Shared Types | Extended | New interfaces for circles, challenges, habits, check-ins, focus sessions |
| Push Notifications | Extended | New notification types (challenge reminders, circle activity, focus invites) |
| WebSocket | Extended | Real-time focus session presence (who's currently in a session) |
| Users Table | Modified | Add fields for focus_minutes_weekly, current_streak |

### Dependencies

- **Clerk Auth** — existing, reused for all new features
- **PostgreSQL + PostGIS** — existing, extended with new tables (no new extensions needed)
- **Redis** — existing, used for focus session real-time presence
- **Expo Push** — existing, extended with new notification types
- **WebSocket** — existing chatHandler pattern extended for focus session presence

### New Dependencies

- **None** — all new features build on existing infrastructure

## Success Criteria

- [ ] A user can create a Circle, invite friends, and see their activity in a shared feed
- [ ] A user can join a research-backed challenge and log daily completion
- [ ] A user can start a focus session and see Circle members co-working alongside them
- [ ] A user can track up to 5 daily habits with single-tap logging
- [ ] A user can complete a daily check-in (mood + 3 good things + intention) in under 60 seconds
- [ ] Circle feed shows only last 24 hours of activity (no infinite history)
- [ ] Focus session screen shows only the timer during a session (no other content)
- [ ] Each habit displays its scientific backing to the user
- [ ] Average session length remains under 3 minutes across all features
- [ ] All new screens pass type-checking with zero errors

## Resolved Decisions

- **D-1**: Circles max size is **8 members**. Research shows accountability peaks at 3-8 people.
- **D-2**: **No video/audio** in focus sessions. Pure presence awareness. Avoids becoming a video chat app.
- **D-3**: **Curated habit list** with research citations. Users don't define arbitrary habits (except 1 custom slot).
- **D-4**: **No rankings or leaderboards**. Show participation and completion rates, not who's "winning."
- **D-5**: Public challenges are **city-scoped** (same radius as events) — maintains local community feel.
- **D-6**: **24-hour feed window** on Circles — prevents doomscrolling through history.
- **D-7**: Check-ins are **immutable** after submission — drives authenticity over perfectionism.

## Open Questions

- **OQ-1**: Should Focus Sessions use WebSocket for real-time presence (like chat) or poll every 30 seconds? — *Leaning WebSocket for consistency with existing pattern*
- **OQ-2**: Should the app have a new "Hub" tab or add sections to existing tabs? — *Leaning: replace 3-tab layout with 4 tabs: Events, Map, Hub (challenges+habits+checkins), Profile*
- **OQ-3**: How to handle timezone differences in Circles with members in different cities? — *Leaning: each user's habits reset at their local midnight*

## References

### Research Backing

| Practice | Source | Effect |
|----------|--------|--------|
| Social accountability | Gollwitzer et al. (implementation intentions) | +65% goal follow-through |
| Exercise | Schuch 2016 meta-analysis (n=1487) | d=0.68 vs. depression |
| Mindfulness (MBSR) | Hofmann et al. 2010 (39 studies) | d=0.55-0.65 anxiety reduction |
| Gratitude journaling | Seligman et al. 2005 RCT | d=0.36 sustained at 6 months |
| Nature exposure | Hunter 2019 | -21% cortisol per 30 min |
| Deep work / context switching | Gloria Mark, UC Irvine | 23 min recovery per interruption |
| Screen time limits | Hunt et al. 2018, U of Penn | d=0.35-0.5 depression/loneliness reduction |
| Sleep (7-9hr) | Walker meta-analyses | d>1.0 on cognitive performance |
| Cold exposure | Souza 2018 | +300-500% norepinephrine |
| Social connection | Holt-Lunstad 2010 meta-analysis | 50% mortality risk reduction |

### Project Files

- Existing spec: `docs/specs/rfc-disconnect-mvp.md`
- Existing design: `docs/designs/design-disconnect-mvp.md`
- Business plan: `docs/business-plan.md`
- Server codebase: `server/src/`
- App codebase: `app/src/`
