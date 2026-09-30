-- =========================================================
--  CONFIRMATION TRACKING — know when a customer wasn't told
-- =========================================================
--  Run once, after add-hardening.sql. Safe to re-run.
--
--  The booking is real the moment it's made; the confirmation message is only a copy of it. But
--  if that copy never goes out, the owner needs to know so she can reach the customer herself.
--
--    sent         at least one channel (text or email) was accepted by its provider
--    failed       a channel was tried and every attempt failed
--    unavailable  no channel is switched on yet, so nothing was attempted
--    (null)       booked by the owner herself — she already knows about it
-- =========================================================

alter table public.appointments add column if not exists confirmation_status text;

alter table public.appointments drop constraint if exists appointments_confirmation_status_check;
alter table public.appointments add constraint appointments_confirmation_status_check
  check (confirmation_status is null or confirmation_status in ('sent', 'failed', 'unavailable'));

-- Written by the booking flow straight after sending. Customers have no update rights on
-- bookings, so this is deliberately narrow: it needs the booking's reference, which only the
-- person who just made it has, and it can only be set once.
create or replace function public.record_confirmation_status(
  p_appointment_id uuid,
  p_reference text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('sent', 'failed', 'unavailable') then
    raise exception 'Invalid confirmation status';
  end if;

  update public.appointments
  set confirmation_status = p_status
  where id = p_appointment_id
    and reference = p_reference
    and confirmation_status is null;
end;
$$;

revoke execute on function public.record_confirmation_status(uuid, text, text) from public;
grant execute on function public.record_confirmation_status(uuid, text, text) to anon, authenticated;

select 'confirmation tracking installed' as result;
