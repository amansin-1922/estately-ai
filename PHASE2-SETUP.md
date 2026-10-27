# Phase 2: Secure Supabase authentication and leads

## 1. Back up the existing Next.js project

Close the development server, then back up `technorich-estate-agent-nextjs` before replacing any source files. If you already created `.env.local`, keep it and do not share it.

## 2. Supabase Dashboard -> Authentication -> Users

Create a user with email and a strong password using **Add user**. Use an email you control. Use the confirmation option if offered. Disable self-service public sign-ups in Authentication settings for this internal dashboard. Do not use the anonymous key to bypass security.

## 3. Supabase Dashboard -> SQL Editor

Check in Table Editor that `public.leads` contains zero rows (or ask for a data migration first). Then run `supabase/phase2-leads-rls.sql`. It creates an ownership column, grants authenticated access, and enables SELECT/INSERT/UPDATE/DELETE policies restricted to `auth.uid()`. If you have existing real data, don't run this SQL as-is: first assign row owners and review the migration.

## 4. Create `.env.local` next to `package.json`

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

Do not use the Supabase secret/service-role key in browser environment variables.

## 5. Run commands in the INNER Next.js folder

```
npm install
npm run dev
```

## 6. Test

Open http://localhost:3000 (or the displayed port), log in, add one fictional lead, change its status and note, refresh the browser and confirm the lead persists. Verify the lead is in Supabase Table Editor. Sign out to check the login screen. For real clients, add team-aware access policies before deployment: this demo isolates leads per signed-in user, not a shared organization.

## Notes

- This phase replaces localStorage with Supabase. Old local demo leads are not automatically imported.
- RLS protects data in the database; the dashboard's login UI alone is not security.
- The staff-only enquiry form requires authentication. A public lead form should use a separately designed validated, rate-limited server endpoint later.
- Avoid live customer information while testing.
- `npm audit` should be reviewed before production deployment.
