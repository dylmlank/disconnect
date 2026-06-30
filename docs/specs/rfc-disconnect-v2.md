# RFC: Disconnect v2 — Reclaim Your Life

| Field        | Value                          |
|-------------|--------------------------------|
| Status      | Draft                          |
| Created     | 2026-05-29                     |
| Author      | Dylan                          |
| Phase       | Specification                  |
| Supersedes  | `rfc-disconnect-mvp.md`        |

## Summary

Disconnect is a mobile app that helps people — especially teens and young adults — prove to themselves that life is better off screens. It combines group offline sessions, personal life-quality tracking, and an impulse awareness gate into a single experience that feels like running an experiment on your own life rather than restricting yourself.

The app is not a screen time blocker. It's not a guilt machine. It's a tool that gives you evidence, community, and self-awareness — then gets out of your way.

## Problem Statement

Teens and young adults are spending 6-8 hours daily consuming algorithmically-fed content. The consequences are measurable:

- Declining attention spans and IQ scores correlating with smartphone adoption
- Rising anxiety, depression, and social isolation in under-25 demographics
- Thousands of cumulative hours spent absorbing content that produces no skills, memories, or growth
- Passive consumption replacing active living — watching others' lives instead of building your own

The existing solutions fail because:

1. **Screen time blockers** get disabled within days — willpower alone doesn't work
2. **Digital wellness apps** become another notification, another thing to check
3. **Guilt-based approaches** create shame without providing an alternative
4. **Individual-only tools** ignore that behavior change is social

There is no app that says: "Let's find out together if your life is actually better without this."

## Core Philosophy

- **Experiment, not restriction** — You're testing a hypothesis about your own life
- **Evidence, not guilt** — Your own data shows you the truth
- **Together, not alone** — Your group goes dark with you
- **Awareness, not blocking** — The impulse gate is a mirror, not a wall
- **Disappearing, not engaging** — Success means you stop needing the app

## Goals

- **G1:** Enable groups of friends to go offline together and track their collective sessions
- **G2:** Help users build personal evidence that their life quality improves when offline
- **G3:** Increase self-awareness around phone impulses without blocking or shaming
- **G4:** Be usable by anyone 13+ regardless of technical skill
- **G5:** Minimize in-app time — the app should take <30 seconds per interaction
- **G6:** Work globally with no location dependency (unlike v1 meetup concept)

## Non-Goals (MVP)

- **Blocking apps or enforcing screen time limits** — we're awareness-based, not enforcement-based
- **Social feed / content / posts** — this is not another social media app
- **Monetization** — no paid features in v1
- **Gamification / streaks / leaderboards** — these create another dopamine loop
- **Integration with device screen time APIs** — too permission-heavy, platform-inconsistent, and shifts focus to minutes rather than life quality
- **Web app** — mobile-first, keep it simple
- **AI-generated insights** — your data speaks for itself with simple charts

## User Stories / Requirements

### Functional Requirements

#### Authentication & Profile

- **REQ-1**: Users sign up with phone number or email — *Must have*
- **REQ-2**: Users provide date of birth (13+ required, COPPA compliance) — *Must have*
- **REQ-3**: Users create minimal profile: first name, optional photo — *Must have*
- **REQ-4**: Users can create or join groups via invite code/link — *Must have*

#### Groups

- **REQ-5**: Users can create a group and invite friends via shareable link or code — *Must have*
- **REQ-6**: Groups have a name and up to 20 members — *Must have*
- **REQ-7**: Any group member can start an offline session (invite the group to go dark) — *Must have*
- **REQ-8**: Users can be in multiple groups — *Must have*

#### Offline Sessions (Going Dark)

- **REQ-9**: Any member can start a session — scheduled ("Friday 6pm-10pm") or spontaneous ("going dark now, who's in?") — *Must have*
- **REQ-10**: Group members get a notification to join an active session — *Must have*
- **REQ-11**: Joining a session means committing to stay off your phone (honor system + impulse gate awareness) — *Must have*
- **REQ-12**: Sessions track duration and who participated — *Must have*
- **REQ-13**: During a session, users see a simple "in session" screen with elapsed time and who else is in — *Must have*
- **REQ-14**: Users can end their participation in a session at any time (no guilt, just data) — *Must have*
- **REQ-15**: Scheduled recurring sessions ("every Friday 7-10pm") — *Should have*
- **REQ-16**: A subtle ambient indicator showing your group is currently offline together — *Should have*

#### Life Quality Check-ins

- **REQ-17**: After each offline session (or daily), users get a quick check-in prompt — *Must have*
- **REQ-18**: Check-in questions are simple 1-5 scale ratings: mood, presence, energy, connection, accomplishment — *Must have*
- **REQ-19**: Users can optionally add a one-line note about what they did while offline — *Should have*
- **REQ-20**: The app shows personal trends over time — "On days with 3+ offline hours, your mood averages 4.2 vs 2.8" — *Must have*
- **REQ-21**: Weekly/monthly summary comparing offline days vs regular days — *Must have*
- **REQ-22**: No check-in data is shared with the group — this is personal — *Must have*

#### Impulse Gate

- **REQ-23**: Users can designate "trigger apps" (social media, etc.) during setup — *Must have*
- **REQ-24**: When a user opens a trigger app during a session, an overlay appears asking: "What are you looking for right now?" — *Must have*
- **REQ-25**: The user must type a short reason (or pick from common ones: bored, anxious, habit, need specific info) — *Must have*
- **REQ-26**: After answering, the user can proceed (no blocking) — the gate is awareness, not restriction — *Must have*
- **REQ-27**: Impulse data is tracked privately — "You opened Instagram 12 times this week. 8 times the reason was 'bored'" — *Must have*
- **REQ-28**: The impulse gate works outside of sessions too (always-on awareness mode) — *Should have*
- **REQ-29**: Over time, show patterns: "You reach for TikTok most between 9-11pm when you're bored" — *Should have*

#### Dashboard / Home

- **REQ-30**: Home screen shows: active sessions, next scheduled session, recent check-in trends — *Must have*
- **REQ-31**: Simple visualization of personal experiment results — *Must have*
- **REQ-32**: Group activity: who went dark recently, collective hours offline — *Should have*
- **REQ-33**: No infinite scroll, no feed — just your data and your group status — *Must have*

### Non-Functional Requirements

#### Performance
- App opens to home screen in <1 second
- Check-in flow completes in <15 seconds
- Impulse gate overlay appears in <500ms when triggered

#### Privacy & Security
- Check-in data and impulse logs are stored locally by default, synced to server only for backup
- No user data is shared with group members (only session participation is visible)
- All API communication over HTTPS
- Under-18 users get same experience (no restriction needed since there's no stranger interaction)
- Phone numbers/emails never exposed to other users

#### Accessibility
- AA contrast ratios minimum
- Screen reader compatible
- System font size support
- Works on low-end devices (no heavy animations)

#### Platform Support
- iOS 15+ and Android 10+
- Works offline (check-ins and impulse gate function without internet)

## Impact Analysis

### Affected Systems

| System/Component | Impact Type | Description |
|-----------------|-------------|-------------|
| Mobile App (React Native / Expo) | New | Full client application |
| Backend API (Node.js or Supabase) | New | Auth, groups, session tracking, sync |
| Database (PostgreSQL or Supabase) | New | Users, groups, sessions, check-ins |
| Push Notifications (FCM/APNs) | New Integration | Session invites and reminders |
| Accessibility Service / Overlay (Android) | New Integration | Impulse gate overlay detection |
| Screen Time API (iOS) | New Integration | Impulse gate trigger app monitoring |

### Key Technical Challenges

1. **Impulse Gate implementation** — Detecting when trigger apps are opened requires different approaches per platform:
   - Android: Accessibility Service or UsageStatsManager to detect app launches → show overlay
   - iOS: Screen Time API (DeviceActivityMonitor) or shortcuts-based approach → limited but possible
   - Fallback: Manual "I'm about to open an app" button (works everywhere, less magical)
   
2. **Offline-first architecture** — Check-ins and impulse logs must work without internet and sync later

3. **Session state synchronization** — Multiple users in a session need to see who's active (lightweight WebSocket or polling)

## Success Criteria

- [ ] A user can create a group and invite friends via link
- [ ] A group member can start an offline session and others can join
- [ ] Users complete a check-in after a session in under 15 seconds
- [ ] The impulse gate triggers when opening a designated app and captures the reason
- [ ] Personal trends show meaningful correlation between offline time and life quality ratings
- [ ] The app takes less than 30 seconds per typical interaction
- [ ] Users can see their impulse patterns (when, why, which apps)
- [ ] Weekly summary provides clear "your life on vs off screens" comparison

## Resolved Decisions

- **D-1**: No device screen time tracking — we track life quality (subjective) not minutes (objective). This is intentional: the question isn't "how many minutes" but "is your life better?"
- **D-2**: Honor system for offline sessions — we don't spy on users. The impulse gate provides awareness but doesn't enforce. Trust > surveillance.
- **D-3**: No gamification — no points, streaks, badges, or leaderboards. These create the same dopamine loops we're fighting against.
- **D-4**: Check-in data is private — sharing life quality scores would create performance pressure and dishonesty.
- **D-5**: Impulse gate is never blocking — you can always proceed. The value is in the pause and the pattern recognition.
- **D-6**: Groups are invite-only (no discovery) — this is for real friend groups, not stranger matching.
- **D-7**: Minimum age 13+ — same as v1. No stranger interaction means lower risk than the meetup model.

## Open Questions

- **OQ-1**: What's the best fallback for iOS impulse gate given Apple's restrictive APIs? Shortcut automation? Widget-based check? Manual button?
- **OQ-2**: Should there be a "solo mode" for users without a group willing to join? Or is the social element essential?
- **OQ-3**: What does the onboarding flow look like? How do we communicate the experiment framing without being preachy?
- **OQ-4**: Should check-in questions be fixed or should users be able to customize what they track?

## Target Audience

- **Primary**: Teens and young adults (15-25) who already feel something is wrong with their screen habits
- **Secondary**: Anyone who wants evidence-based self-awareness about their phone use
- **Personality**: People who respond to data and honesty over guilt and restriction. People with at least one friend willing to try it with them.

## Tone & Brand

- Honest, slightly confrontational, never preachy
- Speaks like a friend who's figured it out
- "You already know this is bad. We're just helping you prove it."
- Dark/minimal UI — the app should feel calm, not stimulating
- No bright colors competing for attention — it's an anti-engagement app

## References

- Previous MVP spec (superseded): `docs/specs/rfc-disconnect-mvp.md`
- Research: Jonathan Haidt, "The Anxious Generation" (2024)
- Research: Jean Twenge, "iGen" (2017)
- Research: Sapien Labs, "Age of First Smartphone" studies
