# Soulync — AI Dating Engine

> Meet in 48 hours. Not 48 messages.

Inspired by Black Mirror S4E4 "Hang the DJ". AI conducts deep psychological interviews, generates personality profiles, finds your best match, and arranges the date. No swiping. No chat before meeting.

---

## Quick Start (30 minutes to running app)

### Step 1: Get your API keys

**OpenAI** (5 min):
1. Go to https://platform.openai.com
2. Sign up / log in
3. Navigate to API Keys → Create new secret key → Copy it
4. Go to Billing → Add $5 credit

**Supabase** (10 min):
1. Go to https://supabase.com → Start your project
2. Create a new project (name: "soulync", pick a strong password)
3. Wait for project to initialize (~2 min)
4. Go to Project Settings → API:
   - Copy `Project URL` → this is your SUPABASE_URL
   - Copy `anon/public` key → this is your ANON_KEY
   - Copy `service_role` key → this is your SERVICE_ROLE_KEY
5. Go to SQL Editor → paste the entire contents of `supabase-schema.sql` → Run

### Step 2: Set up the project

```bash
# Clone or copy the project files
cd soulync

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your keys from Step 1

# Run locally
npm run dev
```

Open http://localhost:3000 — you should see the Soulync welcome screen.

### Step 3: Deploy to Vercel (free)

1. Push code to a GitHub repo
2. Go to https://vercel.com → Import project → Select your repo
3. Add environment variables (same as .env.local)
4. Deploy — your app is live at `your-project.vercel.app`

---

## Architecture

```
User Journey:
Welcome → Sign Up → AI Round 1 (icebreaker) → AI Round 2 (attachment)
→ Psych Profile → AI Match → Date Plans → Confirm → Check-in → Chat Unlocked

Tech Stack:
├── Next.js 14 (React, App Router)
├── Supabase (PostgreSQL, Auth, Realtime)
├── OpenAI GPT-4o-mini (AI interviews, matching, planning)
└── Vercel (hosting, serverless functions)
```

## File Structure

```
soulync/
├── app/
│   ├── page.tsx              # Main app (all screens)
│   ├── layout.tsx            # HTML layout + PWA meta
│   └── api/
│       ├── chat/route.ts     # AI psychological interview
│       ├── match/route.ts    # AI compatibility matching
│       ├── date-plans/route.ts  # Generate & select date plans
│       └── checkin/route.ts  # Verify meeting, unlock chat
├── lib/
│   ├── ai-prompts.ts         # All AI system prompts
│   ├── openai.ts             # OpenAI client (swappable to Alibaba)
│   └── supabase.ts           # Database client
├── supabase-schema.sql       # Complete database schema
├── .env.example              # Environment variable template
└── package.json
```

## 10-Day Roadmap

| Day | Task | Status |
|-----|------|--------|
| 1-2 | Core setup + AI interview engine | ✅ Done |
| 3 | Date preferences collection UI | 🔲 Next |
| 4 | AI matching refinement + testing | 🔲 |
| 5 | Date plan UI + selection flow | 🔲 |
| 6 | Push notifications (OneSignal) | 🔲 |
| 7 | Check-in + chat unlock | 🔲 |
| 8 | Post-date feedback form | 🔲 |
| 9 | UI polish, testing, PWA icons | 🔲 |
| 10 | Deploy + seed test users | 🔲 |

## Switching to China Market

Change one line in `.env.local`:
```
AI_PROVIDER=china
DASHSCOPE_API_KEY=your-alibaba-key
```

The app will automatically use Alibaba Cloud's Qwen model instead of OpenAI. All prompts work in both languages.

## Cost Estimate (MVP)

| Item | Cost |
|------|------|
| Supabase (free tier) | $0 |
| Vercel (free tier) | $0 |
| OpenAI API (100 users) | ~$2 |
| **Total** | **~$2** |
