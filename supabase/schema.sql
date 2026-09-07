-- GlowNest Beauty Salon — database schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query) after creating your project.
-- Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE where possible.

create extension if not exists btree_gist;

-- =========================================================
-- Tables
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('owner', 'customer')),
  full_name text not null default '',
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes int not null check (duration_minutes > 0),
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null unique check (day_of_week between 0 and 6), -- 0 = Sunday
  open_time time,
  close_time time,
  is_closed boolean not null default false
);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete set null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  duration_minutes int not null default 30 check (duration_minutes > 0),
  total_price numeric(10, 2) not null default 0 check (total_price >= 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  booked_by text not null default 'customer' check (booked_by in ('customer', 'owner')),
  notes text,
  created_at timestamptz not null default now(),
  exclude using gist (tstzrange(start_at, end_at) with &&) where (status <> 'cancelled')
);

-- One appointment can include several services (e.g. threading + manicure in one visit).
create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  primary key (appointment_id, service_id)
);

-- Migration for databases created before multi-service booking existed.
alter table public.appointments add column if not exists duration_minutes int not null default 30;
alter table public.appointments add column if not exists total_price numeric(10, 2) not null default 0;
drop trigger if exists appointments_set_end_at on public.appointments;
alter table public.appointments drop column if exists service_id;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('owner', 'customer')),
  customer_id uuid references public.profiles (id) on delete cascade,
  type text not null,
  message text not null,
  appointment_id uuid references public.appointments (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notification_customer_target check (
    (audience = 'customer' and customer_id is not null) or (audience = 'owner')
  )
);

create index if not exists appointments_start_at_idx on public.appointments (start_at);
create index if not exists appointments_customer_id_idx on public.appointments (customer_id);
create index if not exists notifications_audience_idx on public.notifications (audience, customer_id, is_read);

-- =========================================================
-- Helper functions
-- =========================================================

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The profiles UPDATE policy lets people edit their own row (name/phone). Without this guard,
-- that same policy would let anyone flip their own role to 'owner' via a direct API call.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_owner() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_self_escalation on public.profiles;
create trigger profiles_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- end_at always follows from the booked duration, so callers only ever send start_at.
create or replace function public.set_appointment_end_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.end_at := new.start_at + make_interval(mins => new.duration_minutes);
  return new;
end;
$$;

drop trigger if exists appointments_set_end_at on public.appointments;
create trigger appointments_set_end_at
  before insert or update of start_at, duration_minutes on public.appointments
  for each row execute function public.set_appointment_end_at();

-- Comma-separated service names for an appointment, used in notification copy.
create or replace function public.appointment_service_names(p_appointment_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select string_agg(s.name, ', ' order by s.sort_order)
  from public.appointment_services aps
  join public.services s on s.id = aps.service_id
  where aps.appointment_id = p_appointment_id;
$$;

-- Notify the customer when the owner cancels or reschedules them. (New bookings notify the
-- owner from inside create_booking, once the services for the appointment are known.)
create or replace function public.notify_on_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_name text;
begin
  service_name := public.appointment_service_names(coalesce(new.id, old.id));

  if tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    if old.customer_id is not null then
      insert into public.notifications (audience, customer_id, type, message, appointment_id)
      values (
        'customer',
        old.customer_id,
        'appointment_cancelled',
        'Your ' || coalesce(service_name, 'appointment') || ' on ' ||
          to_char(old.start_at, 'Mon DD, HH12:MI AM') || ' was cancelled.',
        old.id
      );
    end if;
  elsif tg_op = 'UPDATE' and new.start_at <> old.start_at and new.status <> 'cancelled' then
    if old.customer_id is not null then
      insert into public.notifications (audience, customer_id, type, message, appointment_id)
      values (
        'customer',
        old.customer_id,
        'appointment_rescheduled',
        'Your ' || coalesce(service_name, 'appointment') || ' was moved to ' ||
          to_char(new.start_at, 'Mon DD, HH12:MI AM') || '.',
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_notify on public.appointments;
create trigger appointments_notify
  after update on public.appointments
  for each row execute function public.notify_on_appointment_change();

-- =========================================================
-- Availability lookup
-- =========================================================
-- Anyone picking a time needs to know which slots are taken, but nobody except the owner may
-- read who booked them. This returns bare start/end times only — no names, phones or reasons —
-- so the booking screen can grey out taken slots without leaking customer details.
create or replace function public.busy_intervals(
  p_from timestamptz,
  p_to timestamptz,
  p_exclude_appointment uuid default null
)
returns table (busy_start timestamptz, busy_end timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select a.start_at, a.end_at
  from public.appointments a
  where a.status <> 'cancelled'
    and a.start_at < p_to
    and a.end_at > p_from
    and (p_exclude_appointment is null or a.id <> p_exclude_appointment)
  union all
  select b.start_at, b.end_at
  from public.availability_blocks b
  where b.start_at < p_to
    and b.end_at > p_from;
$$;

grant execute on function public.busy_intervals(timestamptz, timestamptz, uuid) to anon, authenticated;

-- =========================================================
-- Booking entry point
-- =========================================================
-- The only way an appointment gets created. Runs as definer so a guest (who can't read
-- appointments afterwards) can still book, while price and duration are always recomputed
-- from the services table rather than trusted from the browser.
create or replace function public.create_booking(
  p_service_ids uuid[],
  p_start_at timestamptz,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text default null,
  p_notes text default null,
  p_booked_by text default 'customer'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment_id uuid;
  v_duration int;
  v_total numeric(10, 2);
  v_count int;
  v_names text;
begin
  if p_booked_by not in ('customer', 'owner') then
    raise exception 'Invalid booked_by value';
  end if;

  if p_booked_by = 'owner' and not public.is_owner() then
    raise exception 'Only the salon owner can book on behalf of a customer';
  end if;

  if p_service_ids is null or array_length(p_service_ids, 1) is null then
    raise exception 'Pick at least one service';
  end if;

  select count(*), sum(duration_minutes), sum(price), string_agg(name, ', ' order by sort_order)
    into v_count, v_duration, v_total, v_names
  from public.services
  where id = any (p_service_ids) and active = true;

  if v_count <> array_length(p_service_ids, 1) then
    raise exception 'One or more selected services are unavailable';
  end if;

  insert into public.appointments (
    customer_id, guest_name, guest_phone, guest_email,
    start_at, duration_minutes, total_price, status, booked_by, notes
  )
  values (
    auth.uid(), p_guest_name, p_guest_phone, nullif(p_guest_email, ''),
    p_start_at, v_duration, v_total, 'confirmed', p_booked_by, nullif(p_notes, '')
  )
  returning id into v_appointment_id;

  insert into public.appointment_services (appointment_id, service_id)
  select v_appointment_id, unnest(p_service_ids);

  if p_booked_by = 'customer' then
    insert into public.notifications (audience, type, message, appointment_id)
    values (
      'owner',
      'new_booking',
      p_guest_name || ' booked ' || v_names || ' on ' || to_char(p_start_at, 'Mon DD, HH12:MI AM'),
      v_appointment_id
    );
  end if;

  return v_appointment_id;
end;
$$;

grant execute on function public.create_booking(uuid[], timestamptz, text, text, text, text, text)
  to anon, authenticated;

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_owner" on public.profiles;
create policy "profiles_select_own_or_owner" on public.profiles
  for select using (id = auth.uid() or public.is_owner());

drop policy if exists "profiles_update_own_or_owner" on public.profiles;
create policy "profiles_update_own_or_owner" on public.profiles
  for update using (id = auth.uid() or public.is_owner());

-- services: readable by everyone (active only, unless owner); writable by owner only
drop policy if exists "services_select" on public.services;
create policy "services_select" on public.services
  for select using (active = true or public.is_owner());

drop policy if exists "services_write" on public.services;
create policy "services_write" on public.services
  for all using (public.is_owner()) with check (public.is_owner());

-- business_hours: readable by everyone; writable by owner only
drop policy if exists "business_hours_select" on public.business_hours;
create policy "business_hours_select" on public.business_hours
  for select using (true);

drop policy if exists "business_hours_write" on public.business_hours;
create policy "business_hours_write" on public.business_hours
  for all using (public.is_owner()) with check (public.is_owner());

-- availability_blocks: owner only. Customers never read this table directly — busy_intervals()
-- gives the booking screen the times it needs without exposing why the owner is unavailable.
drop policy if exists "availability_blocks_select" on public.availability_blocks;
create policy "availability_blocks_select" on public.availability_blocks
  for select using (public.is_owner());

drop policy if exists "availability_blocks_write" on public.availability_blocks;
create policy "availability_blocks_write" on public.availability_blocks
  for all using (public.is_owner()) with check (public.is_owner());

-- appointments
drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments
  for select using (customer_id = auth.uid() or public.is_owner());

-- No direct inserts: everything goes through create_booking(), which validates and prices the
-- booking server-side. (That function is SECURITY DEFINER, so it isn't blocked by this.)
drop policy if exists "appointments_insert" on public.appointments;

drop policy if exists "appointment_services_select" on public.appointment_services;
create policy "appointment_services_select" on public.appointment_services
  for select using (
    public.is_owner()
    or exists (
      select 1 from public.appointments a
      where a.id = appointment_id and a.customer_id = auth.uid()
    )
  );

drop policy if exists "appointments_update" on public.appointments;
create policy "appointments_update" on public.appointments
  for update using (customer_id = auth.uid() or public.is_owner());

-- notifications: only readable/markable-as-read by their audience; inserts happen only via the trigger above
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (
    (audience = 'owner' and public.is_owner())
    or (audience = 'customer' and customer_id = auth.uid())
  );

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using (
    (audience = 'owner' and public.is_owner())
    or (audience = 'customer' and customer_id = auth.uid())
  );

-- Make new notification rows push to subscribed clients in real time.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- =========================================================
-- Seed data
-- =========================================================

insert into public.business_hours (day_of_week, open_time, close_time, is_closed)
values
  (0, null, null, true),
  (1, '10:00', '19:00', false),
  (2, '10:00', '19:00', false),
  (3, '10:00', '19:00', false),
  (4, '10:00', '19:00', false),
  (5, '10:00', '19:00', false),
  (6, '10:00', '17:00', false)
on conflict (day_of_week) do nothing;

-- Service names must be unique, otherwise re-running this file seeds a second copy of every
-- service. Collapse any duplicates that already exist before enforcing it: keep the original
-- row (so existing appointments keep pointing somewhere valid) but take the newest price.
update public.services s
set price = newest.price
from (
  select distinct on (lower(name)) lower(name) as key, price
  from public.services
  order by lower(name), created_at desc
) newest
where lower(s.name) = newest.key
  and s.id = (
    select id from public.services older
    where lower(older.name) = newest.key
    order by older.created_at
    limit 1
  );

delete from public.services s
using (
  select id, row_number() over (partition by lower(name) order by created_at) as rn
  from public.services
) dupes
where s.id = dupes.id
  and dupes.rn > 1
  and not exists (select 1 from public.appointment_services aps where aps.service_id = s.id);

-- Only enforce uniqueness if nothing is left duplicated (a duplicate still referenced by an
-- appointment can't be removed automatically — rename or deactivate it under Admin → Services).
do $$
begin
  if not exists (select 1 from public.services group by lower(name) having count(*) > 1) then
    create unique index if not exists services_name_unique on public.services (lower(name));
  end if;
end $$;

-- Starting prices in DKK. Set your real prices any time under Admin → Services.
insert into public.services (name, category, price, duration_minutes, description, sort_order)
select v.name, v.category, v.price, v.duration_minutes, v.description, v.sort_order
from (
  values
    ('Threading', 'Face', 60, 15, 'Precise eyebrow and facial hair threading.', 1),
    ('Facial', 'Face', 450, 45, 'Cleansing and rejuvenating facial treatment.', 2),
    ('Cleansing', 'Face', 300, 30, 'Deep pore cleansing facial.', 3),
    ('Hair Cut', 'Hair', 350, 45, 'Style consultation and precision haircut.', 4),
    ('Manicure', 'Nails', 275, 40, 'Classic manicure with polish.', 5),
    ('Pedicure', 'Nails', 375, 50, 'Relaxing pedicure with polish.', 6),
    ('Gel Nail', 'Nails', 350, 45, 'Long-lasting gel polish application.', 7),
    ('Acrylic Nail', 'Nails', 450, 60, 'Full set of acrylic nails.', 8),
    ('Nail Extension', 'Nails', 500, 60, 'Nail extensions with custom shape and length.', 9),
    ('Waxing', 'Body', 200, 30, 'Smooth, long-lasting hair removal.', 10)
) as v(name, category, price, duration_minutes, description, sort_order)
where not exists (
  select 1 from public.services s where lower(s.name) = lower(v.name)
);

-- =========================================================
-- After running this file: make yourself the owner
-- =========================================================
-- 1. Sign up once through the site's /signup page (or /admin/login "Sign up" if you add one) using the
--    owner's email — this creates a matching row in public.profiles with role = 'customer'.
-- 2. In the SQL Editor, run:
--    update public.profiles set role = 'owner' where email = 'YOUR_OWNER_EMAIL_HERE';
-- 3. Log in at /admin/login with that account from then on.
