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

### 5. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the customer site, and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the owner dashboard.

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
- Icons are a placeholder logo mark for now; swap `src/app/icon.svg` for real branding whenever you like.
# Glownest
