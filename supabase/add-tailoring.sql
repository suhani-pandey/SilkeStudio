-- =========================================================
--  TAILORING — adds the alterations side of the business
-- =========================================================
--  Safe to re-run. Run it once on an existing database; a fresh setup from schema.sql already
--  includes everything here.
--
--  Two ways to book an alteration, because both happen in real life:
--    * "while you wait"  — a normal appointment for the full working time
--    * "drop off"        — a short hand-over-and-measure slot, collected later
--
--  The calendar only ever blocks the time she is actually working, so a drop-off doesn't tie up
--  an hour she could be doing someone's nails in.
-- =========================================================

-- ---------- Services gain a business line ----------
alter table public.services add column if not exists service_line text not null default 'beauty';
alter table public.services drop constraint if exists services_service_line_check;
alter table public.services add constraint services_service_line_check
  check (service_line in ('beauty', 'tailoring'));

-- How long the hand-over takes when the customer isn't waiting for the work. Null for anything
-- that can't be dropped off.
alter table public.services add column if not exists dropoff_minutes int;

-- ---------- Appointments record which way it was booked ----------
alter table public.appointments add column if not exists fulfilment text not null default 'appointment';
alter table public.appointments drop constraint if exists appointments_fulfilment_check;
alter table public.appointments add constraint appointments_fulfilment_check
  check (fulfilment in ('appointment', 'dropoff'));

-- When a drop-off should be ready for collection. The owner sets this; customers see it.
alter table public.appointments add column if not exists ready_by date;

-- ---------- The alterations menu ----------
-- Prices sit below Copenhagen high-street alteration shops, which is where a home studio belongs.
-- Every one of these is editable under Admin → Services.
insert into public.services
  (name, name_da, category, category_da, price, duration_minutes, dropoff_minutes,
   description, description_da, service_line, sort_order)
select v.name, v.name_da, v.category, v.category_da, v.price, v.duration_minutes, v.dropoff_minutes,
       v.description, v.description_da, 'tailoring', v.sort_order
from (
  values
    ('Simple hem', 'Simpel oplægning', 'Alterations', 'Ændringer',
     50, 20, 15, 'A straight hem taken up on a simple garment.',
     'En lige oplægning på et enkelt stykke tøj.', 20),
    ('Trouser hemming', 'Oplægning af bukser', 'Alterations', 'Ændringer',
     150, 30, 15, 'Shortened and re-hemmed to your length.',
     'Afkortet og lagt op til din længde.', 21),
    ('Waist adjustment', 'Justering af talje', 'Alterations', 'Ændringer',
     200, 45, 15, 'Taken in or let out for a proper fit.',
     'Taget ind eller lagt ud, så det sidder rigtigt.', 22),
    ('Sleeve shortening', 'Afkortning af ærmer', 'Alterations', 'Ændringer',
     175, 40, 15, 'Sleeves shortened on tops, shirts and jackets.',
     'Ærmer afkortet på toppe, skjorter og jakker.', 23),
    ('Dress alteration', 'Ændring af kjole', 'Alterations', 'Ændringer',
     275, 60, 15, 'Reshaped through the waist, bust or length.',
     'Tilpasset i talje, bryst eller længde.', 24),
    ('Sari blouse fitting', 'Tilpasning af sari-bluse', 'Sari & occasion', 'Sari & fest',
     300, 60, 15, 'Blouse fitted and finished to your measurements.',
     'Blusen tilpasset og syet efter dine mål.', 25),
    ('Sari fall & pico', 'Sari fald & pico', 'Sari & occasion', 'Sari & fest',
     150, 30, 15, 'Fall stitched and the edge finished by machine.',
     'Fald syet i og kanten afsluttet på maskine.', 26),
    ('Zip replacement', 'Udskiftning af lynlås', 'Repairs', 'Reparationer',
     225, 45, 15, 'A new zip fitted in trousers, dresses or jackets.',
     'Ny lynlås i bukser, kjoler eller jakker.', 27),
    ('Repair & mending', 'Reparation og lapning', 'Repairs', 'Reparationer',
     125, 25, 15, 'Seams, tears and small repairs put right.',
     'Syninger, flænger og små reparationer ordnet.', 28)
) as v(name, name_da, category, category_da, price, duration_minutes, dropoff_minutes,
       description, description_da, sort_order)
where not exists (
  select 1 from public.services s where lower(s.name) = lower(v.name)
);

-- Anything that existed before this migration is beauty work.
update public.services set service_line = 'beauty' where service_line is null;

-- ---------- Booking knows about drop-offs ----------
drop function if exists public.create_booking(uuid[], timestamptz, text, text, text, text, text);
drop function if exists public.create_booking(uuid[], timestamptz, text, text, text, text, text, text);

create function public.create_booking(
  p_service_ids uuid[],
  p_start_at timestamptz,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text default null,
  p_notes text default null,
  p_booked_by text default 'customer',
  p_fulfilment text default 'appointment'
)
returns table (appointment_id uuid, reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_reference text;
  v_duration int;
  v_buffer int;
  v_total numeric(10, 2);
  v_count int;
  v_names text;
  v_tailoring int;
begin
  if p_booked_by not in ('customer', 'owner') then
    raise exception 'Invalid booked_by value';
  end if;

  if p_fulfilment not in ('appointment', 'dropoff') then
    raise exception 'Invalid fulfilment value';
  end if;

  if p_booked_by = 'owner' and not public.is_owner() then
    raise exception 'Only the salon owner can book on behalf of a customer';
  end if;

  if p_service_ids is null or array_length(p_service_ids, 1) is null then
    raise exception 'Pick at least one service';
  end if;

  -- Duration and price always come from the services table, never from the browser. A drop-off
  -- only occupies the hand-over slot; the sewing itself happens outside the appointment.
  select count(*),
         sum(case when p_fulfilment = 'dropoff'
                  then coalesce(dropoff_minutes, 15)
                  else duration_minutes end),
         max(buffer_minutes),
         sum(price),
         string_agg(name, ', ' order by sort_order),
         count(*) filter (where service_line = 'tailoring')
    into v_count, v_duration, v_buffer, v_total, v_names, v_tailoring
  from public.services
  where id = any (p_service_ids) and active = true;

  if v_count <> array_length(p_service_ids, 1) then
    raise exception 'One or more selected services are unavailable';
  end if;

  -- Only garments can be left behind, so a drop-off has to be tailoring work throughout.
  if p_fulfilment = 'dropoff' and v_tailoring <> v_count then
    raise exception 'Only alterations can be dropped off';
  end if;

  v_reference := public.generate_booking_reference();

  insert into public.appointments (
    customer_id, guest_name, guest_phone, guest_email, start_at,
    duration_minutes, buffer_minutes, total_price, status, booked_by, notes, reference, fulfilment
  )
  values (
    auth.uid(), p_guest_name, p_guest_phone, nullif(p_guest_email, ''), p_start_at,
    v_duration, coalesce(v_buffer, 0), v_total, 'confirmed', p_booked_by, nullif(p_notes, ''),
    v_reference, p_fulfilment
  )
  returning id into v_id;

  insert into public.appointment_services (appointment_id, service_id)
  select v_id, unnest(p_service_ids);

  if p_booked_by = 'customer' then
    insert into public.notifications (audience, type, message, appointment_id)
    values (
      'owner',
      'new_booking',
      p_guest_name
        || case when p_fulfilment = 'dropoff' then ' is dropping off ' else ' booked ' end
        || v_names || ' on '
        || to_char(p_start_at at time zone public.salon_timezone(), 'Mon DD, HH24:MI'),
      v_id
    );
  end if;

  return query select v_id, v_reference;
end;
$$;

grant execute on function public.create_booking(uuid[], timestamptz, text, text, text, text, text, text)
  to anon, authenticated;

select name, service_line, price || ' kr.' as price,
       duration_minutes || ' min' as while_you_wait,
       coalesce(dropoff_minutes::text || ' min', '—') as drop_off
from public.services
order by service_line, sort_order;
