-- ============================================
-- SOULYNC SCHEMA ADDON: SIMULATIONS TABLE
-- Run this AFTER supabase-schema.sql
-- ============================================

create table simulations (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  scenario_results jsonb not null default '[]',
  raw_simulations jsonb not null default '[]',
  overall_score integer check (overall_score between 0 and 100),
  created_at timestamptz default now()
);

alter table simulations enable row level security;

create policy "Users read own simulations" on simulations for select
  using (match_id in (
    select id from matches where user_a = auth.uid() or user_b = auth.uid()
  ));

create index idx_simulations_match on simulations(match_id);
