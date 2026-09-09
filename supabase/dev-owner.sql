-- =========================================================
--  TEST OWNER ACCOUNT — DEVELOPMENT ONLY
-- =========================================================
--  Creates a ready-to-use owner login with a known password and a fake email address, so you
--  can get into /admin without a real inbox or an email confirmation step.
--
--      Email:     owner@glownest.test
--      Password:  GlowNest-Test-2026!
--
--  This file is deliberately SEPARATE from schema.sql so it can never run by accident when you
--  set up the real database. Run it only on a database you're testing with.
--
--  ⚠ Before real customers use the site, delete this account — the password is written down in
--    your repository, so anyone who reads it can open your calendar and see customer details.
--    The removal statement is at the bottom of this file.
--
--  Safe to re-run: it resets the password and re-confirms the account rather than duplicating.
-- =========================================================

do $$
declare
  v_email text := 'owner@glownest.test';
  v_password text := 'GlowNest-Test-2026!';
  v_id uuid;
begin
  -- pgcrypto lives in different schemas depending on how the project was created.
  set local search_path = public, extensions;

  select id into v_id from auth.users where email = v_email;

  if v_id is null then
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    )
    values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Salon Owner (test)"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    -- Newer Supabase versions require a matching identity row for email/password sign-in.
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', now(), now(), now()
    );
  else
    -- Already there: reset the password and clear any pending confirmation.
    update auth.users
    set encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_id;
  end if;

  -- handle_new_user() creates the profile row; make sure it exists and carries the owner role.
  insert into public.profiles (id, full_name, email, role)
  values (v_id, 'Salon Owner (test)', v_email, 'owner')
  on conflict (id) do update set role = 'owner', email = excluded.email;

  raise notice 'Test owner ready: % / %', v_email, v_password;
end $$;

-- =========================================================
--  To remove this account when you're done testing, run:
-- =========================================================
--  delete from auth.users where email = 'owner@glownest.test';
--  (the profile, and any bookings it made, are removed with it)
