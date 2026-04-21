-- ============================================
-- SOULYNC: 12 QUESTIONS TABLE
-- Run this AFTER the main schema
-- ============================================

create table date_questions (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade unique not null,
  
  -- AI-selected questions (array of 12)
  questions jsonb not null default '[]',
  
  -- Eye contact exercise prompt
  eye_contact_prompt_en text,
  eye_contact_prompt_zh text,
  
  -- Personalized date note
  date_note_en text,
  date_note_zh text,
  
  -- Progress tracking (which questions have been answered)
  current_question integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  
  created_at timestamptz default now()
);

alter table date_questions enable row level security;

create policy "Users read own date questions" on date_questions for select
  using (match_id in (
    select id from matches where user_a = auth.uid() or user_b = auth.uid()
  ));
