# Tasks: Disconnect — MVP

| Field        | Value                                              |
|-------------|-----------------------------------------------------|
| Status      | Not Started                                         |
| Created     | 2026-04-21                                          |
| Author      | Dylan                                               |
| Spec        | `docs/specs/rfc-disconnect-mvp.md`                  |
| Design      | `docs/designs/design-disconnect-mvp.md`             |
| Phase       | Tasks                                               |

## Task Execution Order

Tasks are ordered by dependency. Complete tasks in order within each phase.

---

### Phase 1: Project Scaffolding & Foundation

#### Task 1: Initialize monorepo structure

| Field | Value |
|-------|-------|
| ID | T-001 |
| Type | Config |
| Estimated Effort | Small |
| Dependencies | None |

**Description**: Set up the monorepo with three packages: `app/` (React Native/Expo), `server/` (Node.js/Express), and `shared/` (shared types). Initialize git, configure TypeScript for each package, set up ESLint + Prettier.

**Files**:
- `disconnect/package.json` — root workspace config
- `disconnect/app/package.json` — Expo/RN dependencies
- `disconnect/server/package.json` — Express + Knex + pg dependencies
- `disconnect/shared/package.json` — shared types package
- `disconnect/tsconfig.json` — root TS config
- `disconnect/.gitignore`
- `disconnect/.eslintrc.js`

**Acceptance Criteria**:
- [ ] `npm install` succeeds at root level
- [ ] TypeScript compiles in all three packages
- [ ] ESLint runs without errors on empty project

---

#### Task 2: Set up the shared types package

| Field | Value |
|-------|-------|
| ID | T-002 |
| Type | New File |
| Estimated Effort | Small |
| Dependencies | T-001 |

**Description**: Define all shared TypeScript types, interfaces, enums, and constants used by both the app and server. Includes user types, event types, beacon types, category/interest lists, and API request/response shapes.

**Files**:
- `shared/src/types.ts` — User, Event, Beacon, EventRSVP, BeaconInterest, Block, ChatMessage interfaces
- `shared/src/categories.ts` — hardcoded event category list
- `shared/src/interests.ts` — hardcoded interest tag list
- `shared/src/api.ts` — API request/response type definitions

**Acceptance Criteria**:
- [ ] All entity types from the design doc are defined
- [ ] Categories list: outdoors, coffee, sports, games, study, creative, food, music, volunteering
- [ ] Types compile and are importable from both `app/` and `server/`

---

#### Task 3: Set up PostgreSQL + PostGIS database and migrations

| Field | Value |
|-------|-------|
| ID | T-003 |
| Type | Config + New Files |
| Estimated Effort | Medium |
| Dependencies | T-001 |
| Parallel With | T-002 |

**Description**: Configure Knex.js with PostgreSQL connection. Create all database migration files for the schema defined in the design doc. Include PostGIS extension setup, all tables, indexes, and constraints.

**Files**:
- `server/src/config/database.ts` — Knex config + connection
- `server/src/config/env.ts` — environment variable loader
- `server/knexfile.ts` — Knex CLI config
- `server/src/db/migrations/001_enable_extensions.ts` — PostGIS + uuid-ossp
- `server/src/db/migrations/002_create_users.ts`
- `server/src/db/migrations/003_create_events.ts`
- `server/src/db/migrations/004_create_beacons.ts`
- `server/src/db/migrations/005_create_event_chat.ts`
- `server/src/db/migrations/006_create_blocks.ts`

**Acceptance Criteria**:
- [ ] `knex migrate:latest` runs successfully against a local PostgreSQL + PostGIS instance
- [ ] All tables, columns, constraints, and spatial indexes match the design doc schema
- [ ] `knex migrate:rollback` cleanly reverses all changes

---

### Phase 2: Server — Auth & Core API

#### Task 4: Implement auth routes (phone verification + JWT)

| Field | Value |
|-------|-------|
| ID | T-004 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-003 |

**Description**: Build the authentication flow: send SMS code via Twilio Verify, verify code, issue JWT access + refresh tokens, create profile endpoint with DOB-based age detection. Set up Redis for refresh token storage.

**Files**:
- `server/src/routes/auth.ts` — POST /send-code, /verify-code, /create-profile
- `server/src/services/sms.ts` — Twilio Verify wrapper
- `server/src/middleware/auth.ts` — JWT verification middleware
- `server/src/config/redis.ts` — Redis connection
- `server/src/models/user.ts` — User DB queries

**Acceptance Criteria**:
- [ ] SMS code can be sent and verified via Twilio
- [ ] JWT tokens are issued on successful verification
- [ ] Profile creation stores user with computed `is_minor` flag
- [ ] Auth middleware correctly extracts userId and isMinor from JWT
- [ ] Refresh token flow works (exchange refresh token for new access token)

---

#### Task 5: Implement age gate middleware

| Field | Value |
|-------|-------|
| ID | T-005 |
| Type | New File |
| Estimated Effort | Small |
| Dependencies | T-004 |

**Description**: Create middleware that blocks minor users from adult-only actions (creating events, creating beacons). Create a query filter that restricts minor users to `all_ages = true` events only.

**Files**:
- `server/src/middleware/ageGate.ts` — requireAdult middleware
- Update `server/src/models/event.ts` — add minorSafeFilter to event queries

**Acceptance Criteria**:
- [ ] Minor users receive 403 when attempting to create events or beacons
- [ ] Minor users only see events with `all_ages = true` in listings
- [ ] Adult users are unaffected by the middleware

---

#### Task 6: Implement event CRUD + RSVP routes

| Field | Value |
|-------|-------|
| ID | T-006 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-005 |

**Description**: Build all event-related endpoints: list nearby events (PostGIS radius query), create event, get event detail with attendees, RSVP/un-RSVP. Include block filtering (hide events from blocked users).

**Files**:
- `server/src/routes/events.ts` — all event endpoints
- `server/src/models/event.ts` — event DB queries with PostGIS

**Acceptance Criteria**:
- [ ] GET /events returns events within the specified radius, sorted by start time + distance
- [ ] POST /events creates an event (adults only)
- [ ] POST /events/:id/rsvp adds the user; DELETE removes them
- [ ] Events from blocked users are excluded from listings
- [ ] Results are capped at 50 per request

---

#### Task 7: Implement beacon CRUD + interest routes

| Field | Value |
|-------|-------|
| ID | T-007 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-005 |
| Parallel With | T-006 |

**Description**: Build beacon endpoints: list nearby active beacons, create beacon (with 2h expiry), express interest, delete own beacon. Rate limit to 1 active beacon per user.

**Files**:
- `server/src/routes/beacons.ts` — all beacon endpoints
- `server/src/models/beacon.ts` — beacon DB queries with PostGIS
- `server/src/jobs/expireBeacons.ts` — cron job to clean expired beacons

**Acceptance Criteria**:
- [ ] GET /beacons returns active (non-expired) beacons within radius
- [ ] POST /beacons creates a beacon with expires_at = now + 2h (adults only)
- [ ] Users cannot have more than 1 active beacon at a time
- [ ] POST /beacons/:id/interest registers interest; creator sees name + count
- [ ] Expired beacons are cleaned up by cron job

---

#### Task 8: Implement block routes

| Field | Value |
|-------|-------|
| ID | T-008 |
| Type | New Files |
| Estimated Effort | Small |
| Dependencies | T-004 |
| Parallel With | T-006, T-007 |

**Description**: Build block/unblock endpoints. Blocking hides the blocked user's content (events, beacons) from the blocker and vice versa.

**Files**:
- `server/src/routes/blocks.ts` — POST, DELETE, GET endpoints
- `server/src/models/block.ts` — block DB queries

**Acceptance Criteria**:
- [ ] POST /blocks blocks a user; DELETE unblocks
- [ ] GET /blocks lists blocked users
- [ ] Blocked user relationships are respected in event and beacon queries

---

#### Task 9: Implement user profile routes + photo upload

| Field | Value |
|-------|-------|
| ID | T-009 |
| Type | New Files |
| Estimated Effort | Small |
| Dependencies | T-004 |
| Parallel With | T-006, T-007, T-008 |

**Description**: Build user profile endpoints: get own profile, update profile, upload photo to object storage. Include screen time endpoint (returns stored weekly data).

**Files**:
- `server/src/routes/users.ts` — GET/PATCH /me, POST /me/photo, GET /me/screen-time
- `server/src/services/storage.ts` — R2/S3 upload helper

**Acceptance Criteria**:
- [ ] GET /users/me returns the authenticated user's profile
- [ ] PATCH /users/me updates allowed fields (name, bio, interests)
- [ ] POST /users/me/photo uploads image and returns URL
- [ ] Photo is stored in R2/S3 with a unique key

---

#### Task 10: Implement event chat via WebSocket

| Field | Value |
|-------|-------|
| ID | T-010 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-006 |

**Description**: Build WebSocket server for real-time event group chat. Users connect per event, must have RSVP'd, messages are persisted and broadcast. Include chat history endpoint and the cron job to archive chats 24h after event ends.

**Files**:
- `server/src/ws/chatHandler.ts` — WebSocket connection handler
- `server/src/models/chatMessage.ts` — chat message DB queries
- `server/src/jobs/archiveChats.ts` — cron job to delete old chat messages
- Add GET /events/:id/chat to `server/src/routes/events.ts`

**Acceptance Criteria**:
- [ ] Users can connect to WS for an event they've RSVP'd to
- [ ] Messages are broadcast to all connected users in the event
- [ ] Messages are persisted to event_chat_messages table
- [ ] GET /events/:id/chat returns paginated history
- [ ] Chat access is denied if user hasn't RSVP'd or event ended + 24h
- [ ] Cron job deletes chat messages 24h after event ends

---

#### Task 11: Set up push notifications

| Field | Value |
|-------|-------|
| ID | T-011 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-004 |

**Description**: Integrate Firebase Cloud Messaging (Android) and APNs (iOS) for push notifications. Send notifications for: event reminders (1h before), beacon interest alerts, and new chat messages (when user is not connected to WS).

**Files**:
- `server/src/services/push.ts` — FCM + APNs integration
- Add device token registration to `server/src/routes/users.ts`
- Add push triggers to event RSVP, beacon interest, and chat handlers

**Acceptance Criteria**:
- [ ] Users can register device tokens
- [ ] Event reminder pushes fire 1h before event start
- [ ] Beacon creators get push when someone expresses interest
- [ ] Chat message pushes fire when user is offline for that event
- [ ] No other notification types are sent (no engagement bait)

---

### Phase 3: Mobile App — Core Screens

#### Task 12: Set up React Native / Expo app with navigation

| Field | Value |
|-------|-------|
| ID | T-012 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-002 |

**Description**: Initialize Expo project, configure React Navigation with a bottom tab navigator (Events, Map, Profile) and stack navigators for auth flow and detail screens. Set up Zustand stores, API client, and secure token storage.

**Files**:
- `app/src/navigation/RootNavigator.tsx` — auth flow + main tabs
- `app/src/services/api.ts` — Axios client with auth interceptor
- `app/src/hooks/useAuth.ts` — auth state + token management
- `app/src/store/authStore.ts` — Zustand auth store

**Acceptance Criteria**:
- [ ] App boots and shows auth flow when unauthenticated
- [ ] Authenticated users see bottom tab navigation (Events, Map, Profile)
- [ ] API client automatically attaches JWT and handles refresh
- [ ] Tokens are persisted in secure storage (react-native-keychain)

---

#### Task 13: Build auth screens (phone entry, verify, create profile)

| Field | Value |
|-------|-------|
| ID | T-013 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-004, T-012 |

**Description**: Build the three auth screens: phone number entry, SMS code verification, and profile creation (name, DOB with age gate, bio, interest selection).

**Files**:
- `app/src/screens/auth/PhoneEntryScreen.tsx`
- `app/src/screens/auth/VerifyCodeScreen.tsx`
- `app/src/screens/auth/CreateProfileScreen.tsx`
- `app/src/components/InterestTag.tsx` — selectable interest chip
- `app/src/utils/age.ts` — age calculation + minimum age check

**Acceptance Criteria**:
- [ ] User can enter phone number and receive SMS code
- [ ] User can enter code and proceed to profile creation (or home if returning user)
- [ ] Under-13 users are blocked at DOB entry with clear messaging
- [ ] User can select 2-3 interests from the curated list
- [ ] Profile is created and user lands on the main app

---

#### Task 14: Build event list + detail screens

| Field | Value |
|-------|-------|
| ID | T-014 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-006, T-012 |

**Description**: Build the Events tab: list of nearby events (finite list, no infinite scroll), category filter chips, event detail screen with attendee list and RSVP button.

**Files**:
- `app/src/screens/events/EventListScreen.tsx`
- `app/src/screens/events/EventDetailScreen.tsx`
- `app/src/components/EventCard.tsx`
- `app/src/store/eventStore.ts` — Zustand event store
- `app/src/services/events.ts` — event API calls
- `app/src/hooks/useLocation.ts` — location permission + current position

**Acceptance Criteria**:
- [ ] Event list shows nearby events (max 50), sorted by time/distance
- [ ] Category filter chips work (outdoors, coffee, sports, etc.)
- [ ] Event detail shows full info + attendee list
- [ ] RSVP/un-RSVP button works and updates UI immediately
- [ ] List is finite — no infinite scroll, no "load more"
- [ ] Location permission is requested with clear explanation

---

#### Task 15: Build create event screen

| Field | Value |
|-------|-------|
| ID | T-015 |
| Type | New File |
| Estimated Effort | Medium |
| Dependencies | T-014 |

**Description**: Build the event creation form: title, description, location picker (map pin or address search), date/time picker, category selector, max attendees, all-ages toggle. Only accessible to adult users.

**Files**:
- `app/src/screens/events/CreateEventScreen.tsx`
- `app/src/components/AgeGate.tsx` — wrapper that hides content from minors

**Acceptance Criteria**:
- [ ] Form validates all required fields before submission
- [ ] Location can be set via map pin or address search
- [ ] Date/time picker prevents past dates
- [ ] Category selection from hardcoded list
- [ ] All-ages toggle is prominent and explained
- [ ] Minor users cannot access this screen

---

#### Task 16: Build beacon map screen

| Field | Value |
|-------|-------|
| ID | T-016 |
| Type | New Files |
| Estimated Effort | Large |
| Dependencies | T-007, T-012 |
| Parallel With | T-014 |

**Description**: Build the Map tab: map view centered on user's location showing active beacons as pins. Tapping a pin shows the beacon detail (message, activity, creator name). "I'm interested" button. Create beacon button for adults.

**Files**:
- `app/src/screens/beacons/BeaconMapScreen.tsx`
- `app/src/screens/beacons/CreateBeaconScreen.tsx`
- `app/src/components/BeaconPin.tsx` — custom map marker
- `app/src/store/beaconStore.ts` — Zustand beacon store
- `app/src/services/beacons.ts` — beacon API calls

**Acceptance Criteria**:
- [ ] Map renders centered on user location
- [ ] Active beacons show as pins with activity icon
- [ ] Tapping a pin shows beacon info + "I'm interested" button
- [ ] Create beacon form: message, activity, auto-detects location
- [ ] Minor users can view beacons but cannot create them
- [ ] Beacons visually disappear when expired

---

#### Task 17: Build event chat screen

| Field | Value |
|-------|-------|
| ID | T-017 |
| Type | New File |
| Estimated Effort | Medium |
| Dependencies | T-010, T-014 |

**Description**: Build the event group chat screen. WebSocket connection for real-time messages. Show chat history on load. Only accessible after RSVP. Auto-locked 24h after event ends.

**Files**:
- `app/src/screens/events/EventChatScreen.tsx`
- `app/src/hooks/useWebSocket.ts` — WS connection hook

**Acceptance Criteria**:
- [ ] Chat loads history on open
- [ ] New messages appear in real-time via WebSocket
- [ ] User can send messages
- [ ] Chat is only accessible to users who have RSVP'd
- [ ] Locked state shown if event ended + 24h

---

#### Task 18: Build profile screen

| Field | Value |
|-------|-------|
| ID | T-018 |
| Type | New Files |
| Estimated Effort | Small |
| Dependencies | T-009, T-012 |
| Parallel With | T-014, T-016 |

**Description**: Build the Profile tab: view profile, edit profile, photo upload, weekly screen time display, blocked users list.

**Files**:
- `app/src/screens/profile/ProfileScreen.tsx`
- `app/src/screens/profile/EditProfileScreen.tsx`
- `app/src/hooks/useScreenTime.ts` — local screen time tracking

**Acceptance Criteria**:
- [ ] Profile displays name, bio, interests, photo, and age badge
- [ ] Edit screen allows updating name, bio, interests, and photo
- [ ] Weekly screen time displayed as a "low score" badge
- [ ] Blocked users list accessible with unblock option

---

### Phase 4: Anti-Screen-Time Features & Polish

#### Task 19: Implement screen time tracking + nudge

| Field | Value |
|-------|-------|
| ID | T-019 |
| Type | New Files |
| Estimated Effort | Small |
| Dependencies | T-012 |

**Description**: Build the client-side screen time tracker (AppState listener, AsyncStorage persistence) and the 5-minute nudge overlay component.

**Files**:
- `app/src/hooks/useScreenTime.ts` — AppState listener, timer, storage
- `app/src/components/ScreenTimeNudge.tsx` — overlay shown after 5 min

**Acceptance Criteria**:
- [ ] Screen time is tracked per session and aggregated weekly
- [ ] After 5 minutes of continuous use, a non-blocking nudge appears
- [ ] Nudge can be dismissed but reappears after another 5 minutes
- [ ] Weekly total is displayed on the profile screen

---

#### Task 20: Configure push notifications (client-side)

| Field | Value |
|-------|-------|
| ID | T-020 |
| Type | New Files |
| Estimated Effort | Medium |
| Dependencies | T-011, T-012 |

**Description**: Set up Expo push notifications. Request permission, register device token with server, handle incoming notifications (deep link to relevant screen).

**Files**:
- `app/src/services/notifications.ts` — registration + token handling
- Update `app/src/navigation/RootNavigator.tsx` — deep link handler

**Acceptance Criteria**:
- [ ] Permission requested on first launch after signup
- [ ] Device token registered with server
- [ ] Tapping a notification opens the relevant screen (event detail, beacon, chat)
- [ ] Only permitted notification types are received

---

### Phase 5: Testing & Launch Prep

#### Task 21: Write server integration tests

| Field | Value |
|-------|-------|
| ID | T-021 |
| Type | Test |
| Estimated Effort | Large |
| Dependencies | T-006, T-007, T-008, T-009, T-010 |

**Description**: Write integration tests for all API endpoints using a test PostgreSQL + PostGIS database. Cover auth flow, event CRUD, beacon CRUD, RSVP, block filtering, age restrictions, and chat.

**Files**:
- `server/tests/auth.test.ts`
- `server/tests/events.test.ts`
- `server/tests/beacons.test.ts`
- `server/tests/blocks.test.ts`
- `server/tests/chat.test.ts`
- `server/tests/setup.ts` — test DB setup/teardown

**Acceptance Criteria**:
- [ ] All endpoints have happy-path and error-case tests
- [ ] Age gate restrictions are tested (minor creates event → 403)
- [ ] PostGIS radius queries return correct results
- [ ] Block filtering is verified in event and beacon listings
- [ ] Tests run against a real test database (no mocks for DB)

---

#### Task 22: Seed data + dev environment setup

| Field | Value |
|-------|-------|
| ID | T-022 |
| Type | Config |
| Estimated Effort | Small |
| Dependencies | T-003 |

**Description**: Create seed data script that populates the database with sample users, events, and beacons in a target city for development and demo purposes. Include a docker-compose for local dev (Postgres + PostGIS + Redis).

**Files**:
- `server/src/db/seed.ts` — seed script
- `docker-compose.yml` — local development services

**Acceptance Criteria**:
- [ ] `docker compose up` starts PostgreSQL + PostGIS + Redis locally
- [ ] `knex seed:run` populates 20 users, 15 events, 10 beacons in a target city
- [ ] Seed data includes both adult and minor users to test age gating

---

## Execution Notes for AI Agents

- Run `npx tsc --noEmit` after each task to verify type safety
- Run `npx eslint .` after each task to verify code style
- Run the test suite after completing each phase
- All PostGIS queries should use parameterized queries (never string concatenation)
- Phone numbers must NEVER be stored in plain text — hash before persisting
- Use the shared types package for all type definitions (don't duplicate between app and server)
- Follow the file structure exactly as defined in the design doc

## Progress Tracking

| Task ID | Status | Notes |
|---------|--------|-------|
| T-001 | Not Started | |
| T-002 | Not Started | |
| T-003 | Not Started | |
| T-004 | Not Started | |
| T-005 | Not Started | |
| T-006 | Not Started | |
| T-007 | Not Started | |
| T-008 | Not Started | |
| T-009 | Not Started | |
| T-010 | Not Started | |
| T-011 | Not Started | |
| T-012 | Not Started | |
| T-013 | Not Started | |
| T-014 | Not Started | |
| T-015 | Not Started | |
| T-016 | Not Started | |
| T-017 | Not Started | |
| T-018 | Not Started | |
| T-019 | Not Started | |
| T-020 | Not Started | |
| T-021 | Not Started | |
| T-022 | Not Started | |
