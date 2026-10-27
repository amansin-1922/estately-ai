-- Run AFTER your Phase 2 RLS policies are working.
-- Adds nullable AI review fields without altering existing lead ownership or RLS.
-- This migration is repeatable. It does not send data to any AI provider.
alter table public.leads add column if not exists ai_priority text;
alter table public.leads add column if not exists ai_summary text;
alter table public.leads add column if not exists ai_questions jsonb;
alter table public.leads add column if not exists ai_next_step text;
alter table public.leads add column if not exists ai_draft text;
alter table public.leads add column if not exists ai_analyzed_at timestamptz;

-- Existing per-user RLS policies from Phase 2 continue to apply.
-- Confirm RLS stayed on:
select relname, relrowsecurity from pg_class
where oid = 'public.leads'::regclass;
