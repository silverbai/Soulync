-- ============================================
-- SOULYNC DATABASE SCHEMA
-- Supabase (PostgreSQL) - Run this in SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. USER PROFILES
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  display_name text not null,
  age integer check (age >= 18 and age <= 100),
  gender text check (gender in ('male', 'female', 'non-binary', 'other')),
  seeking text check (seeking in ('male', 'female', 'everyone')),
  city text,
  latitude double precision,
  longitude double precision,
  locale text default 'en' check (locale in ('en', 'zh')),
  avatar_url text,
  onboarding_complete boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. AI CONVERSATION LOGS
-- ============================================
create table ai_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  round integer not null check (round in (1, 2)),  -- round 1: icebreaker, round 2: attachment
  messages jsonb not null default '[]',
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- ============================================
-- 3. PSYCHOLOGICAL PROFILES (AI-generated)
-- ============================================
create table psych_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  
  -- Big Five (1-10 scale)
  openness float check (openness between 1 and 10),
  conscientiousness float check (conscientiousness between 1 and 10),
  extraversion float check (extraversion between 1 and 10),
  agreeableness float check (agreeableness between 1 and 10),
  neuroticism float check (neuroticism between 1 and 10),
  
  -- Attachment & conflict
  attachment_style text check (attachment_style in ('secure', 'anxious', 'avoidant', 'fearful')),
  conflict_style text check (conflict_style in ('confront', 'avoid', 'compromise', 'collaborate')),
  
  -- Values (1-10 scale)
  value_family float default 5,
  value_career float default 5,
  value_adventure float default 5,
  value_stability float default 5,
  value_intimacy float default 5,
  value_independence float default 5,
  
  -- Love language
  love_language text check (love_language in ('words', 'acts', 'gifts', 'time', 'touch')),
  
  -- AI-generated summary (shown to user)
  summary_en text,
  summary_zh text,
  
  -- Raw AI analysis for matching
  raw_analysis jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 4. DATE PREFERENCES
-- ============================================
create table date_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  
  -- Availability (array of slots)
  available_slots jsonb default '[]',
  -- e.g. [{"day":"weekday_evening","start":"18:00","end":"22:00"}, {"day":"weekend","start":"10:00","end":"22:00"}]
  
  -- Location preferences
  home_lat double precision,
  home_lng double precision,
  work_lat double precision,
  work_lng double precision,
  max_travel_minutes integer default 30,
  
  -- Venue preferences
  venue_types text[] default '{"cafe","park","bookstore"}',
  
  created_at timestamptz default now()
);

-- ============================================
-- 5. MATCHES (AI-assigned)
-- ============================================
create table matches (
  id uuid default uuid_generate_v4() primary key,
  user_a uuid references profiles(id) on delete cascade not null,
  user_b uuid references profiles(id) on delete cascade not null,
  
  -- AI matching data
  compatibility_score integer check (compatibility_score between 0 and 100),
  match_reason_en text,
  match_reason_zh text,
  ai_analysis jsonb,
  
  -- Status flow: pending -> date_planning -> date_confirmed -> met -> chatting | expired
  status text default 'pending' check (status in (
    'pending', 'date_planning', 'date_confirmed', 'met', 'chatting', 'expired', 'rejected'
  )),
  
  -- Rejection tracking
  rejection_count_a integer default 0,
  rejection_count_b integer default 0,
  
  expires_at timestamptz default (now() + interval '48 hours'),
  created_at timestamptz default now(),
  
  constraint unique_match unique (user_a, user_b),
  constraint different_users check (user_a != user_b)
);

-- ============================================
-- 6. DATE PLANS (AI-generated)
-- ============================================
create table date_plans (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  
  -- Plan details
  venue_name text not null,
  venue_address text,
  venue_lat double precision,
  venue_lng double precision,
  proposed_date date not null,
  proposed_time time not null,
  duration_minutes integer default 60,
  
  -- Secret phrase for meeting
  secret_phrase_en text,
  secret_phrase_zh text,
  
  -- Responses
  response_a text check (response_a in ('accepted', 'rejected', 'pending')),
  response_b text check (response_b in ('accepted', 'rejected', 'pending')),
  
  status text default 'proposed' check (status in ('proposed', 'confirmed', 'rejected', 'completed')),
  
  created_at timestamptz default now()
);

-- ============================================
-- 7. CHECK-INS
-- ============================================
create table checkins (
  id uuid default uuid_generate_v4() primary key,
  date_plan_id uuid references date_plans(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  checked_in_at timestamptz default now(),
  
  constraint unique_checkin unique (date_plan_id, user_id)
);

-- ============================================
-- 8. MESSAGES (unlocked after meeting)
-- ============================================
create table messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- 9. POST-DATE FEEDBACK
-- ============================================
create table feedback (
  id uuid default uuid_generate_v4() primary key,
  date_plan_id uuid references date_plans(id) on delete cascade not null,
  from_user uuid references profiles(id) on delete cascade not null,
  about_user uuid references profiles(id) on delete cascade not null,
  
  attraction_score integer check (attraction_score between 1 and 5),
  conversation_score integer check (conversation_score between 1 and 5),
  values_alignment integer check (values_alignment between 1 and 5),
  meet_again boolean,
  notes text,
  
  created_at timestamptz default now(),
  constraint unique_feedback unique (date_plan_id, from_user)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table profiles enable row level security;
alter table ai_conversations enable row level security;
alter table psych_profiles enable row level security;
alter table date_preferences enable row level security;
alter table matches enable row level security;
alter table date_plans enable row level security;
alter table checkins enable row level security;
alter table messages enable row level security;
alter table feedback enable row level security;

-- Users can read/update their own profile
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

-- Users can read their own conversations
create policy "Users read own conversations" on ai_conversations for select using (auth.uid() = user_id);
create policy "Users insert own conversations" on ai_conversations for insert with check (auth.uid() = user_id);

-- Users can read their own psych profile
create policy "Users read own psych" on psych_profiles for select using (auth.uid() = user_id);

-- Users can read matches they're part of
create policy "Users read own matches" on matches for select 
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Users can read date plans for their matches
create policy "Users read own date plans" on date_plans for select 
  using (match_id in (select id from matches where user_a = auth.uid() or user_b = auth.uid()));

-- Messages only for met matches
create policy "Users read messages" on messages for select
  using (match_id in (select id from matches where (user_a = auth.uid() or user_b = auth.uid()) and status = 'chatting'));
create policy "Users send messages" on messages for insert
  with check (sender_id = auth.uid() and match_id in (select id from matches where (user_a = auth.uid() or user_b = auth.uid()) and status = 'chatting'));

-- ============================================
-- INDEXES
-- ============================================
create index idx_matches_users on matches(user_a, user_b);
create index idx_matches_status on matches(status);
create index idx_messages_match on messages(match_id, created_at);
create index idx_psych_attachment on psych_profiles(attachment_style);
create index idx_profiles_active on profiles(is_active, gender, seeking);

-- ============================================
-- REALTIME (for chat)
-- ============================================
alter publication supabase_realtime add table messages;
