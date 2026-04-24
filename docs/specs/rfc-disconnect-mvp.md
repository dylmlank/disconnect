# RFC: Disconnect — MVP

| Field        | Value                          |
|-------------|--------------------------------|
| Status      | Draft                          |
| Created     | 2026-04-21                     |
| Author      | Dylan                          |
| Phase       | Specification                  |

## Summary

Disconnect is a mobile app that uses technology as a bridge to offline living. It connects like-minded people who want to spend less time on screens and more time in the real world. The MVP focuses on two core features: local events/meetups and a neighborhood hub for spontaneous real-world hangouts. The app is designed to be opened briefly and closed quickly — a tool, not a destination.

## Problem Statement

Social media platforms are engineered to maximize screen time. The result is a generation (Gen Z and Gen Alpha) that is more digitally connected yet more socially isolated than ever. People who want to break free from this cycle have no good way to find others who share that goal. Existing social apps — even those promoting "real" connection — still rely on engagement loops, infinite feeds, and notifications that keep users glued to their phones.

There is no app that is intentionally designed to get people *off* the app and into the world.

## Goals

- **G1:** Enable users to discover and join real-world events and activities within their city (5-25 mile radius)
- **G2:** Allow spontaneous, hyper-local connection ("I'm at the park, come hang")
- **G3:** Minimize in-app screen time — the best user session is under 2 minutes
- **G4:** Build trust and safety, especially for users under 18
- **G5:** Reach 1,000 active users in the first target city within 3 months of launch

## Non-Goals

The following are explicitly **out of scope** for MVP:

- **1-on-1 matching / friend pairing** — v2 feature, requires user base density
- **Screen-free challenges** — v2 feature, requires community engagement infrastructure
- **Web app** — Phase 2 platform, React Native mobile first
- **Monetization** — no paid features, subscriptions, or ads in MVP
- **Direct messaging between strangers** — too risky with minors in the user base; communication happens through event/group context only
- **Content creation / posting / feeds** — this is not a social media app
- **Algorithm-driven recommendations** — no engagement optimization

## User Stories / Requirements

### Functional Requirements

#### Authentication & Profile

- **REQ-1**: Users sign up with phone number via SMS verification — *Must have*
- **REQ-2**: Users provide date of birth for age verification at signup — *Must have*
- **REQ-3**: Users under 18 are flagged and receive a restricted experience (no solo meetup creation, visible "minor" safety indicator to event hosts) — *Must have*
- **REQ-4**: Users create a minimal profile: first name, age, bio (140 char max), 2-3 interests selected from a curated list — *Must have*
- **REQ-5**: Users can optionally add a profile photo — *Should have*

#### Events & Meetups

- **REQ-6**: Users can create an event with: title, description, location (map pin or address), date/time, category (from curated list), max attendees — *Must have*
- **REQ-7**: Users can browse events near them sorted by proximity and time — *Must have*
- **REQ-8**: Users can filter events by category (e.g., outdoors, coffee, sports, games, study, creative) — *Must have*
- **REQ-9**: Users can RSVP to an event (join/leave) — *Must have*
- **REQ-10**: Event creators can see who has RSVP'd — *Must have*
- **REQ-11**: Events have a group chat that activates when 2+ people join and auto-archives 24 hours after the event ends — *Must have*
- **REQ-12**: Under-18 users cannot create events — only join events marked as "all ages" by the creator — *Must have*

#### Neighborhood Hub (Spontaneous Hangouts)

- **REQ-13**: Users can post a "beacon" — a short-lived invite ("I'm at [place], doing [activity], come join") that expires after 2 hours — *Must have*
- **REQ-14**: Beacons show on a map view within the user's city radius — *Must have*
- **REQ-15**: Users can tap a beacon to express interest (single tap, no messaging) — the beacon creator sees who's interested — *Must have*
- **REQ-16**: Under-18 users cannot create beacons but can view them — *Must have*

#### Anti-Screen-Time Design

- **REQ-17**: No infinite scroll anywhere in the app — all lists are finite and short — *Must have*
- **REQ-18**: The app tracks and displays the user's weekly in-app screen time as a "low score" badge (e.g., "You spent 12 minutes in Disconnect this week") — *Should have*
- **REQ-19**: After 5 minutes of continuous use, a gentle nudge appears: "You've been here a while. Pick something and go." — *Should have*
- **REQ-20**: No push notifications except: event reminders (1 hour before), beacon interest alerts, and event chat messages — *Must have*

#### Location

- **REQ-21**: Users grant location permission to see nearby events and beacons — *Must have*
- **REQ-22**: Location is used for proximity calculations only — exact coordinates are never shown to other users — *Must have*
- **REQ-23**: Default discovery radius is city-level (25 miles / 40 km), adjustable down to 5 miles — *Should have*

### Non-Functional Requirements

#### Performance
- App should load the event list within 2 seconds on a 4G connection
- Map view should render beacons within 1 second of opening
- SMS verification should complete within 10 seconds

#### Security & Privacy
- Phone numbers are never exposed to other users
- Location data is stored as approximate (city-block level) not exact coordinates
- All API communication over HTTPS
- Under-18 user data receives additional protections (no public profile visibility outside events they've joined)
- Group chats are ephemeral — auto-deleted 24 hours after event ends

#### Scalability
- Architecture should support 10,000 concurrent users in a single city
- Event and beacon data should be efficiently queryable by geographic radius

#### Accessibility
- Minimum AA contrast ratios
- Screen reader compatible navigation
- Support for system font size preferences

## Impact Analysis

### Affected Systems

| System/Component | Impact Type | Description |
|-----------------|-------------|-------------|
| Mobile App (React Native) | New | Full client application |
| REST API (Node.js/Express) | New | Backend API server |
| PostgreSQL + PostGIS | New | Primary database with geospatial queries |
| SMS Gateway (Twilio) | New Integration | Phone verification |
| Push Notifications (FCM/APNs) | New Integration | Event reminders and alerts |
| Map Provider (Mapbox or Google Maps) | New Integration | Event/beacon map display |
| Object Storage (S3/Cloudflare R2) | New Integration | Profile photo storage |

### Dependencies

- **Twilio or equivalent** — phone-based SMS auth requires a provider. Cost scales with signups (~$0.01/SMS).
- **PostGIS** — PostgreSQL extension for geospatial indexing. Required for efficient radius queries on events and beacons.
- **Map SDK** — Mapbox (free tier: 50K loads/month) or Google Maps for the beacon map view.
- **Push notification service** — Firebase Cloud Messaging (Android) + Apple Push Notification Service (iOS).
- **Hosting** — VPS or container service (Railway, Render, or AWS EC2) for the Node.js API + managed PostgreSQL.

## Success Criteria

- [ ] A user can sign up with their phone number and create a profile in under 60 seconds
- [ ] A user can create an event and have it appear on other users' event lists within their city
- [ ] A user can RSVP to an event and enter the event group chat
- [ ] A user can post a beacon that appears on the map for nearby users and expires after 2 hours
- [ ] Under-18 users are restricted from creating events/beacons and can only join "all ages" events
- [ ] No screen in the app uses infinite scroll
- [ ] Event group chats auto-archive 24 hours after the event ends
- [ ] The app displays weekly screen time and nudges users after 5 minutes of continuous use

## Resolved Decisions

- **D-1**: Minimum age is **13+**. Under-13 blocked at signup. 13-17 get restricted experience. Avoids COPPA.
- **D-2**: **Block-only** safety mechanism in MVP. Users can block others (hides from view). Full reporting system in v1.1.
- **D-3**: Event categories are **hardcoded** for MVP (outdoors, coffee, sports, games, study, creative, food, music, volunteering).
- **D-4**: Beacon creators see **names + count** of interested users.
- **D-5**: Target audience is **Gen Z (18-25) and Gen Alpha (13-17)** with age-appropriate restrictions.

## Open Questions

- **OQ-1**: What is the first target city for launch? — *Unresolved* (affects beta testing strategy)

## References

- Project memory: `~/.claude/projects/-home-dylan/memory/project_focus_social_app.md`
- Design philosophy: App is a tool, not a destination. No feeds, no infinite scroll, time-limited interactions, nudge users outward.
