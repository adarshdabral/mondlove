# Mingleo architecture

This document reviews the original architecture diagram, describes the refined architecture that is now implemented in this repo, and sets out what still has to happen before production.

- **`frontend/`**: Next.js 16 (App Router) app. It holds the landing page, sign-up and onboarding, the consumer app (`/app`), the partner dashboard (`/partner`) and the admin console (`/admin`).
- **`backend/`**: Node.js + Express 5 + Mongoose 9 on MongoDB. It contains the auth, booking and experience services, plus partner and admin APIs.

---

## 1. Review of the original diagram

```
NEXT.JS WEB ─┐
BUSINESS ────┴─ REST API / HTTPS ─ NODE.JS + EXPRESS ─ {Auth, Booking, Experience} ─ MONGODB
                                                        Users · Proposals · Bookings
                                                        Couples · Experiences · Payments
                                                        Memories · Venues · Revenue
```

**What's right about it**

- **One API for every client.** The consumer app and business dashboards share one API, so partners see real bookings and nothing has to be synced.
- **Service split along business lines.** Auth, Booking and Experience map cleanly to *who you are*, *what you committed to* and *what's available*.
- **A document store suits the domain.** Profiles, venue menus and memories are document-shaped and evolve quickly.
- **Revenue is modelled as data.** That makes the business model auditable from day one.

**Gaps found, and how each was handled**

| # | Gap | Risk | Status |
|---|-----|------|--------|
| 1 | **No safety data.** Reports, blocks and verification state aren't in the model, yet safety is a core promise. | High | ✅ Added `reports` and `blocks` collections, `verification` on users and `status` on venues, plus automated flags |
| 2 | **No inventory.** Without slot capacity, two couples can book the last table. | High | ✅ Added the `slots` collection with an atomic conditional increment (tested with three concurrent requests) |
| 3 | **Proposal lifecycle undefined.** Accept, customize and counter-customize need turn-taking rules and an idempotent booking step. | High | ✅ Explicit state machine (§4.1) with an atomic claim, so a double-tap can't double-book |
| 4 | **Revenue as a mutable table.** Editing revenue rows loses the audit trail. | High | ✅ `revenues` is now an append-only ledger; refunds are negative entries |
| 5 | **Photo privacy is not enforced server-side.** "Blind-first" must hold at the API, not just in the UI. | High | ✅ The discovery DTO never includes photos; they're revealed only after a confirmed date |
| 6 | **Role-based access is missing.** The "BUSINESS" client needs partner-scoped access, and admin needs its own role. | High | ✅ Roles `user`, `partner` and `admin`; partners can only touch venues they own; web routes are role-gated (tested) |
| 6b | **Session handling unspecified.** Tokens in browser storage are exposed to XSS. | High | ✅ httpOnly, SameSite=Lax session cookie, plus a required `x-mingleo-csrf` header on every state-changing request. Bearer tokens remain available for future mobile clients |
| 7 | **Abuse protection.** Nothing stops proposal spam. | Medium | ✅ Per-user hourly limit that returns 429 and files an automated report for Trust & Safety |
| 8 | **Payments are not a provider integration.** A `payments` collection alone can't move money. | High | ⏳ A mock provider is implemented (authorize → capture → refund). Razorpay integration is required (§6) |
| 9 | **No notifications.** Proposals and surprises need push, SMS and email. | Medium | ⏳ Not built (§6) |
| 10 | **No media storage.** Profile photos and memory photos need storage with access control. | Medium | ✅ A `media` collection with a per-request access check (profile photos only after a confirmed date; memory photos only for the couple). ⏳ Move the bytes to S3/R2 before scale (§6) |
| 11 | **No background jobs.** Surprise teasers, reminders, payouts and expiring proposals need a scheduler. | Medium | ⏳ Not built (§6) |
| 12 | **Geo search.** "Nearby" needs geospatial queries. | Low | ✅ `2dsphere` index on `venues.location` (not used by the UI yet) |

---

## 2. Refined architecture

```
              ┌──────────────────────────── Next.js (frontend/) ────────────────────────────┐
              │  /, /partners         Landing page, venue sign-up                      │
              │  /signup, /login      Accounts → /onboarding                          │
              │  /app/*               Consumer app (singles + couples), role-gated     │
              │  /partner             Café / restaurant / activity dashboard           │
              │  /admin               Admin console                                    │
              │  next.config rewrites /api/* ──► API_URL                               │
              └──────────────────────────────────┬─────────────────────────────────────┘
                                                 │ HTTPS · JSON · Bearer JWT
              ┌──────────────────────── Express (backend/) ────────────────────────────┐
              │  helmet · CORS · CSRF header · zod · cookie/JWT auth · role guards     │
              │                                                                        │
              │  Auth service        Booking service             Experience service    │
              │  register (person or proposals state machine     venues & packages     │
              │  business)/login/me  bookings · cancel · feedback inventory (slots)    │
              │                      payments (mock provider)    Date Lab curation     │
              │                      revenue ledger                                    │
              │                                                                        │
              │  Partner API (owner-scoped)          Admin API (admin role)            │
              │  Couples (invite/accept) · Media (access-checked photos)               │
              │  Safety: reports · blocks · automated flags · verification             │
              └──────────────────────────────────┬─────────────────────────────────────┘
                                                 │ Mongoose
              ┌──────────────────────────────── MongoDB ───────────────────────────────┐
              │ users  couples  memories  venues  experiences  slots                   │
              │ proposals  bookings  payments  revenues (ledger)  reports  blocks      │
              │ media                                                                  │
              └────────────────────────────────────────────────────────────────────────┘
```

**Why the business dashboards live in the same Next.js app.** They share the design system, auth and API client. They sit under separate routes and API roles, so they can be split into their own deployment later without any API changes.

**Why services are modules, not microservices.** At this stage one deployable keeps transactions, testing and on-call simple. Each service lives in its own module (`backend/src/services/*`), with no cross-service database writes beyond the booking → revenue ledger. Splitting them later means moving a folder behind a network boundary.

---

## 3. Data model

| Collection | Purpose | Key fields | Indexes |
|---|---|---|---|
| `users` | People, partners and admins | `handle`, `email`, `passwordHash` (never selected), `role`, `status`, `mode`, `avatar`, private `photos`, interests/traits/food/datePrefs/lifestyle, `verification{status,method,score}` | `handle`, `email` unique |
| `couples` | Linked partners | `members[2]`, `source` (`mingleo_date`/`invite`), `status` (`pending` invite / `verified`), `invitedBy`, `since`, `occasions` | `members` |
| `media` | Photos | `owner`, `kind` (`profile`/`memory`), `couple?`, `contentType`, `data` (never selected by default) | `owner` |
| `memories` | Relationship timeline | `couple`, `createdBy`, `booking?`, `title`, `venueName`, `date`, `occasion`, `note`, `photos[]`, `rating` | `couple` |
| `venues` | Cafés, restaurants, activities | `slug`, `kind`, `tags`, `location` (GeoJSON), `treats[]` (Date Token menu), `slots[]`, `owner`, `status`, `commissionRate`, `plan`, `featured`, `availability` | `slug` unique, `owner`, `location` 2dsphere |
| `experiences` | Bookable packages | `code`, `venue`, `name`, `includes[]`, `price`, `days[]`, `capacity`, `active` | `code` unique, `venue` |
| `slots` | Inventory per experience, date and time | `experience`, `date`, `time`, `capacity`, `booked` | unique (`experience`,`date`,`time`) |
| `proposals` | Date proposals | `from`, `to`, `venue`, `experience`, `day`, `time`, `startsAt`, `treatForReceiver`, `treatForSender`, `note`, `status`, `lastEditedBy`, `history[]`, `booking?` | `from`, `to`, `status` |
| `bookings` | Confirmed experiences | `ref`, `kind` (`date`/`lab`/`surprise`/`marketplace`), `venue`, `experience`, `users[]`, `bookedBy`, `proposal?`, `price`, `gift?`, `secret{hint,message}`, `status`, `feedback[]` | `ref` unique, `venue`, `users`, `startsAt`, `status` |
| `payments` | Money movement | `booking`, `payer`, `amount`, `provider`, `providerRef`, `status` (`authorized`→`captured`/`refunded`) | `booking` |
| `revenues` | **Append-only ledger** | `stream` (8 streams), `amount` (negative for reversals), `gross`, `rate`, `booking?`, `payment?`, `venue?`, `at` | `stream`, `booking`, `venue`, `at` |
| `reports` | Trust & Safety cases | `code`, `reporter?`, `targetType`, `target`, `type`, `severity`, `status`, `automated` | `code` unique, `status` |
| `blocks` | User blocks | `blocker`, `blocked` | unique pair |

The eight revenue streams match the business model: `booking_commission`, `experience_commission`, `subscription`, `couple_pass`, `featured_placement`, `partner_pro`, `gifts_addons`, `brand_partnership`.

---

## 4. Key flows

### 4.1 Proposal state machine

```
sent ──accept (receiver, picks a treat)──────────────► confirmed ─► booking + payment + ledger
  │                                                      ▲
  ├─customize (receiver)──► customized ──confirm─────────┘   (only the person who did NOT edit last)
  │                           │  ▲
  │                           └──┘ customize again (counter-proposal, turns alternate)
  └─decline (from sent or customized) ─► declined   "Not this time": no block, no reason shared
```

- **Turn-taking.** `lastEditedBy` decides whose move it is, so nobody can confirm their own edit.
- **Atomic confirmation.** `findOneAndUpdate({status: <expected>})` claims the transition. A second confirm gets `409`, and exactly one booking exists (tested).
- **Prices stay private.** Invitations never include price. Only the payer sees it, at booking.
- **Guards.** Treats must be on the venue's menu. Only one open proposal per pair. Blocked pairs return `404`, so a block doesn't leak.

### 4.2 Booking, payment and revenue

1. Reserve a slot. This is an atomic conditional `$inc` that fails with `409` when the slot is full.
2. Create the booking.
3. Create the payment: `authorized` with the mock provider.
4. Write ledger entries: 12% commission (the venue's `commissionRate`) to `booking_commission` or `experience_commission`, plus 20% of any gift to `gifts_addons`.
5. Check-in or feedback captures the payment. Cancelling refunds it, releases the slot and writes negative ledger entries, so net revenue is 0 (tested).

### 4.3 Continuing a connection

Both people answer "continue?" privately after the date. Only when **every** participant answers `yes` does the API create a `couple`, move both users to couple mode, and write the "First Mingleo Date" memory. From then on, each person's photos are visible to the other.

### 4.4 Blind discovery

`GET /users/discover` excludes yourself, blocked people (in both directions), people in couple mode and your partner. It respects `interestedIn`, and computes the compatibility indicator server-side (`backend/src/lib/compat.ts`). That indicator is a transparent, rules-based score across six categories, returned with a disclaimer that it is not a scientific prediction.

---

## 5. API reference

All routes are under `/api`. 🔒 = Bearer token required.

**Auth service**

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `account: person` (18+, intent meet/plan/both, starts with `onboarded: false`) or `account: partner` (creates a pending venue). Sets the session cookie |
| POST | `/auth/login` | Same error for an unknown email or a wrong password. Sets the session cookie |
| POST | `/auth/logout` | Clears the cookie |
| GET 🔒 | `/auth/me` | |

**Consumer (booking service, users, couples, safety)**

| Method | Path | Notes |
|---|---|---|
| GET 🔒 | `/users/discover` | Blind profiles with compatibility |
| GET 🔒 | `/users/:handle` | Photos only after a confirmed date |
| PATCH 🔒 | `/users/me` | Profile, preferences, avatar |
| POST 🔒 | `/proposals` | Rate-limited |
| GET 🔒 | `/proposals?box=sent\|received\|all` | Includes `role`, `other` and `myTurn` |
| GET 🔒 | `/proposals/:id` | Proposal, venue, the other person (with compatibility) and the timeline |
| POST 🔒 | `/proposals/:id/accept` · `/customize` · `/confirm` · `/decline` | State machine (§4.1). Couples can't send or receive proposals |
| GET 🔒 | `/bookings` · `/bookings/:id` | |
| POST 🔒 | `/bookings` | `lab`, `surprise` (couples only) or `marketplace` |
| POST 🔒 | `/bookings/:id/cancel` · `/bookings/:id/feedback` | Refund + reversal · mutual opt-in |
| GET 🔒 | `/couples/me` | Linked partner and pending invites |
| POST 🔒 | `/couples/invite` · `/couples/:id/accept` · `/couples/:id/decline` · `/couples/leave` | Invites never reveal whether an email is registered |
| GET · POST · DELETE 🔒 | `/memories` · `/memories/:id` | Photos must be `/api/media/…` uploads |
| POST · GET · DELETE 🔒 | `/media?kind=profile\|memory` · `/media/:id` | Raw image upload (≤3 MB); served only to authorised viewers |
| POST · GET · DELETE 🔒 | `/reports` · `/blocks` · `/blocks/:handle` | Blocking also cancels open proposals between the pair |

**Experience service**

| Method | Path | Notes |
|---|---|---|
| GET | `/venues?category=&q=` · `/venues/:slug` | Verified venues only; includes active packages |
| POST 🔒 | `/date-lab/generate` | Curated from live venues and partner prices |

**Partner API** (role `partner`, scoped to the venues you own)

| Method | Path |
|---|---|
| GET | `/partner/dashboard`: KPIs, 30-day series, payout, bookings (first names only), packages, Date Token stats |
| POST · PATCH | `/partner/experiences` · `/partner/experiences/:code` |
| PUT | `/partner/availability` |
| PATCH | `/partner/bookings/:id` (`confirmed` / `arrived`) |

**Admin API** (role `admin`)

| Method | Path |
|---|---|
| GET | `/admin/overview` · `/admin/reports` · `/admin/verifications` · `/admin/users` · `/admin/venues?status=` · `/admin/bookings` · `/admin/blocks/stats` |
| PATCH | `/admin/reports/:code` |
| POST | `/admin/users/:handle/verify` · `/admin/users/:handle/suspend` · `/admin/users/:handle/reinstate` · `/admin/venues/:slug/verify` |

---

## 6. Deployment: two independent apps

`frontend/` and `backend/` don't share code or dependencies. Each has its own `package.json`, lock file and `.env`, and each can be built, deployed and scaled on its own.

```
 Browser ──HTTPS──► frontend (Next.js, e.g. Vercel)   ──/api/* rewrite──►  backend (Express, e.g. Render/Railway/Fly)  ──►  MongoDB Atlas
                    same-origin cookies                API_URL=https://api.example.com          MONGODB_URI, JWT_SECRET
```

- **Browser traffic goes only to the frontend origin.** Next.js rewrites `/api/*` to `API_URL` server-side, so the session cookie is first-party (httpOnly, SameSite=Lax, `Secure` in production) and the browser never needs CORS.
- **The backend still sets CORS** for `WEB_ORIGIN` (comma-separated) in case a client calls it directly.
- **`GET /api/health`** returns `503` until MongoDB is connected, so it works as a readiness probe.
- **Config:** the backend reads `backend/.env` when present, and real environment variables always win. In production `MONGODB_URI` and `JWT_SECRET` are required, and the process refuses to start without them.
- **Safety rails:** `npm run seed` refuses to run with `NODE_ENV=production` unless given `--force`. Tests refuse any database whose name doesn't end in `_test`.

## 7. Before production

| Area | What's needed |
|---|---|
| **Payments** | Razorpay (UPI and cards) with order creation, webhook signature verification and idempotency keys; Razorpay Route for partner split payouts. Keep `payments` as the provider mirror and `revenues` as the ledger. |
| **Notifications** | Push (FCM/APNs) plus SMS/WhatsApp for proposals, confirmations, surprise teasers, check-ins and safety alerts. |
| **Media** | Signed uploads to S3/R2, image moderation, EXIF stripping, and private buckets for profile photos. |
| **Jobs** | Queue + scheduler (BullMQ/Redis or Agenda) for: proposal expiry, reminders, surprise teaser timing, auto-complete after the date, and weekly payouts. |
| **Verification** | Selfie liveness and ID provider; partner KYC (FSSAI/GST) document checks. |
| **Safety ops** | Admin audit log; emergency-contact share with live location; SLA tracking on reports. |
| **Security** | Session rotation and revocation (a sessions collection); password reset and email verification; login rate limiting at the edge; secrets manager; set `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false`. |
| **Data** | MongoDB Atlas replica set, which enables multi-document transactions around booking + payment + ledger; backups; PII retention policy (DPDP Act). |
| **Observability** | Structured logs, request IDs, metrics, error tracking, uptime checks. |

---

## 8. Pages → API map

| Page | API |
|---|---|
| `/signup`, `/partners`, `/login` | `POST /auth/register`, `POST /auth/login` |
| `/onboarding` | `PATCH /users/me` (sets `onboarded`), optional `POST /couples/invite` |
| `/app` (home) | `GET /proposals`, `/bookings`, `/users/discover`, `/venues`, `/couples/me` |
| `/app/discover`, `/app/people/[handle]` | `GET /users/discover`, `GET /users/:handle` |
| `/app/propose/[handle]` | `GET /venues`, `POST /proposals` |
| `/app/proposals/[id]` | `GET /proposals/:id`, `POST …/accept · customize · confirm · decline` |
| `/app/dates` | `GET /proposals`, `GET /bookings` |
| `/app/bookings/[id]` | `GET /bookings/:id`, `POST …/cancel`, `POST …/feedback` |
| `/app/date-lab` | `POST /date-lab/generate`, `POST /bookings` (`lab`) |
| `/app/surprise` | `POST /bookings` (`surprise`, gift + hint) |
| `/app/memories` | `GET/POST/DELETE /memories`, `POST /media?kind=memory` |
| `/app/experiences` | `GET /venues`, `POST /bookings` (`marketplace`) |
| `/app/profile` | `PATCH /users/me`, `/media?kind=profile`, `/couples/*`, `/blocks` |
| `/partner` | `/partner/*` |
| `/admin` | `/admin/*` |

**Seed data (Dehradun launch).** `npm run seed` creates 163 people: 120 generated Gen Z profiles (ages 19–27) from pools of names, Dehradun neighbourhoods, interests, prompts and avatars with a fixed random seed, plus hand-written demo accounts. It also creates 11 couples, 15 fictional Dehradun venues (12 live, 3 pending), 30 days of booking history with payments, ledger entries and guest feedback, 180 historical proposals, and safety reports. Seeded accounts are listed in the README.

**Localisation lives in three places that must stay in sync:**
- the interest, food and date-style labels in `backend/src/seed/catalog.ts` and `frontend/src/lib/constants.ts`, because compatibility matches on labels;
- the Date Lab keys in `backend/src/services/experience.ts` (`FOOD_VENUE`, `ACTIVITY_VENUE`, `TIER_RANGE`) and `CUISINES`, `ACTIVITIES` and `TIERS` in the frontend;
- the pricing copy: Mingleo Plus ₹99/mo, Couple Pass ₹149/mo, Partner Pro ₹799/mo, featured placement from ₹1,499/week.
