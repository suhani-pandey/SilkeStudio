# GlowNest Beauty Salon

A booking website for a home-based beauty salon — customers book services online (or the owner books for them over the phone), and the owner manages everything from a dedicated admin dashboard with real-time notifications.

## Tech stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Supabase** — Postgres database, authentication, and realtime notifications
- **date-fns** for date/time handling

## One-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign up / log in, and create a new project (free tier is fine).
2. Once it's ready, go to **Project Settings → API** and copy the **Project URL** and **anon public** key.
3. Copy `.env.local.example` to `.env.local` and paste those two values in:

   ```bash
   cp .env.local.example .env.local
   ```

### 3. Set up the database

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates all tables, security rules, and seeds the 10 starting services + default business hours.

### 4. Make yourself the owner

1. Run the app (see below) and sign up once through `/signup` using the salon owner's email address.
2. Back in the Supabase SQL Editor, run:

   ```sql
   update public.profiles set role = 'owner' where email = 'owner@example.com';
   ```

3. From then on, log in at `/admin/login` with that same email/password to reach the owner dashboard.

### 4b. Shortcut for testing: a ready-made owner login

If you just want to get into `/admin` quickly, run [`supabase/dev-owner.sql`](supabase/dev-owner.sql)
in the SQL Editor. It creates a confirmed owner account with a fake email, so there's no
confirmation step and no real inbox needed:

    Email:     owner@glownest.test
    Password:  GlowNest-Test-2026!

**Delete this account before real customers use the site** — the password is in this repository.
The removal statement is at the bottom of that file.

To stop email confirmation getting in the way while testing, you can also switch it off under
**Authentication → Sign In / Providers → Email → Confirm email**. Turn it back on before launch.

### 5. Optional: SMS confirmations (GatewayAPI)

Customers get a text with their booking code, and you get one for every new booking. Nothing
sends and nothing is charged until this is configured.

1. Create an account at [gatewayapi.com](https://gatewayapi.com) and top it up (Danish SMS is
   roughly 0.10–0.15 kr each).
2. Create an API token and put it in `.env.local` as `GATEWAYAPI_TOKEN`.
3. Set `SALON_OWNER_PHONE` to your own mobile so new-booking alerts reach you.
4. Set `NEXT_PUBLIC_SITE_URL` to the live address, so the "manage your booking" link in the
   text points somewhere real.

### 6. Optional: push notifications to your phone

Alerts on your phone the moment someone books, even with the app closed.

1. Generate a key pair: `npx web-push generate-vapid-keys`
2. Put them in `.env.local` as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
3. Add `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API) so the server can look up which
   devices to notify. Keep this key server-side only — never prefix it with `NEXT_PUBLIC_`.
4. Install the site to your phone's home screen, then open **Admin → Availability** and tap
   **Turn on booking alerts**. Do this on each device you want alerts on.

### 7. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the customer site, and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the owner dashboard.

### Deploying to Vercel (or another host)

Environment files are intentionally not committed to Git. Add these two variables in the hosting project's settings before deploying, using the values from Supabase **Project Settings -> API**:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Set them for the production environment, save the changes, and redeploy. The middleware runs on every request and requires both values; if either is missing, the deployed site returns an internal server error even though the local build succeeds with `.env.local`.

## Salon timezone

Opening hours and time off are stored as plain wall-clock times, so they're anchored to
`Europe/Copenhagen` in two places — `SALON_TIMEZONE` in `src/lib/business-info.ts` and
`salon_timezone()` in `supabase/schema.sql`. Change both together if the salon ever moves.
Without this, hosting (which runs in UTC) would shift every slot by an hour or two.

## Swapping in your own photos

Every image is a plain file in `public/images/`. Replace a file with your own, keep the name,
and the layout stays exactly the same — no code changes needed. Shoot roughly to these shapes:

| File | Where it appears | Shape |
| --- | --- | --- |
| `hero.jpg` | Home page, beside the headline | Tall portrait (4:5) |
| `about.jpg` | Home page, "Our story" | Landscape (4:3) |
| `svc-nails.jpg` | Nails category card + services page | Tall portrait (4:5) |
| `svc-face.jpg` | Face category, closing banner | Tall portrait (4:5) |
| `svc-hair.jpg` | Hair category | Tall portrait (4:5) |
| `svc-body.jpg` | Body category | Tall portrait (4:5) |
| `svc-brows.jpg` | Gallery | Square |
| `gallery-1..4.jpg` | Home page gallery | Square |

The current photos are free stock (Pexels licence) standing in until yours are ready. Your own
work is the single biggest visual upgrade left.

## How it's organized

- `src/app/(site)` — public customer-facing pages (home, services, booking flow, optional login)
- `src/app/admin` — owner-only dashboard (calendar, appointments, availability, services), protected by `src/middleware.ts`
- `src/lib/actions` — all server actions (data reads/writes) — the only place that talks to Supabase
- `src/lib/availability.ts` — the slot-computation logic shared by the customer booking flow and the owner's manual booking form
- `supabase/schema.sql` — full database schema, security rules, and seed data

## Notes

- Customers can book as a guest (name + phone) or optionally create an account to see booking history.
- The owner gets a real-time notification the moment someone books; customers with an account get notified if the owner cancels or reschedules them.
- The site is installable to a phone's home screen (Add to Home Screen) — there's no separate native app.
- Prices in the database are starting placeholders — set your real ones under **Admin → Services**.
- Reviews on the home page come from **Admin → Reviews**. Only add real ones you actually
  received, with the client's permission; the page presents them as genuine.
- Service names have separate Danish columns, editable in the admin. The English name stays the
  canonical key used for grouping and photos.
# Glownest
