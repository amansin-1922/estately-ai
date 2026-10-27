# Estately AI — Complete Phase 4B

**Start here:** [`PHASE4B-SETUP.md`](PHASE4B-SETUP.md) for safe upgrades from your working Phase 4A and exact Windows instructions.

Includes **all previous phases** (dashboard, Supabase login and leads, AI qualification, buyer-chat simulator) plus:

- Inventory CRUD: verified properties, asking prices, BHK, locality, amenities, optional images and Active/Paused/Sold status.
- Ollama-assisted matches: deterministic shortlist with human-reviewable fit factors and optional AI-generated explanations.
- Site visits: create availability slots, request a visit, manually confirm/cancel/complete; concurrent active slot booking is blocked in PostgreSQL.
- New Supabase RLS tables: `properties`, `property_visit_slots`, and `site_visits`.

**All new data is user-owned.** Existing Supabase records are retained when running the non-destructive `supabase/phase4b-properties-visits.sql`. Do NOT rerun the initial Phase 2 migration over a populated leads table.

---

## Previous phase notes

# Estately AI — Technorich Real Estate Agent (Phase 2)

This is an upgraded version of the Phase 1 Next.js demo with email/password authentication via Supabase Auth and lead records persisted in a Supabase table with row-level security (RLS). It does **not** include OpenAI, WhatsApp, live property data or site-visit scheduling.

## Setup

1. Back up your current project. Do **not** share `.env.local`, any Supabase password, or any secret/service-role key.
2. Open Supabase Dashboard > Authentication > Users. Create a user with an email you control; select the email-confirmed option if presented. Disable public self-service signups for this internal-use dashboard.
3. Open SQL Editor and run `supabase/phase2-leads-rls.sql` **only if your existing `public.leads` table is empty**. It adds `user_id`, applies ownership policies and grants `authenticated` access. For existing rows, arrange ownership/migration first instead.
4. In `.env.local` next to `package.json`, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using your own project values. Never use a secret/service-role key in `NEXT_PUBLIC_*`.
5. In this project folder run `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, then `npm run dev`.
6. Visit http://localhost:3000, sign in, create a **fictional** lead, reload the page, edit status and notes and check the record in Supabase Table Editor. Sign out to ensure the login screen appears.

## Security / product limitations

- Auth is email/password Supabase Auth. The dashboard is gated on the client, while RLS in the **database** is the actual authorization layer.
- Users can access **only their own** leads; sharing leads across a sales team will require an organization/team ownership model and rewritten RLS policies.
- The existing enquiry form is for **signed-in staff**, not a publicly accessible customer lead form. Public intake needs server-side validation, rate limiting, spam defense and consent procedures.
- Existing Phase 1 browser leads are not migrated automatically. No fictional sample leads are inserted into your database.
- Only the most recent 1,000 leads are fetched by this demo; paginate before deploying at scale.
- Browser session tokens are persisted by Supabase. Evaluate stronger session management and production security before deploying to customers.
- Run `npm audit` and review findings before publishing. Dependency install/build could not be verified in the generating environment.

Detailed steps: `PHASE2-SETUP.md`.


## Free local AI upgrade
See [`FREE-LOCAL-AI-SETUP.md`](FREE-LOCAL-AI-SETUP.md).


## Phase 4A

See `PHASE4-SETUP.md` for private buyer conversation simulation with Ollama and Supabase.


## Phase 5: Public Website Chatbot (WhatsApp deferred)

See **PHASE5-WEBSITE-CHAT-SETUP.md** for migration, secret-key setup, verified public chat links, buyer consent, property inventory, Ollama replies, and site-visit requests. Your previous workspace routes and features are retained.
