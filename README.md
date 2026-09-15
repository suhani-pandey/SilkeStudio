# Silke Studio

A booking website for a home studio that does two things: beauty treatments (nails, threading,
facials, hair, waxing) and clothing alterations (hemming, fittings, sari work, repairs).

Customers book either side online — or the owner books for them over the phone — and she manages
everything from one admin dashboard with real-time notifications.

Alterations can be booked two ways, because both happen in real life:

- **while you wait** — a normal appointment for the full working time
- **drop off & collect** — a short hand-over-and-measure slot, picked up once it's finished

The calendar only ever blocks the time she is actually working, so a drop-off doesn't tie up an
hour she could spend on someone's nails.

## Tech stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Supabase** — Postgres database, authentication, and realtime notifications
- **date-fns** for date/time handling




## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run format` | Prettier across the repo |

## Continuous integration

Every push to `main` and every pull request runs typecheck, lint, formatting check, unit tests and
a production build (`.github/workflows/ci.yml`). It needs no secrets — every data-backed page is
server-rendered on demand, so nothing reaches Supabase during the build.

## How it's organized

- `src/app/(site)` — public customer-facing pages (home, services, booking flow, optional login)
- `src/app/admin` — owner-only dashboard (calendar, appointments, availability, services), protected by `src/middleware.ts`
- `src/lib/actions` — all server actions (data reads/writes) — the only place that talks to Supabase
- `src/lib/availability.ts` — the slot-computation logic shared by the customer booking flow and the owner's manual booking form
- `src/lib/availability.test.ts` — unit tests for the slot engine, including the timezone and daylight-saving cases
- `supabase/schema.sql` — full database schema, security rules, and seed data

## Notes

- Customers can book as a guest (name + phone) or optionally create an account to see booking history.
- The owner gets a real-time notification the moment someone books; customers with an account get notified if the owner cancels or reschedules them.
- The site is installable to a phone's home screen (Add to Home Screen) — there's no separate native app.
- Prices are set to current Copenhagen-area market rates for a home-based salon. Confirm them
  before launch — they're what customers are quoted. Change any of them under **Admin → Services**,
  or run `supabase/update-prices.sql` to reset the whole list at once.
- Reviews on the home page come from **Admin → Reviews**. Only add real ones you actually
  received, with the client's permission; the page presents them as genuine.
- Service names have separate Danish columns, editable in the admin. The English name stays the
  canonical key used for grouping and photos.

## Going live

Deploy to Vercel (import the repo, it detects Next.js), and keep Supabase as the managed backend.


### What's already handled

- Security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS)
  and no `X-Powered-By`, set in `next.config.ts`.
- Row-level security on every table; customers can never read another customer's booking, and
  free/busy times are exposed through a `busy_intervals()` function that returns times only —
  no names, phone numbers or reasons.
- `error.tsx`, `global-error.tsx` and `not-found.tsx`, all in the salon's styling with a phone
  number as the fallback.
- Sitemap, robots, JSON-LD `BeautySalon` structured data, and a generated Open Graph share card.
- Installable as a PWA with an offline page.
