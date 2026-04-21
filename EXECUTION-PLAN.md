# SOULYNC 灵犀 — 10-Day Execution Plan
## AI Dating Engine: Attached Theory + 36 Questions + Black Mirror

---

## Product Summary

**English**: Soulync — Meet in 48 hours. Not 48 messages.
**Chinese**: 灵犀 — 48小时内见面，而不是48条消息。

**Core Mechanism**:
1. AI conducts deep psychological interview (based on "Attached" by Amir Levine)
2. AI generates attachment-style profile + Big Five + values map
3. AI directly assigns your best match (no swiping — Black Mirror style)
4. AI arranges the date: venue, time, secret phrase
5. AI generates personalized "12 Questions" for your date (based on Arthur Aron's 36 Questions)
6. Users meet, go through 12 Questions + 4-min eye contact, check in
7. Chat unlocks after meeting. AI learns from feedback.

**Tech Stack**: Next.js + Supabase + DeepSeek + Vercel
**Target Market**: Global (English + Chinese bilingual)
**AI Model**: DeepSeek V4 (default), swappable to OpenAI or Alibaba Cloud
**Cost**: $0 to launch (all free tiers)

---

## 10-Day Breakdown

### Day 1-2: Foundation
**Goal**: App skeleton running locally or on Vercel

Tasks:
- [ ] Register GitHub account
- [ ] Register Supabase → create project "soulync"
- [ ] Run `supabase-schema.sql` in SQL Editor
- [ ] Run `supabase-schema-questions.sql` in SQL Editor
- [ ] Register DeepSeek → get API key from platform.deepseek.com
- [ ] Register Vercel → import GitHub repo → add env vars → deploy
- [ ] Verify: app loads at soulync.vercel.app

Deliverable: Live URL with welcome screen

### Day 3-4: AI Interview Engine
**Goal**: User can complete 2-round psychological interview

Tasks:
- [ ] Test Round 1 AI conversation (icebreaker questions)
- [ ] Test Round 2 AI conversation (attachment & conflict)
- [ ] Verify psych profile JSON is generated correctly
- [ ] Verify profile is saved to `psych_profiles` table
- [ ] Test bilingual (English and Chinese responses)
- [ ] Tune prompts: adjust warmth, question depth, response length

Key files:
- `lib/ai-prompts.ts` — Round 1 & 2 system prompts, analysis prompt
- `app/api/chat/route.ts` — conversation handler

### Day 5-6: Matching + Date Arrangement
**Goal**: AI assigns match, generates date plans and 12 Questions

Tasks:
- [ ] Create 2+ test user profiles with different attachment styles
- [ ] Test matching algorithm (verify anxious+avoidant is blocked)
- [ ] Test date plan generation (3 venue options)
- [ ] Test 12 Questions generation (verify personalization)
- [ ] Test plan selection flow (both users pick → confirmation)
- [ ] Add 48-hour expiration countdown UI

Key files:
- `app/api/match/route.ts` — matching engine
- `app/api/date-plans/route.ts` — venue planning
- `app/api/date-questions/route.ts` — 12 Questions engine
- `lib/questions-engine.ts` — question pool + selection prompt

### Day 7: Date Experience
**Goal**: In-app guided date experience with timer

Tasks:
- [ ] Build "Date Mode" screen:
  - Shows 1 question at a time
  - Timer per question (2.5 min each)
  - "Next" button to advance
  - 3 sets visually distinguished (light → medium → deep)
  - After Q12: 4-minute eye contact timer with ambient animation
- [ ] Build check-in flow ("I'm here" button)
- [ ] Test chat unlock after both check in

### Day 8: Feedback + Learning Loop
**Goal**: Post-date feedback feeds back into AI

Tasks:
- [ ] Build feedback form (5 dimensions, 1-5 stars each):
  - Attraction
  - Conversation quality
  - Values alignment
  - Emotional safety
  - Want to meet again? (yes/no)
- [ ] Build API: `app/api/feedback/route.ts`
- [ ] After feedback, unlock partner's full psych profile
- [ ] Store feedback for future algorithm training
- [ ] AI generates personalized chat starter based on date experience

### Day 9: UI Polish + Safety
**Goal**: App feels polished, trustworthy, and safe

Tasks:
- [ ] Add safety features:
  - Date locations must be public places
  - In-app emergency contact button
  - Report user function
- [ ] PWA icons (192px and 512px)
- [ ] Loading states and error handling
- [ ] Mobile responsive testing
- [ ] Bilingual text review (all screens)

### Day 10: Launch
**Goal**: App is live and shareable

Tasks:
- [ ] Final Vercel deployment with production env vars
- [ ] Create 5-10 seed user profiles for testing
- [ ] Write landing page copy (English + Chinese)
- [ ] Prepare App Store / Google Play listing (for future)
- [ ] Create social media preview cards
- [ ] Share URL with first 10 beta testers

---

## File Structure (Complete)

```
soulync/
├── app/
│   ├── page.tsx                    # Main app UI (all screens)
│   ├── layout.tsx                  # HTML layout + PWA meta
│   └── api/
│       ├── chat/route.ts           # AI psychological interview
│       ├── match/route.ts          # Attachment-based matching
│       ├── date-plans/route.ts     # AI date arrangement
│       ├── date-questions/route.ts # 12 Questions generator
│       ├── checkin/route.ts        # Meeting verification
│       └── feedback/route.ts       # Post-date feedback (Day 8)
├── lib/
│   ├── ai-prompts.ts              # Interview + matching prompts
│   ├── questions-engine.ts        # 100+ question pool + selection AI
│   ├── openai.ts                  # DeepSeek/OpenAI/Alibaba client
│   └── supabase.ts                # Database client
├── public/
│   └── manifest.json              # PWA config
├── supabase-schema.sql            # Main database (9 tables)
├── supabase-schema-questions.sql  # 12 Questions table
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── next.config.js                 # Next.js config
└── README.md                      # Setup guide
```

---

## Cost Projection

| Item | MVP (0-100 users) | Growth (100-1000 users) | Scale (1000+) |
|------|-------------------|------------------------|---------------|
| Supabase | Free | Free | $25/mo |
| Vercel | Free | Free | $20/mo |
| DeepSeek API | Free (5M tokens) | ~$2/mo | ~$20/mo |
| Domain name | $12/year | $12/year | $12/year |
| **Total** | **$0-1/mo** | **$2-3/mo** | **$65/mo** |

---

## AI Model Strategy

| Region | Default Model | Fallback | Why |
|--------|--------------|----------|-----|
| Global | DeepSeek V4 | OpenAI GPT-4o-mini | Cheapest, strong bilingual, OpenAI-compatible API |
| China | DeepSeek V4 | Alibaba Qwen-Plus via DashScope | Native access, no VPN needed |
| Switch | Change `AI_PROVIDER` in .env.local | No code changes needed | — |

---

## Psychology Framework

### Pre-Match: "Attached" by Amir Levine
- AI identifies attachment style through behavioral scenarios (not self-report)
- 4 styles: Secure, Anxious, Avoidant, Fearful-Avoidant
- Matching rule: NEVER pair Anxious + Avoidant (the "trap")
- Also measures: Big Five personality, conflict style, love language, core values

### During Date: Arthur Aron's 36 Questions (adapted to 12)
- 3 sets of 4 questions, escalating intimacy
- AI selects from 100+ pool based on BOTH users' profiles
- Followed by 4-minute eye contact exercise
- Core mechanism: reciprocal self-disclosure creates closeness

### Post-Date: Feedback Loop
- 5-dimension rating feeds back into matching algorithm
- AI compares predicted compatibility with actual experience
- Model improves over time: more dates = smarter AI

---

## Competitive Moat

No other dating app combines all three:
1. **Attachment theory matching** (not just interests/hobbies)
2. **AI-arranged dates** (not "you figure it out")
3. **Structured intimacy building** (not awkward small talk)

This is the Black Mirror vision, but grounded in real psychology and actually buildable.
