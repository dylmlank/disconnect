# Design: Disconnect — MVP

| Field        | Value                                              |
|-------------|-----------------------------------------------------|
| Status      | Draft                                               |
| Created     | 2026-04-21                                          |
| Author      | Dylan                                               |
| Spec        | `docs/specs/rfc-disconnect-mvp.md`                  |
| Phase       | Design                                              |

## Overview

Disconnect is a React Native mobile app backed by a Node.js/Express REST API with PostgreSQL + PostGIS. The MVP delivers two core features — event-based meetups and spontaneous beacons — with intentional anti-screen-time design patterns baked into every layer.

The architecture prioritizes speed to MVP while remaining extensible for v2 features (1-on-1 matching, challenges).

## Architecture

### System Context

```mermaid
graph TD
    subgraph Client
        RN[React Native App]
    end

    subgraph Backend
        API[Node.js / Express API]
        WS[WebSocket Server]
    end

    subgraph Data
        PG[(PostgreSQL + PostGIS)]
        S3[Object Storage - R2/S3]
        Redis[Redis - sessions & cache]
    end

    subgraph External
        Twilio[Twilio SMS]
        FCM[Firebase Cloud Messaging]
        APNs[Apple Push Notifications]
        Maps[Mapbox SDK]
    end

    RN -->|REST| API
    RN -->|WS| WS
    RN -->|Map tiles| Maps
    API --> PG
    API --> S3
    API --> Redis
    API --> Twilio
    API --> FCM
    API --> APNs
    WS --> Redis
    WS --> PG
```

### Component Design

```mermaid
classDiagram
    class User {
        +uuid id
        +string phone_hash
        +string first_name
        +date date_of_birth
        +string bio
        +string[] interests
        +string photo_url
        +boolean is_minor
        +point approximate_location
        +timestamp created_at
    }

    class Event {
        +uuid id
        +uuid creator_id
        +string title
        +string description
        +point location
        +string address
        +timestamp starts_at
        +timestamp ends_at
        +string category
        +int max_attendees
        +boolean all_ages
        +timestamp created_at
    }

    class EventRSVP {
        +uuid event_id
        +uuid user_id
        +timestamp joined_at
    }

    class Beacon {
        +uuid id
        +uuid creator_id
        +string message
        +string activity
        +point location
        +string place_name
        +timestamp expires_at
        +timestamp created_at
    }

    class BeaconInterest {
        +uuid beacon_id
        +uuid user_id
        +timestamp expressed_at
    }

    class EventChat {
        +uuid id
        +uuid event_id
        +uuid sender_id
        +string message
        +timestamp sent_at
    }

    class Block {
        +uuid blocker_id
        +uuid blocked_id
        +timestamp created_at
    }

    User "1" --> "*" Event : creates
    User "1" --> "*" Beacon : creates
    User "*" --> "*" Event : RSVPs via EventRSVP
    User "*" --> "*" Beacon : interested via BeaconInterest
    Event "1" --> "*" EventChat : has messages
    User "1" --> "*" Block : blocks
```

### Data Flow — Event Discovery

```mermaid
sequenceDiagram
    participant App as React Native
    participant API as Express API
    participant DB as PostgreSQL + PostGIS

    App->>API: GET /events?lat=X&lng=Y&radius=25mi
    API->>DB: ST_DWithin(location, point, radius)
    DB-->>API: Events within radius
    API-->>App: Event list (sorted by proximity + time)

    App->>API: POST /events/:id/rsvp
    API->>DB: Insert EventRSVP
    API-->>App: RSVP confirmed
    API->>App: WS: event_chat_unlocked
```

### Data Flow — Beacon Lifecycle

```mermaid
sequenceDiagram
    participant Creator as Creator App
    participant API as Express API
    participant DB as PostgreSQL
    participant Viewer as Nearby User App

    Creator->>API: POST /beacons {message, location, activity}
    API->>DB: Insert beacon (expires_at = now + 2h)
    API-->>Creator: Beacon created

    Viewer->>API: GET /beacons?lat=X&lng=Y&radius=25mi
    API->>DB: SELECT active beacons in radius
    DB-->>API: Beacon list
    API-->>Viewer: Beacons on map

    Viewer->>API: POST /beacons/:id/interest
    API->>DB: Insert BeaconInterest
    API-->>Creator: Push notification: "Dylan is interested"

    Note over DB: Cron job expires beacons after 2 hours
```

## File Structure

```
disconnect/
├── docs/
│   ├── specs/
│   ├── designs/
│   └── tasks/
├── app/                          # React Native app
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx     # Tab navigator + auth flow
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── PhoneEntryScreen.tsx
│   │   │   │   ├── VerifyCodeScreen.tsx
│   │   │   │   └── CreateProfileScreen.tsx
│   │   │   ├── events/
│   │   │   │   ├── EventListScreen.tsx
│   │   │   │   ├── EventDetailScreen.tsx
│   │   │   │   ├── CreateEventScreen.tsx
│   │   │   │   └── EventChatScreen.tsx
│   │   │   ├── beacons/
│   │   │   │   ├── BeaconMapScreen.tsx
│   │   │   │   └── CreateBeaconScreen.tsx
│   │   │   └── profile/
│   │   │       ├── ProfileScreen.tsx
│   │   │       └── EditProfileScreen.tsx
│   │   ├── components/
│   │   │   ├── EventCard.tsx
│   │   │   ├── BeaconPin.tsx
│   │   │   ├── InterestTag.tsx
│   │   │   ├── ScreenTimeNudge.tsx
│   │   │   └── AgeGate.tsx
│   │   ├── hooks/
│   │   │   ├── useLocation.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useScreenTime.ts
│   │   │   └── useWebSocket.ts
│   │   ├── services/
│   │   │   ├── api.ts                # Axios/fetch client
│   │   │   ├── auth.ts
│   │   │   ├── events.ts
│   │   │   ├── beacons.ts
│   │   │   └── notifications.ts
│   │   ├── store/
│   │   │   ├── authStore.ts          # Zustand stores
│   │   │   ├── eventStore.ts
│   │   │   └── beaconStore.ts
│   │   ├── utils/
│   │   │   ├── location.ts
│   │   │   ├── time.ts
│   │   │   └── age.ts
│   │   └── constants/
│   │       ├── categories.ts
│   │       └── interests.ts
│   └── assets/
├── server/                        # Node.js API
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts               # Express app entry
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── env.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification
│   │   │   ├── ageGate.ts         # Minor restriction middleware
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── events.ts
│   │   │   ├── beacons.ts
│   │   │   ├── users.ts
│   │   │   └── blocks.ts
│   │   ├── services/
│   │   │   ├── sms.ts             # Twilio integration
│   │   │   ├── push.ts            # FCM/APNs
│   │   │   └── storage.ts         # S3/R2 uploads
│   │   ├── models/
│   │   │   ├── user.ts
│   │   │   ├── event.ts
│   │   │   ├── beacon.ts
│   │   │   └── block.ts
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users.ts
│   │   │   │   ├── 002_create_events.ts
│   │   │   │   ├── 003_create_beacons.ts
│   │   │   │   ├── 004_create_event_chat.ts
│   │   │   │   └── 005_create_blocks.ts
│   │   │   └── seed.ts
│   │   ├── ws/
│   │   │   └── chatHandler.ts     # WebSocket for event chat
│   │   └── jobs/
│   │       ├── expireBeacons.ts   # Cron: expire old beacons
│   │       └── archiveChats.ts    # Cron: delete chats 24h after event
│   └── tests/
└── shared/                        # Shared types between app & server
    ├── package.json
    └── src/
        ├── types.ts
        ├── categories.ts
        └── interests.ts
```

## Key Implementation Details

### Database Schema (PostgreSQL + PostGIS)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_hash VARCHAR(64) UNIQUE NOT NULL,  -- bcrypt hash, never stored raw
    first_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    bio VARCHAR(140),
    interests TEXT[] DEFAULT '{}',
    photo_url TEXT,
    approximate_location GEOGRAPHY(POINT, 4326),
    is_minor BOOLEAN GENERATED ALWAYS AS (date_of_birth > CURRENT_DATE - INTERVAL '18 years') STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address VARCHAR(200),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    category VARCHAR(30) NOT NULL,
    max_attendees INT DEFAULT 20,
    all_ages BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_rsvps (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE event_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message VARCHAR(500) NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE beacons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    message VARCHAR(140) NOT NULL,
    activity VARCHAR(50),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    place_name VARCHAR(100),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE beacon_interests (
    beacon_id UUID NOT NULL REFERENCES beacons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    expressed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (beacon_id, user_id)
);

CREATE TABLE blocks (
    blocker_id UUID NOT NULL REFERENCES users(id),
    blocked_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Spatial indexes for geo queries
CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_beacons_location ON beacons USING GIST(location);
CREATE INDEX idx_beacons_expires_at ON beacons(expires_at);
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_event_chat_event_id ON event_chat_messages(event_id);
```

### API Endpoints

#### Auth
```
POST   /api/auth/send-code        { phone }                    → { success }
POST   /api/auth/verify-code      { phone, code }              → { token, isNewUser }
POST   /api/auth/create-profile   { firstName, dob, bio, interests }  → { user }
```

#### Events
```
GET    /api/events                 ?lat&lng&radius&category     → { events[] }
POST   /api/events                { title, description, location, startsAt, category, maxAttendees, allAges }  → { event }
GET    /api/events/:id                                         → { event, attendees[], chatUnlocked }
POST   /api/events/:id/rsvp                                    → { success }
DELETE /api/events/:id/rsvp                                    → { success }
GET    /api/events/:id/chat       ?before&limit                → { messages[] }
```

#### Beacons
```
GET    /api/beacons               ?lat&lng&radius              → { beacons[] }
POST   /api/beacons               { message, activity, location, placeName }  → { beacon }
POST   /api/beacons/:id/interest                               → { success }
DELETE /api/beacons/:id                                        → { success }
```

#### Users
```
GET    /api/users/me                                           → { user }
PATCH  /api/users/me              { firstName, bio, interests } → { user }
POST   /api/users/me/photo        multipart/form-data          → { photoUrl }
GET    /api/users/me/screen-time                               → { weeklyMinutes, dailyBreakdown }
```

#### Blocks
```
POST   /api/blocks                { userId }                   → { success }
DELETE /api/blocks/:userId                                     → { success }
GET    /api/blocks                                             → { blockedUsers[] }
```

### Authentication Flow

```typescript
// JWT-based auth with short-lived access tokens + refresh tokens
// Access token: 15 min expiry, stored in memory
// Refresh token: 30 day expiry, stored in secure storage (react-native-keychain)

interface AuthTokens {
  accessToken: string;   // JWT { userId, isMinor, iat, exp }
  refreshToken: string;  // opaque, stored in Redis
}

// Phone verification flow:
// 1. Client sends phone number → API sends SMS via Twilio
// 2. Client sends code → API verifies → returns tokens
// 3. If new user → client navigates to profile creation
// 4. Profile creation includes DOB → server computes is_minor
```

### Age Gate Middleware

```typescript
// Applied to routes that minors cannot access
function requireAdult(req: Request, res: Response, next: NextFunction) {
  if (req.user.isMinor) {
    return res.status(403).json({
      error: 'age_restricted',
      message: 'You must be 18 or older to perform this action'
    });
  }
  next();
}

// Routes:
// POST /api/events        → requireAdult
// POST /api/beacons       → requireAdult
// GET  /api/events (minor) → filter to all_ages = true only
```

### Screen Time Tracking (Client-Side)

```typescript
// Track locally using AsyncStorage — no server roundtrip needed
// Record session start/end timestamps
// Calculate weekly total on the profile screen

interface ScreenTimeEntry {
  date: string;       // YYYY-MM-DD
  totalSeconds: number;
}

// Nudge logic: AppState listener starts a timer on foreground
// After 300 seconds (5 min), show the ScreenTimeNudge component
```

### WebSocket — Event Chat

```typescript
// Lightweight WS for real-time chat in event groups
// Only active while user is on the EventChatScreen
// Messages are persisted to event_chat_messages table

// Client connects: ws://api/chat?eventId=X&token=Y
// Server verifies: user has RSVP'd to event, event hasn't ended + 24h
// Message format: { type: 'message', eventId, text }
// Server broadcasts to all connected event members
```

### Geo Queries with PostGIS

```typescript
// Find events within radius (in meters)
const findEventsNearby = async (lat: number, lng: number, radiusMeters: number) => {
  return db.query(`
    SELECT e.*, ST_Distance(e.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
    FROM events e
    WHERE ST_DWithin(e.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      AND e.starts_at > NOW()
      AND e.id NOT IN (SELECT event_id FROM blocks_filter($4))
    ORDER BY e.starts_at ASC, distance ASC
    LIMIT 50
  `, [lng, lat, radiusMeters, userId]);
};
```

## Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Mobile | React Native + Expo | Cross-platform, large ecosystem, fast iteration |
| Navigation | React Navigation | Standard for RN, tab + stack navigators |
| State | Zustand | Minimal, no boilerplate, works well with RN |
| Maps | react-native-mapbox-gl or react-native-maps | Beacon map view |
| API | Node.js + Express + TypeScript | Full control, Dylan's chosen stack |
| Database | PostgreSQL 16 + PostGIS 3.4 | Relational + geospatial, battle-tested |
| Cache/Sessions | Redis | Token refresh, rate limiting, WS pub/sub |
| ORM/Query | Knex.js | Lightweight query builder, good migration support |
| SMS | Twilio Verify | Purpose-built phone verification API |
| Push | Firebase Cloud Messaging + APNs | Standard push notification infrastructure |
| Storage | Cloudflare R2 | S3-compatible, free egress, cheap |
| Hosting | Railway or Render | Simple deployment, managed Postgres available |

## Configuration

### Environment Variables (Server)

```
DATABASE_URL=postgresql://user:pass@host:5432/disconnect
REDIS_URL=redis://host:6379
JWT_SECRET=<random-256-bit>
JWT_REFRESH_SECRET=<random-256-bit>
TWILIO_ACCOUNT_SID=<from-twilio>
TWILIO_AUTH_TOKEN=<from-twilio>
TWILIO_VERIFY_SERVICE_SID=<from-twilio>
FCM_SERVER_KEY=<from-firebase>
APNS_KEY_ID=<from-apple>
R2_BUCKET=disconnect-uploads
R2_ACCESS_KEY=<from-cloudflare>
R2_SECRET_KEY=<from-cloudflare>
```

## Testing Strategy

- **Unit tests**: Service layer logic (age calculation, radius conversion, beacon expiry)
- **Integration tests**: API endpoints with a test database (real PostGIS queries)
- **E2E tests**: Critical flows with Detox (signup → create event → RSVP → chat)
- **Manual testing**: Map interaction, push notifications, real-device location

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low user density makes the app feel empty | High | High | Seed with events in launch city; partner with local groups; consider bot-created "suggested meetup" events initially |
| Minors meeting strangers unsafely | Medium | Critical | No solo features for minors; all-ages events only; block mechanism; v1.1 adds full reporting |
| PostGIS query performance at scale | Low | Medium | Spatial indexes; limit results to 50; paginate; cache hot queries in Redis |
| Beacon spam | Medium | Medium | Rate limit: 1 active beacon per user; require location permission to create |
| WebSocket scaling | Low | Medium | Redis pub/sub for horizontal scaling; chat is ephemeral and low-volume |

## Decisions Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|----------------------|
| PostgreSQL + PostGIS over MongoDB | Native geospatial indexing, relational integrity for RSVPs/blocks, strong ecosystem | MongoDB with 2dsphere (less relational), Supabase (less control) |
| Zustand over Redux | Minimal boilerplate, fits the app's small state surface | Redux Toolkit (overkill), Jotai (less community) |
| Knex over Prisma | Lighter weight, better PostGIS support, SQL-close query builder | Prisma (poor PostGIS support), raw pg (too manual) |
| Expo over bare RN | Faster setup, managed build service, good enough for MVP | Bare RN (more control but slower iteration) |
| Client-side screen time tracking | No privacy concern, no server cost, simpler | Server-side (unnecessary data collection, privacy risk) |
| Ephemeral chats (auto-delete) | Reduces data liability, aligns with "disconnect" philosophy | Persistent chats (against brand, storage cost, safety risk) |

## References

- Specification: `docs/specs/rfc-disconnect-mvp.md`
- PostGIS documentation: https://postgis.net/documentation/
- Twilio Verify API: https://www.twilio.com/docs/verify/api
- React Navigation: https://reactnavigation.org/
