-- =========================================================
--  HARDENING — abuse limits, reminders, data retention, upload rules
-- =========================================================
--  Run once, after add-tailoring.sql (and add-nail-designs.sql if you use the design catalogue).
--  Safe to re-run.
-- =========================================================

-- ---------- 1. Booking limits ----------
-- Anyone can book without an account, which also means anyone could script the booking form and
-- fill the calendar with fake appointments. These limits are generous for a real customer and
-- stop that cold. The owner's own bookings are never limited.
--
-- Phones are compared on their last eight digits, so "+45 91 71 90 63" and "91719063" count as
-- the same customer.

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
  v_phone text;
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

  if length(trim(coalesce(p_guest_name, ''))) = 0 or length(p_guest_name) > 120 then
    raise exception 'Please enter your name';
  end if;

  v_phone := right(regexp_replace(coalesce(p_guest_phone, ''), '[^0-9]', '', 'g'), 8);
  if length(v_phone) < 8 then
    raise exception 'Please enter a valid phone number';
  end if;

  if p_booked_by = 'customer' then
    if (
      select count(*) from public.appointments
      where right(regexp_replace(guest_phone, '[^0-9]', '', 'g'), 8) = v_phone
        and status = 'confirmed'
        and start_at > now()
    ) >= 3 then
      raise exception 'You already have three upcoming bookings. Please call us to book more.';
    end if;

    if (
      select count(*) from public.appointments
      where right(regexp_replace(guest_phone, '[^0-9]', '', 'g'), 8) = v_phone
        and created_at > now() - interval '10 minutes'
    ) >= 3 then
      raise exception 'Too many bookings in a short time. Please wait a few minutes and try again.';
    end if;

    -- A one-person studio never legitimately takes this many online bookings in an hour; if it
    -- happens, it's a script, and customers are pointed to the phone instead.
    if (
      select count(*) from public.appointments
      where booked_by = 'customer' and created_at > now() - interval '1 hour'
    ) >= 30 then
      raise exception 'Online booking is very busy right now. Please call us to book.';
    end if;
  end if;

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

  if p_fulfilment = 'dropoff' and v_tailoring <> v_count then
    raise exception 'Only alterations can be dropped off';
  end if;

  v_reference := public.generate_booking_reference();

  insert into public.appointments (
    customer_id, guest_name, guest_phone, guest_email, start_at,
    duration_minutes, buffer_minutes, total_price, status, booked_by, notes, reference, fulfilment
  )
  values (
    auth.uid(), trim(p_guest_name), p_guest_phone, nullif(p_guest_email, ''), p_start_at,
    v_duration, coalesce(v_buffer, 0), v_total, 'confirmed', p_booked_by,
    nullif(left(coalesce(p_notes, ''), 1000), ''), v_reference, p_fulfilment
  )
  returning id into v_id;

  insert into public.appointment_services (appointment_id, service_id)
  select v_id, unnest(p_service_ids);

  if p_booked_by = 'customer' then
    insert into public.notifications (audience, type, message, appointment_id)
    values (
      'owner',
      'new_booking',
      trim(p_guest_name)
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

create index if not exists appointments_created_at_idx on public.appointments (created_at);

-- ---------- 2. Reminders ----------
-- Set when the day-before reminder goes out, so a retried job never texts anyone twice.
alter table public.appointments add column if not exists reminder_sent_at timestamptz;

-- ---------- 3. Data retention ----------
-- GDPR expects personal data to be kept only as long as it's needed. After the retention period
-- an appointment keeps its date, services and price — the business records — but loses the name,
-- phone, email and free-text note that identify a person. Run daily by the maintenance job.
create or replace function public.anonymise_old_appointments(p_months int default 24)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.appointments
  set guest_name = 'Anonymised',
      guest_phone = '',
      guest_email = null,
      notes = null,
      customer_id = null
  where start_at < now() - make_interval(months => p_months)
    and guest_name <> 'Anonymised';
  get diagnostics v_count = row_count;

  -- Notification text repeats customer names, so it goes on the same schedule.
  delete from public.notifications
  where created_at < now() - make_interval(months => p_months);

  return v_count;
end;
$$;

-- Only the server's maintenance job may call this, never a visitor.
revoke execute on function public.anonymise_old_appointments(int) from public, anon, authenticated;
grant execute on function public.anonymise_old_appointments(int) to service_role;

-- ---------- 4. Upload rules ----------
-- The admin page already checks type and size in the browser; this makes the bucket enforce the
-- same rules itself. A no-op if the design catalogue hasn't been installed.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 5242880
where id = 'nail-designs';

select 'hardening installed' as result;
