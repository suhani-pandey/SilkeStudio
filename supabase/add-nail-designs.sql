-- =========================================================
--  NAIL DESIGNS — a catalogue of the studio's own work
-- =========================================================
--  Run once, after add-tailoring.sql. Safe to re-run.
--
--  Customers browse what the studio actually does — shapes, colours, finishes — and carry a
--  choice into a booking, so she knows what to prepare before they arrive. Every photo is her
--  own work, uploaded from the admin.
--
--  colour_hex is stored per design even though nothing renders it yet: it drives the colour
--  filter, and a camera try-on added later would need exactly this.
-- =========================================================

create table if not exists public.nail_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_da text,
  category text not null,
  category_da text,
  description text,
  description_da text,
  -- Path within the storage bucket, not a full URL, so the project can move without rewriting rows.
  image_path text not null,
  -- Dominant colour, for the swatch filter and any future try-on.
  colour_hex text check (colour_hex is null or colour_hex ~* '^#[0-9a-f]{6}$'),
  -- The service a customer books to get this design.
  service_id uuid references public.services (id) on delete set null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists nail_designs_active_idx
  on public.nail_designs (active, sort_order);

alter table public.nail_designs enable row level security;

-- The catalogue is a shop window: anyone may read what's on show, only the owner may change it.
drop policy if exists "nail_designs_select" on public.nail_designs;
create policy "nail_designs_select" on public.nail_designs
  for select using (active = true or public.is_owner());

drop policy if exists "nail_designs_write" on public.nail_designs;
create policy "nail_designs_write" on public.nail_designs
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- Image storage ----------
insert into storage.buckets (id, name, public)
values ('nail-designs', 'nail-designs', true)
on conflict (id) do nothing;

drop policy if exists "nail_design_images_read" on storage.objects;
create policy "nail_design_images_read" on storage.objects
  for select using (bucket_id = 'nail-designs');

drop policy if exists "nail_design_images_write" on storage.objects;
create policy "nail_design_images_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'nail-designs' and public.is_owner());

drop policy if exists "nail_design_images_update" on storage.objects;
create policy "nail_design_images_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'nail-designs' and public.is_owner());

drop policy if exists "nail_design_images_delete" on storage.objects;
create policy "nail_design_images_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'nail-designs' and public.is_owner());

select 'nail_designs installed' as result;
