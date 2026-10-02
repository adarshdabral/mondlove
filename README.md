# Mingleo · Meet. Date. Experience.

Mingleo is a full-stack web app for blind-first dating, real date proposals at verified venues, and couples' date planning and memories. It also includes dashboards for cafés, restaurants and activity providers, and an admin console.

**Launch market: Dehradun.** The first audience is the city's Gen Z (18–27): students and young professionals. Copy, date ideas, pricing (most first dates ₹300–₹700 for two) and all seed data are built around Doon.

```
frontend/   Next.js 16 (App Router) · React 19 · Tailwind v4 · Lucide
backend/    Node.js · Express 5 · Mongoose 9 · MongoDB · zod · JWT session cookies
docs/       ARCHITECTURE.md: architecture, data model, API reference, deployment, roadmap
```

`frontend/` and `backend/` are independent apps, each with its own dependencies, lock file and `.env`. The root `package.json` only holds convenience scripts that run both.

## Run it locally

Prerequisites: Node 20.12+ and a MongoDB database (Atlas or local).

```bash
cp backend/.env.example backend/.env       # then set MONGODB_URI (and a JWT_SECRET)
cp frontend/.env.example frontend/.env     # optional: defaults to the backend on :4000
npm install                                 # installs backend/ and frontend/ separately
npm run seed                                # replaces Mingleo's collections with Dehradun dummy data
npm run dev                                 # backend on :4000, frontend on :3100
```

Open **http://localhost:3100**. The frontend proxies `/api/*` to the backend, so sessions are same-origin httpOnly cookies.

| Command (from the root) | What it does |
|---|---|
| `npm run dev` | Backend (watch mode) + frontend (dev server) |
| `npm run build` / `npm start` | Production builds / production servers for both |
| `npm run seed` | Replaces Mingleo's collections in `MONGODB_URI` with dummy data (refuses in production) |
| `npm test` | Backend integration tests (28) against a separate `*_test` database, local by default (`MONGODB_TEST_URI` to override) |
| `npm run typecheck` | Type-checks both apps |

Each app also works on its own: `cd backend && npm install && npm run dev`, and likewise for `frontend`.

### Deploying

- **Backend:** any Node host. Set `MONGODB_URI`, `JWT_SECRET`, `WEB_ORIGIN` and `NODE_ENV=production`, then run `npm ci && npm run build && npm start`. Use `/api/health` as the health check.
- **Frontend:** Vercel or any Node host. Set `API_URL` to the backend's URL and `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false`.
- **Atlas:** allow the backend host's IP under Network Access.

## Accounts

Sign up from the landing page, or use a seeded account (password **`mingleo-demo`**). The login page also has one-click buttons for these.

| Role | Email | Try |
|---|---|---|
| Single | `aarav@demo.mingleo.app` | Answer "How was your date with Ananya?" (she already said yes), reply to Zoya's invitation, confirm Meera's changes |
| Singles | `ananya@`, `kabir@`, `zoya@`, `meera@`, `rohan@`, `ishaan@` + `demo.mingleo.app` | Discover, propose, accept, customize |
| Couple | `isha@demo.mingleo.app` / `dev@demo.mingleo.app` | Isha sees only the teaser for Dev's secret surprise; Dev can use Date Lab and Memories |
| Café owner | `rhea@demo.mingleo.app` | Pine & Pour Café (Rajpur Road) dashboard |
| Activity owner | `vikram@demo.mingleo.app` | Clay & Kiln Studio (Dalanwala) dashboard |
| New business | `newcafe@demo.mingleo.app` | Venue waiting for verification |
| Admin | `admin@demo.mingleo.app` | Verify people and venues, handle reports, revenue |

The 120 generated people (ages 19–27, across Dehradun neighbourhoods) use `<name>.<n>@example.mingleo.app` with the same password.

All venues and businesses in the seed are **fictional**; the neighbourhoods and landmarks (Rajpur Road, Paltan Bazaar, Astley Hall, Maldevta…) are real. Replace them with signed-up partner venues before launch.

## What's in the app

- **Landing page** (`/`) plus `/business`, `/privacy` and `/terms`.
- **Cafés and activity owners:** register at **`/partners`**, log in at **`/partners/login`**. They're reached from the header's "For business" button, the sign-up screen's "I own a café, restaurant or activity" option, the switch on the login page, and the footer. After registering, owners go through a five-step listing wizard at **`/partner/setup`**:
  1. About & timings: description, address, landmark, map link, phone, price for two, ambience, opening hours, date slots.
  2. Venue photos: 3–12, with captions and a chosen cover.
  3. Menu or activities: 2–16 items, each with a photo, price and veg/egg/non-veg mark. These are also the items people pick for each other on a proposal.
  4. Good to know: food, alcohol, seating, vibe, payment, parking, accessibility, amenities, safety, student discount, cancellation and late-arrival policy, house rules.
  5. Date package and FSSAI/GSTIN, then submit.

  The listing stays a private draft until it's submitted. Submit refuses with a list of what's still missing. Admins review the whole listing (licences included) before approving it.
  Photos are resized in the browser and stay private until the venue is verified. Phone numbers go only to guests with a booking. Licence numbers are never public.
- **Sign up → onboarding:** avatar studio, interests, preferences, prompt, trusted contact, and an optional partner invite.
- **Singles** (`/app`):
  - Discover with server-computed compatibility.
  - Profiles where photos stay locked until a date.
  - Date proposals: venue, experience, time and Date Token.
  - Accept, customize or decline, with turn-taking.
  - Booking pages with calendar export, directions and a safety toolkit.
  - Private post-date feedback with mutual opt-in.
- **Couples:**
  - Link partners by invite.
  - Date Lab, generated from real venues and prices.
  - Surprise My Partner: the partner sees only the day, time and a hint.
  - Memories with photo uploads, visible only to the two of you.
- **Partners** (`/partner`): bookings with check-in, packages, availability, ratings from guest feedback, payouts and analytics.
- **Admin** (`/admin`): verification queue, automated flags, reports, people, venues, bookings and revenue by stream.

## Layout

```
backend/src/
  models/        users, couples, memories, venues, experiences, slots, proposals,
                 bookings, payments, revenues, reports, blocks, media
  services/      booking.ts (proposal state machine, bookings, payments, revenue ledger)
                 experience.ts (catalogue, slot inventory, Date Lab)
  routes/        auth · consumer · experience · media · partner · admin
  lib/           http (sessions, CSRF, errors) · compat (compatibility) · dto
  seed/          seed.ts (dummy-data generator) + catalog.ts (hand-written content)
backend/test/        integration tests

frontend/src/
  app/           routes: landing, auth, onboarding, /app/*, /partner, /admin, legal
  components/    AppShell, avatar, UI kit, cards, plan picker, charts, dashboards
  lib/           api client, session/toast/data hooks, types, UI constants
```
