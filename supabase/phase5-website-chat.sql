-- Estately AI Phase 5 | RUN AFTER Phase 2, 3, 4A and 4B migrations.
-- Non-destructive: creates new tables. No prior data is deleted.
-- IMPORTANT: Public chat uses a server-only Supabase secret API key.
-- It is NEVER supplied to browser clients.

create table if not exists public.public_chat_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 5 and 60),
  business_name text not null check(char_length(business_name) between 3 and 90),
  welcome_message text not null default 'Hi! Tell me about the home you are looking for.' check(char_length(welcome_message) between 5 and 350),
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id)
);

create table if not exists public.public_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  token_hash text not null unique check(char_length(token_hash) = 64),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  constraint chat_session_site_owner_fk foreign key (site_id,user_id)
    references public.public_chat_sites(id,user_id) on delete cascade
);
create index if not exists public_chat_sessions_owner_idx on public.public_chat_sessions(user_id,created_at desc);
create index if not exists public_chat_sessions_expiry_idx on public.public_chat_sessions(expires_at);

alter table public.public_chat_sites enable row level security;
alter table public.public_chat_sessions enable row level security;

-- Agents can manage only their own public chatbot configuration.
revoke all on public.public_chat_sites from anon,authenticated;
grant select,insert,update on public.public_chat_sites to authenticated;
drop policy if exists website_config_select_own on public.public_chat_sites;
drop policy if exists website_config_insert_own on public.public_chat_sites;
drop policy if exists website_config_update_own on public.public_chat_sites;
create policy website_config_select_own on public.public_chat_sites for select to authenticated
using(user_id=(select auth.uid()));
create policy website_config_insert_own on public.public_chat_sites for insert to authenticated
with check(user_id=(select auth.uid()));
create policy website_config_update_own on public.public_chat_sites for update to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

-- Visitors NEVER get direct database access; all visitor actions go through
-- validated Next.js server routes with explicit tenant and session scoping.
revoke all on public.public_chat_sessions from anon, authenticated;
-- No owner SELECT policy for sessions: raw token hashes stay server-only.
-- Secret key (service_role) bypasses RLS on these tables via server API.
