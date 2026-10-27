# Estately AI Phase 7 — Persistent public chatbot rate limits

This patch modifies only `src/app/api/public-chat/route.ts` and adds `supabase/phase7-public-rate-limits.sql`. It contains no keys or .env.local files.

## Install order (important)

1. Backup your live Supabase database or ensure a recent backup can be restored.
2. In the SAME Supabase project as the live site, open SQL Editor, paste **the entire** `supabase/phase7-public-rate-limits.sql`, run it once. It only creates a rate-counter table and a restricted RPC; it does not modify existing CRM tables.
3. Verify the new function is restricted to `service_role` (SQL below).
4. Extract this ZIP directly into the **inner** `technorich-estate-agent-nextjs` folder, overwriting the API file.
5. Run `npm run typecheck`, `npm run lint`, `npm run build`; test locally; then `git add src/app/api/public-chat/route.ts supabase/phase7-public-rate-limits.sql`, commit, and push to `main`.
6. Verify Vercel Ready, and test a NEW fictional enquiry, AI answer and site-visit request. Keep Vercel Authentication enabled.

**If the SQL is not applied before deployment:** the public chatbot will fail closed with HTTP 503, not bypass the limiter. To recover, apply the SQL first or roll back the deployment.

## Rate limits (demo defaults)

| Scope | Limit |
|---|---|
| GET requests per IP | 60/min |
| POST requests per IP | 20/min |
| New enquiries per IP | 4/min |
| New enquiries per chatbot | 60/hour |
| AI messages per buyer session | 6/min |
| AI messages per chatbot | 80/hour, 300/day |
| Visit requests per buyer session | 4/min |

Pre-existing 15-message/session cap still applies. Limit errors return HTTP 429. Rate counters are atomic and shared by Vercel instances. Raw IP addresses are not stored: identifiers are hashed with an HMAC using the server-side Supabase secret key. As with any IP-based limit, networks sharing one public IP may share a quota.

## Read-only verification queries

```sql
SELECT relname, relrowsecurity FROM pg_class WHERE oid = 'public.public_chat_rate_limits'::regclass;

SELECT
  has_function_privilege('anon', 'public.consume_public_chat_rate_limit(text,text,integer,integer)', 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', 'public.consume_public_chat_rate_limit(text,text,integer,integer)', 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', 'public.consume_public_chat_rate_limit(text,text,integer,integer)', 'EXECUTE') AS service_role_can_execute;
```

Expected: `relrowsecurity=true`, `anon_can_execute=false`, `authenticated_can_execute=false`, `service_role_can_execute=true`.

## Maintenance

Rate-limit records expire logically when their time window ends but remain in the table. Schedule this cleanup daily in Supabase Cron (after verifying cron support), or run periodically during maintenance:

```sql
DELETE FROM public.public_chat_rate_limits
WHERE window_start < now() - interval '3 days';
```

This is NOT an authorization audit. Before public launch, add edge bot protection, consider independent spending limits/alerts for Groq, enforce same-origin/CORS per deployment, review service-role API authorization, and test 2-agency isolation. Do not remove Vercel Authentication based on this patch alone.
