-- PHASE 4A: Safe to run AFTER Phase 2 ownership/RLS and Phase 3 AI columns.
-- Adds a private conversation log. No messages are sent to real customers.
-- Avoid storing sensitive personal details in this demo.
create table if not exists public.lead_conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('buyer','assistant')),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists lead_conversations_owner_lead_time_idx
  on public.lead_conversations (user_id, lead_id, created_at desc);
alter table public.lead_conversations enable row level security;
revoke all on public.lead_conversations from anon, authenticated;
grant select, insert on public.lead_conversations to authenticated;

drop policy if exists conversation_select_own on public.lead_conversations;
drop policy if exists conversation_insert_own on public.lead_conversations;
create policy conversation_select_own on public.lead_conversations
for select to authenticated using (
  user_id = (select auth.uid())
  and exists (select 1 from public.leads l where l.id=lead_id and l.user_id=(select auth.uid()))
);
create policy conversation_insert_own on public.lead_conversations
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.leads l where l.id=lead_id and l.user_id=(select auth.uid()))
);
-- Intentionally no UPDATE/DELETE policies for chat messages.
