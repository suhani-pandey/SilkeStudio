-- =========================================================
--  READY FOR COLLECTION — closes the loop on drop-offs
-- =========================================================
--  Run this once, after add-tailoring.sql. Safe to re-run.
--
--  A customer who leaves a garment currently has no way of learning that it's finished. This adds
--  the owner's side of that: she sets a date, the customer is told.
--
--  It's a SECURITY DEFINER function rather than a plain update because notifications have no
--  insert policy — only the database itself writes them, exactly as it does for cancellations.
-- =========================================================

create or replace function public.mark_ready_for_collection(
  p_appointment_id uuid,
  p_ready_by date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_names text;
begin
  if not public.is_owner() then
    raise exception 'Only the salon owner can mark work ready';
  end if;

  select * into v_appointment from public.appointments where id = p_appointment_id;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if v_appointment.fulfilment <> 'dropoff' then
    raise exception 'Only a drop-off can be marked ready for collection';
  end if;

  update public.appointments
  set ready_by = p_ready_by
  where id = p_appointment_id;

  v_names := public.appointment_service_names(p_appointment_id);

  -- Customers with an account see it in the app. Guests are told by text, sent from the server.
  if v_appointment.customer_id is not null then
    insert into public.notifications (audience, customer_id, type, message, appointment_id)
    values (
      'customer',
      v_appointment.customer_id,
      'ready_for_collection',
      coalesce(v_names, 'Your alteration') || ' is ready to collect from '
        || to_char(p_ready_by, 'Mon DD') || '.',
      p_appointment_id
    );
  end if;
end;
$$;

grant execute on function public.mark_ready_for_collection(uuid, date) to authenticated;

select 'mark_ready_for_collection installed' as result;
