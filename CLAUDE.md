# CLAUDE.md

> ⚠️ Before changing any backend, RLS, booking, worker, or quote code — or removing anything that looks unused — read LOAD-BEARING.md first. Much of what looks like inconsistency or dead code is deliberate and load-bearing.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Hrein Gæði** — an Icelandic cleaning service (Reykjavík). This is a static-site + serverless stack deployed on Vercel with Supabase as the backend. There is no build step, no bundler, no framework. Every HTML file is self-contained.

## Development

No build step. To work on the site:
- Open HTML files directly in a browser, or serve locally: `npx serve .`
- Vercel serverless functions live in `/api/` and run as Node.js ESM (`import`/`export default`). They cannot be run locally without Vercel CLI.
- Test API functions: `npx vercel dev` (requires Vercel CLI and env vars)

Required environment variables (set in Vercel dashboard):
- `RESEND_API_KEY` — email sending via Resend
- `NOTIFICATION_EMAIL` — internal recipient for booking/quote/contact notifications
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — used by serverless functions only
- `CRON_SECRET` — guards the `/api/keep-alive` cron endpoint

The Supabase anon key is public and embedded directly in every HTML file (intentional — it's safe with RLS policies).

## Architecture

### Two separate portals

**Public site** (`index.html`, `services.html`, `about.html`, `contact.html`, `booking.html`):
- Static HTML + inline CSS + inline JS
- Bilingual (Icelandic/English) via `<span class="is">` / `<span class="en">` toggled by `body.lang-is` / `body.lang-en` CSS classes
- Shared header/nav/footer pattern **is copy-pasted** into every file — there is no shared component system. Any nav/footer change must be applied to all 4 public pages identically.
- Supabase used client-side for: booking submission → `bookings` table, company quote submission → `company_quotes` table, contact form → `/api/notify`

**Staff portal** (`login.html`, `dashboard.html`, `worker.html`, `signup.html`):
- Also static HTML + inline CSS + inline JS
- `login.html` routes by role: `admin`/`manager` → `dashboard.html`, `worker` → `worker.html`
- Each portal page re-checks role on load and redirects if wrong role accesses it
- `dashboard.html`: full admin/manager view — bookings, finance, workers, schedule, invites, discount codes, quote requests (Fyrirspurnir)
- `worker.html`: worker-facing job list — today's jobs, upcoming, completed (Lokið). Jobs fetched via two parallel queries both scoped to `worker_id = auth.uid()`.

### Supabase schema (key tables)

| Table | Purpose |
|---|---|
| `bookings` | All customer bookings. `worker_id` (TEXT) holds the worker's Supabase UUID. Status values: `Pending`, `Confirmed`, `Done`, `Cancelled`. |
| `company_quotes` | B2B/housing quote requests from the public form. Status values: `new`, `contacted`, `closed`. `notes` field has the format `Tegund: <type>\n\n<actual notes>`. |
| `users_meta` | Maps `auth.uid()` → `role` (`admin`, `manager`, `worker`) and `full_name`. |
| `discount_codes` | Promo codes with type/value/validity/usage limits. |

RLS policies: workers can SELECT and UPDATE only their own rows in `bookings` (matched by `worker_id = auth.uid()::text`). Admins/managers have broader access via role-checked policies.

### Serverless API (`/api/`)

All functions are ESM, deployed as Vercel serverless functions:

- `notify.js` — dispatches email via Resend. Accepts `{ type, data }` where `type` is `booking`, `company_quote`, `contact`, `confirm`, or `cancel`. Sends both internal notification and customer confirmation where applicable.
- `calendar.js` — Google Calendar integration for booking events.
- `validate-discount.js` — validates discount codes against the `discount_codes` table.
- `subscribe.js` — email list subscription.
- `keep-alive.js` — pings Supabase every 3 days (Vercel cron, `vercel.json`) to prevent free-tier pausing.

### Mobile nav pattern

The hamburger menu (`toggleMenu()`) is duplicated across all 4 public pages. The `.mobile-menu` div contains all nav links including a muted "Innskráning" login link at the bottom (below a `.mobile-menu-divider`). The desktop `<nav>` is hidden at ≤768px; the hamburger appears.

## Key conventions

- **No shared components** — headers, footers, and nav are copy-pasted. Touch all 4 files when changing shared UI.
- **`showView(view)`** in `dashboard.html` — central routing function. The views array, titles object, and per-view data-load calls must all be kept in sync when adding a new dashboard tab.
- **`worker_id` is TEXT** containing the worker's Supabase UUID — always cast with `::text` in RLS policies when comparing to `auth.uid()` (which returns `uuid`).
- **Icelandic is primary** — all user-visible strings should be Icelandic first. English is secondary via the `lang-is`/`lang-en` toggle.
- **`icelandic-audit.md`** — line-level inventory of all Icelandic UI strings across every page. Update it when adding new user-visible text.
