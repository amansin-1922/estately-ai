-- PHASE 2: Run in Supabase Dashboard > SQL Editor.
-- IMPORTANT: Existing public.leads table should be EMPTY before running this script.
-- This demo uses per-account ownership, not shared organizational access.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text not null,
  city text,
  budget text,
  property_type text,
  source text,
  interest text,
  status text not null default 'New',
  note text default '',
  created_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- The NOT NULL rule prevents unowned rows; it needs an empty table or pre-assigned owners.
alter table public.leads alter column user_id set not null;

create index if not exists leads_owner_created_idx
  on public.leads (user_id, created_at desc);

alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;
grant select, insert, update, delete on table public.leads to authenticated;

drop policy if exists "lead_select_own" on public.leads;
drop policy if exists "lead_insert_own" on public.leads;
drop policy if exists "lead_update_own" on public.leads;
drop policy if exists "lead_delete_own" on public.leads;

create policy "lead_select_own"
on public.leads for select to authenticated
using ((select auth.uid()) = user_id);

create policy "lead_insert_own"
on public.leads for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "lead_update_own"
on public.leads for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "lead_delete_own"
on public.leads for delete to authenticated
using ((select auth.uid()) = user_id);
