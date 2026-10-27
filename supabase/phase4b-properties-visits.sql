-- Estately AI Phase 4B | Apply AFTER the successful Phase 2, 3, and 4A migrations.
-- NON-DESTRUCTIVE. Existing leads, qualification data and conversations are preserved.
-- Private per-user demo, not a multi-employee shared organization schema.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null check (char_length(title) between 3 and 140),
  city text not null check (char_length(city) between 2 and 90),
  locality text not null check (char_length(locality) between 2 and 120),
  price_inr bigint not null check (price_inr between 100000 and 100000000000),
  bedrooms smallint not null check (bedrooms between 1 and 12),
  bathrooms smallint not null default 1 check (bathrooms between 1 and 20),
  area_sqft integer check (area_sqft between 100 and 100000),
  description text not null default '' check (char_length(description) <= 1200),
  amenities text[] not null default '{}',
  image_url text check (image_url is null or char_length(image_url) <= 500),
  listing_status text not null default 'Active' check (listing_status in ('Active','Paused','Sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, user_id)
);
create index if not exists properties_owner_status_idx on public.properties(user_id, listing_status, created_at desc);

create table if not exists public.property_visit_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  property_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint valid_slot_times check (ends_at > starts_at and ends_at <= starts_at + interval '6 hours'),
  constraint slot_property_owner foreign key (property_id,user_id)
    references public.properties(id,user_id) on delete cascade,
  unique (property_id, starts_at),
  unique (id, property_id, user_id)
);
create index if not exists slots_owner_time_idx on public.property_visit_slots(user_id, starts_at);

-- Serialize inserts/updates per property and reject ANY overlapping slot windows.
-- This is stricter than simply blocking two visits on the exact same slot.
create or replace function public.prevent_overlapping_property_slots()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.property_id::text, 0));
  if exists (
    select 1 from public.property_visit_slots existing
    where existing.property_id = NEW.property_id
      and existing.id <> NEW.id
      and existing.starts_at < NEW.ends_at
      and existing.ends_at > NEW.starts_at
  ) then
    raise exception 'This property already has an overlapping time slot';
  end if;
  return NEW;
end;
$$;
drop trigger if exists prevent_overlapping_slots on public.property_visit_slots;
create trigger prevent_overlapping_slots before insert or update on public.property_visit_slots
for each row execute function public.prevent_overlapping_property_slots();

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  lead_id uuid not null,
  property_id uuid not null,
  slot_id uuid not null,
  status text not null default 'Requested' check (status in ('Requested','Confirmed','Completed','Cancelled')),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visit_lead_owner foreign key (lead_id) references public.leads(id) on delete cascade,
  constraint visit_slot_property_owner foreign key (slot_id,property_id,user_id)
    references public.property_visit_slots(id,property_id,user_id) on delete restrict
);
create unique index if not exists one_live_visit_per_slot
  on public.site_visits(slot_id) where status in ('Requested','Confirmed');
create index if not exists visits_owner_created_idx on public.site_visits(user_id, created_at desc);

-- Existing leads table's Phase 2 RLS policies are retained, not replaced.
-- A prospective visit must reference a lead that belongs to the signed-in user.
-- Extra server-side check prevents cross-owner lead IDs even on elevated writes.
create or replace function public.assert_site_visit_lead_owner()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.leads l
                where l.id = NEW.lead_id and l.user_id = NEW.user_id) then
    raise exception 'Lead does not belong to this visit owner';
  end if;
  return NEW;
end;
$$;
drop trigger if exists check_site_visit_lead_owner on public.site_visits;
create trigger check_site_visit_lead_owner before insert or update on public.site_visits
for each row execute function public.assert_site_visit_lead_owner();

-- A property cannot be assigned a new site visit if marked Paused or Sold.
create or replace function public.assert_live_property_for_visit()
returns trigger language plpgsql set search_path = '' as $$
begin
 if NEW.status in ('Requested','Confirmed') and
    not exists (select 1 from public.properties p
                where p.id = NEW.property_id and p.user_id = NEW.user_id and p.listing_status = 'Active') then
    raise exception 'Property must be Active for a live visit';
 end if;
 return NEW;
end;
$$;
drop trigger if exists check_live_property_for_visit on public.site_visits;
create trigger check_live_property_for_visit before insert or update on public.site_visits
for each row execute function public.assert_live_property_for_visit();

alter table public.properties enable row level security;
alter table public.property_visit_slots enable row level security;
alter table public.site_visits enable row level security;
revoke all on public.properties,public.property_visit_slots,public.site_visits from anon,authenticated;
grant select,insert,update,delete on public.properties,public.property_visit_slots,public.site_visits to authenticated;

-- All client queries run as a validated Supabase session (no service role key).
drop policy if exists properties_select_own on public.properties;
drop policy if exists properties_insert_own on public.properties;
drop policy if exists properties_update_own on public.properties;
drop policy if exists properties_delete_own on public.properties;
create policy properties_select_own on public.properties for select to authenticated
using (user_id = (select auth.uid()));
create policy properties_insert_own on public.properties for insert to authenticated
with check (user_id = (select auth.uid()));
create policy properties_update_own on public.properties for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy properties_delete_own on public.properties for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists slots_select_own on public.property_visit_slots;
drop policy if exists slots_insert_own on public.property_visit_slots;
drop policy if exists slots_update_own on public.property_visit_slots;
drop policy if exists slots_delete_own on public.property_visit_slots;
create policy slots_select_own on public.property_visit_slots for select to authenticated
using (user_id = (select auth.uid()));
create policy slots_insert_own on public.property_visit_slots for insert to authenticated
with check (user_id = (select auth.uid()));
create policy slots_update_own on public.property_visit_slots for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy slots_delete_own on public.property_visit_slots for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists visits_select_own on public.site_visits;
drop policy if exists visits_insert_own on public.site_visits;
drop policy if exists visits_update_own on public.site_visits;
drop policy if exists visits_delete_own on public.site_visits;
create policy visits_select_own on public.site_visits for select to authenticated
using (user_id = (select auth.uid()));
create policy visits_insert_own on public.site_visits for insert to authenticated
with check (user_id = (select auth.uid()) and
  exists(select 1 from public.leads l where l.id=lead_id and l.user_id=(select auth.uid())));
create policy visits_update_own on public.site_visits for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and
  exists(select 1 from public.leads l where l.id=lead_id and l.user_id=(select auth.uid())));
create policy visits_delete_own on public.site_visits for delete to authenticated
using (user_id = (select auth.uid()));

-- The unique partial index above provides concurrency-safe prevention of double booking.
-- The app additionally filters available slots for a friendly booking UX.
