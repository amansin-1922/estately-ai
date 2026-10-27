# Estately AI — Phase 3: AI Lead Qualification

## BEFORE ANYTHING: Test Row Level Security

1. In Supabase SQL Editor check `select tablename, rowsecurity from pg_tables where schemaname='public' and tablename='leads';` — expect `true`.
2. In SQL Editor check `select policyname, cmd, qual, with_check from pg_policies where schemaname='public' and tablename='leads';` — expect four `lead_*_own` policies, each using `auth.uid() = user_id`.
3. Create test account B in Supabase Authentication -> Users. In incognito, sign into Estately with B. Account B should NOT see test lead Rahul Sharma created by account A. Create fictional lead under B; A should NOT see it after refresh. Test that each account can edit only its own lead.
4. Do not turn off RLS. Never use a secret/service-role key in `NEXT_PUBLIC_` variables.

## Upgrade the application

1. Back up your Phase 2 folder and keep your existing `.env.local` private. Do not upload it.
2. Extract this ZIP and open `technorich-estate-agent-nextjs` in VS Code.
3. Copy your existing `.env.local` into the NEW project's root (next to package.json), then ADD this SERVER-ONLY line:
   `OPENAI_API_KEY=your_openai_api_key_here`
   Optionally add `OPENAI_MODEL=gpt-4o-mini`.
4. In Supabase SQL Editor run `supabase/phase3-ai-qualification.sql` to add the AI review columns.
5. In the new project folder run `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev`.
6. Sign in. Go to All leads, click a fictional lead, then click **Analyze with AI**. Results should save in the same record in Supabase.

## How it works

- The browser sends a signed-in Supabase access token to `/api/qualify`.
- The server verifies that token via Supabase Auth and reads ONLY the owner's requested lead under RLS.
- The server sends **city, budget, type, source, status, interest** to OpenAI using a SERVER-ONLY key. Name, phone and email are intentionally excluded.
- OpenAI returns structured JSON (priority, summary, three questions, next step, draft message).
- The server saves the AI analysis to Supabase. The UI displays the result for human review; it does **not** send WhatsApp messages.

## Operational cautions

- Use fictional leads for testing and verify appropriate permissions before sending real customer data to an AI provider.
- There is a short per-lead anti-duplicate cooldown; production needs account-wide spend/rate limits and audit logs.
- AI priority is advisory only. It is not a credit, eligibility, or identity decision.
- Real WhatsApp is NOT connected, and no appointments are booked automatically.
- API billing is separate from ChatGPT subscription. Configure a spending budget in the OpenAI API platform.
