# RFC: Disconnect v3 — The Mirror

| Field      | Value                  |
| ---------- | ---------------------- |
| Status     | Draft / Concept        |
| Created    | 2026-06-15             |
| Author     | Dylan                  |
| Phase      | Exploration            |
| Supersedes | `rfc-disconnect-v2.md` |

---

## The Core Insight

**People don't quit social media because the pain isn't real enough yet.**

Screen time blockers fail because they treat this as a willpower problem. It's not. It's an **awareness problem**. The frog doesn't notice it's boiling. The hours blur. The days disappear. The person you're becoming feels abstract — until suddenly it's real.

**The job of this app is to make the invisible visible, the abstract concrete, and the gradual sudden.**

It doesn't block. It doesn't restrict. It doesn't even recommend alternatives. It simply holds up a mirror that gets clearer and sharper over time — until you can't look away.

---

## What Makes This Different

| Approach                  | Opal / One Sec         | Disconnect v1/v2                  | Disconnect v3                        |
| ------------------------- | ---------------------- | --------------------------------- | ------------------------------------ |
| Core mechanism            | Block / delay          | Community + evidence              | Psychological mirror                 |
| Relationship to user      | Parental ("you can't") | Supportive ("let's try together") | Confrontational ("look at yourself") |
| Success metric            | Minutes reduced        | Sessions completed                | Awareness moments                    |
| What user feels           | Restricted             | Empowered                         | Uncomfortable (then free)            |
| Why it works (or doesn't) | Easy to bypass         | Requires social coordination      | Hard to ignore your own data         |

**The key shift:** We're not selling "less screen time." We're selling **clarity about the price you're already paying.**

---

## Core Mechanisms

### 1. The Inventory (Loss Framing)

**What it does:** Calculates and displays what screen time is actually costing you — in concrete, personal terms.

**How it works:**

- During onboarding, user inputs:
  - Age
  - Goals/aspirations (learn guitar, get fit, write a book, start a business, etc.)
  - How much time they spend on social media per day (auto-detected or self-reported)
- The app shows:
  - **Time lost this week** → "You've spent 14 hours on TikTok. That's a full waking day."
  - **Time lost this year** → "At this rate: 728 hours. 30 full days. A month of your life, gone."
  - **Time lost by 30** → "You're 22. By 30, you'll have spent 2.4 years scrolling. What could you have built with 2.4 years?"
  - **Opportunity cost** → "You said you wanted to learn guitar. At 10,000 hours to mastery, you're 7% of the way there. Or you could keep scrolling and hit 0%."

**The psychological hook:** Losses feel worse than gains feel good. A year of scrolling sounds abstract. "2.4 years of your one life" feels like a death.

**Adaptive escalation:**

- Week 1: Daily totals only
- Week 3: Weekly aggregates
- Week 6: Lifetime projections + opportunity cost calculations
- Week 10+: Comparison to peers/role models ("The average CEO reads 60 books/year. You've spent 3 years watching other people's lives.")

---

### 2. The Pattern Recognition (Self-Awareness)

**What it does:** Shows users their own behavior patterns — when they reach for their phone, what triggers them, what they feel afterwards.

**How it works:**

- Impulse gate (v2 concept, but reframed):
  - When user opens a trigger app, overlay appears: "Before you scroll — what are you feeling?"
  - Options: bored / anxious / lonely / tired / procrastinating / habit / other
  - No blocking — just the question
- After scrolling session:
  - App checks in: "How do you feel now?" (1-5 scale)
  - Optional: "What did you actually get from that?"

- Over time, the app builds a pattern map:
  - "You reach for TikTok most between 10pm-midnight, usually when 'anxious'. You rate your mood 2.1/5 after those sessions."
  - "You open Instagram 40% more on weekdays than weekends. The reason is usually 'procrastinating'."
  - "Your average mood after scrolling: 2.4/5. Your average mood after going 3+ hours without: 4.1/5."

**The psychological hook:** The data speaks for itself. No preaching needed. "You keep doing something that makes you feel worse. Why?"

**Adaptive escalation:**

- Early: Neutral data presentation
- Later: Pattern calls-out: "You've opened Instagram 8 times today. 6 of those were 'procrastinating'. Your mood after: 2/5. What are you avoiding?"

---

### 3. The Future Self Visualization

**What it does:** Makes the trajectory feel real. Who are you becoming?

**How it works:**

- The app maintains a dynamic "future self" projection based on current behavior:
  - If nothing changes, who will you be in 5 years? 10 years?
  - What skills will you have? What will you have created? Who will your friends be?
- Visualization options:
  - **Text narrative**: "In 2031, you'll be 31. You'll have spent 3.2 years scrolling. You'll have no significant creative output. You won't remember most of what you watched."
  - **Comparison mode**: "Someone who spent 2 hours/day practicing a skill instead of scrolling would, by 2031, have 4,380 hours of practice. They'd be in the top 1%. You'd be... the same as today."
  - **AI-generated portrait**: (If we want to go there) An image of a tired, distracted person scrolling vs an image of an engaged, present person doing something real

**The psychological hook:** Humans are bad at imagining future consequences. Make it visual. Make it visceral.

**Adaptive escalation:**

- Starts as a "by the numbers" projection
- Becomes more personal and narrative over time
- Eventually shows side-by-side: "You now" vs "You if nothing changes" vs "You if you changed today"

---

### 4. The Identity Confrontation

**What it does:** Uses the gap between who users say they are and how they act to create cognitive dissonance.

**How it works:**

- During onboarding and periodically:
  - "What matters to you?" (creativity, relationships, health, ambition, etc.)
  - "What kind of person do you want to be?"
- The app tracks how time spent aligns with stated values:
  - "You said 'creativity' matters to you. This week you spent 0 hours creating, 21 hours consuming."
  - "You said you want to be 'ambitious'. You've spent 2 hours on your goals, 18 hours watching other people pursue theirs."
  - "You said 'health' is a priority. You scrolled instead of sleeping 4 times this week."

**The psychological hook:** The discomfort of seeing yourself as a hypocrite is more powerful than any external judgment. The app doesn't accuse — it just shows.

**Adaptive escalation:**

- Early: Gentle noticing ("Just tracking how you spend time vs what you care about")
- Later: Direct confrontation ("You've told us 5 times that 'relationships' matter. You've spent 30 hours on your phone and 0 hours with friends this week. Which is true — your words or your actions?")

---

### 5. The Social Reality Check

**What it does:** Anonymous comparison to others — where do you actually stand?

**How it works:**

- The app collects anonymized data across users and shows:
  - "You're in the top 15% for screen time. That's not a good thing."
  - "People who reduced their screen time by 2+ hours/day reported 40% higher mood scores within 2 weeks."
  - "The average user has reclaimed 14 hours/week. You're still at baseline."

- Optional: Comparison to aspirational groups
  - "The average entrepreneur reads 50 books/year."
  - "Elite athletes spend 0 hours on social media during training season."
  - "Top performers in your age bracket spend 70% less time on social apps than you do."

**The psychological hook:** Status anxiety works. "Everyone else is ahead of me" is a motivator.

**Adaptive escalation:**

- Starts with neutral averages
- Becomes more pointed: "You're spending more time on your phone than 85% of users. Is that who you want to be?"

---

## The Adaptive Voice

The app's personality evolves based on:

- How long you've been using it
- Whether you're changing or staying the same
- Your own stated goals and values

| Phase         | Tone            | Example Message                                                                                                                                                     |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Week 1-2**  | Gentle observer | "Noticing you opened Instagram 12 times today."                                                                                                                     |
| **Week 3-4**  | Curious analyst | "You open TikTok most around 10pm, usually when 'anxious'. Your mood after averages 2.1/5. Curious pattern."                                                        |
| **Week 5-8**  | Direct mirror   | "You've spent 42 hours scrolling this month. Your goals remain unchanged. What would have to change for you to care?"                                               |
| **Week 9-12** | Confronter      | "You've said 'I'll start tomorrow' 8 times. We're at day 60. When is tomorrow?"                                                                                     |
| **Week 12+**  | Existential     | "You're 24. You've now spent ~1.5 years of your waking life on social media. You'll never get that back. But you get to choose what happens to the next 1.5 years." |

**Key principle:** The app earns the right to be more direct by building trust through accurate observation first.

---

## What This Is NOT

- **NOT a screen time blocker** — we don't prevent you from doing anything
- **NOT a guilt generator** — we don't shame, we just reflect
- **NOT a community platform** — this is personal, between you and your own data
- **NOT a wellness app** — we're not trying to make you feel good, we're trying to make you see clearly

---

## Core Features

### 1. App Blocking with Friction

**What gets locked:** User-designated distracting apps (Instagram, TikTok, YouTube, etc.)

**What stays unlocked:** Phone app, Messages/Texts, Emergency services (always accessible)

**The Break Flow (Combined Friction Model):**

1. **The Pause** (5 seconds)
   - User taps to break early
   - Prompt appears: "What do you need right now?"
   - User must type a few words (no multiple choice)
   - Creates cognitive pause before action

2. **The Mirror** (instant)
   - After typing, one stat appears from their data:
   - "You've broken 3 times today. Average mood after: 2/5."
   - Gentle nudge, reality check, not preaching

3. **The Countdown** (10 seconds)
   - 10 second countdown begins
   - Can cancel anytime → no break recorded, app stays locked
   - Let it finish → app unlocks, break logged

4. **The Cost** (shown during countdown)
   - "Breaking will reset your 8-day streak."
   - Optional but powerful — gives user something to lose

**Total friction time:** ~15-20 seconds
**Goal:** Enough time for impulse to fade, not enough to feel punishing

**Emergency Kill Switch:** Always available — one tap, instant unlock, no friction. But logged and reviewed later. "You've used the emergency break 7 times this week. Is something wrong?"

---

### 2. The Alternatives ("Instead")

**Principle:** Replace, don't just restrict. Suggest something better to do in the moment of impulse.

**Personalization:** During onboarding, user selects 2-3 areas:

- Read
- Exercise
- Create (write, draw, code, etc.)
- Learn (language, instrument, skill)
- Connect (friends, family)
- Be outside
- Other (custom)

**When suggestions appear:**

- When impulse is detected (proactive)
- During break countdown (intervention)
- "I'm bored" button in app (on-demand)

**Types of suggestions:**

1. **Quick Wins (under 10 min)**
   - "Stretch for 5 minutes"
   - "Text a friend you haven't talked to this week"
   - "Drink water and take 10 deep breaths"
   - "Write one sentence about today"
   - "Go outside for 5 minutes"

2. **Goal-Aligned Suggestions**
   - "You wanted to read more. 10 minutes = finish the chapter."
   - "Your guitar is 10 feet away. 15 minutes of practice."
   - "You said you want to learn Spanish. Duolingo exists." (non-blocking, non-addictive apps)

3. **Hobby Discovery**
   - "You've never tried: sketching"
   - "You've never tried: journaling"
   - "You've never tried: cooking a new recipe"

4. **Progress Reminders**
   - "You've read 47 pages this week. Keep going."
   - "You practiced 3 times this week. Streak continues."

---

### 3. The Inventory (Loss Framing)

**What it does:** Calculates and displays what screen time costs in concrete, personal terms.

**Onboarding inputs:**

- Age
- Goals/aspirations
- Daily screen time (detected or self-reported)

**What user sees:**

- Time lost this week → "You've spent 14 hours on TikTok. That's a full waking day."
- Time lost this year → "At this rate: 728 hours. 30 full days."
- Time lost by age 30 → "You're 22. By 30, you'll have spent 2.4 years scrolling."
- Opportunity cost → "You said you wanted to learn guitar. At this rate, you'll hit 0% progress."

**Adaptive escalation:**

- Week 1: Daily totals
- Week 3: Weekly aggregates
- Week 6: Lifetime projections + opportunity costs
- Week 10+: Comparison to aspirational peers

---

### 4. Pattern Recognition (Self-Awareness)

**What it does:** Tracks behavior patterns — when, why, and how user reaches for their phone.

**Impulse Gate (reframed):**

- When user opens a trigger app, overlay appears: "What are you feeling?"
- Options: bored / anxious / lonely / tired / procrastinating / habit / other
- No blocking — just the question

**After scrolling session:**

- App checks in: "How do you feel now?" (1-5 scale)
- Optional: "What did you get from that?"

**Pattern insights (over time):**

- "You reach for TikTok most between 10pm-midnight when 'anxious'. Mood after: 2.1/5."
- "Your average mood after scrolling: 2.4/5. After 3+ hours without: 4.1/5."

---

### 5. Future Self Visualization

**What it does:** Makes the trajectory feel real.

**Visualization modes:**

- Text narrative: "In 2031, you'll be 31. You'll have spent 3.2 years scrolling."
- Comparison: "Someone who practiced 2 hours/day instead would have 4,380 hours by 2031."
- Portrait concept: [future enhancement if needed]

---

### 6. Identity Confrontation

**What it does:** Shows gap between stated values and actual behavior.

**Onboarding:** "What matters to you?" (creativity, relationships, health, ambition, etc.)

**Confrontation:**

- "You said 'creativity' matters. This week: 0 hours creating, 21 hours consuming."
- "You said you want to be 'ambitious'. 2 hours on goals, 18 hours watching other people pursue theirs."

---

### 7. Adaptive Voice

**Principle:** The app earns the right to be confrontational by building trust through accurate observation.

**Phase 1 (Days 1-7): Gentle but pointed**

- "Noticing you opened Instagram 12 times today."

**Phase 2 (Weeks 2-4): Direct mirror**

- "You've spent 42 hours scrolling this month. Your goals remain unchanged. What would have to change for you to care?"

**Phase 3 (Weeks 5-8): Confronter**

- "You've said 'I'll start tomorrow' 8 times. We're at day 60. When is tomorrow?"

**Phase 4 (Week 12+): Existential**

- "You're 24. You've spent ~1.5 years of your waking life on social media. You'll never get that back. But you choose what happens next."

---

## Resolved Questions

1. **How do we get accurate screen time data?**
   - iOS Screen Time API is limited but usable
   - Android is more permissive
   - For MVP: Self-reporting during onboarding + passive tracking where available

2. **What's the friction mechanism?**
   - Combined approach: Pause → Mirror → Countdown → Cost
   - Phone and texts ALWAYS unlocked (safety/communication preserved)
   - Friction only applies to designated distracting apps (social media, entertainment)

3. **Do we need a social element?**
   - No — this is personal, between you and your own data
   - Optional future: accountability partner for weekly summaries

4. **What's the business model?**
   - TBD — might not fit subscription model since successful users "graduate"
   - Consider: one-time purchase, lifetime tier, or free with ethical limits

5. **How do we measure success?**
   - Awareness moments — times user paused and chose differently
   - Self-reported clarity (pre/post)
   - Retention of habit change (do users maintain lower screen time after "graduating"?)

---

## Early Hypothesis

**If we can make the invisible costs of screen time visible enough, persistent enough, and personal enough — people will change on their own.**

No blocking needed. No community coordination needed. Just truth, repeatedly, in a way that's harder to ignore than to confront.

The app succeeds when the user no longer needs it — because they've internalized the mirror.

---

## Next Steps

1. Validate concept with user interviews
   - Would this feel helpful or invasive?
   - What level of confrontation is too much?
   - What would make someone keep opening an app that makes them uncomfortable?

2. Prototype the "Inventory" experience
   - Write the copy for loss-framing calculations
   - Test different ranges (daily vs weekly vs lifetime projections)
   - Find the threshold where it feels "too real" vs "easy to dismiss"

3. Research technical feasibility
   - How much data can we actually get on iOS/Android?
   - What are the permission/privacy implications?
   - Can we do meaningful pattern detection with limited data?

4. Explore the adaptive voice
   - Write example messages for each phase
   - Test tone with target audience
   - Map escalation triggers and boundaries

---

_"The truth will set you free. But first, it will make you miserable."_ — Attributed to everyone, understood by no one until now.
