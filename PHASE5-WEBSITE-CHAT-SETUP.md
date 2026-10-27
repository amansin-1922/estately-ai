# Estately AI Phase 5 — Public Website Chatbot

A **working local development upgrade** built on the Phase 4B fixed project.
WhatsApp is deliberately postponed. Do not replace your existing Supabase database.

## What is included

- Original Phase 1–4B pages: `/dashboard`, `/leads`, `/enquiry`, `/properties`, `/visits`.
- Original lead qualification, internal buyer conversation, and Ollama property matching.
- New staff-only `/website-chat` page that creates and manages a shareable buyer-chat link.
- New no-login `/chat/<slug>` buyer-facing experience with a property catalogue.
- Server-side `/api/public-chat` API for opt-in enquiry submission, AI conversation, conversation history, and site-visit requests.
- Separate, RLS-protected site configuration and private chat-session tables.
- Contact details stored in existing `public.leads`, with messages stored in `public.lead_conversations`.
- Explicit visit requests stored in existing `public.site_visits` with `Requested` status; a salesperson confirms them from `/visits`.

## Prerequisites

Phase 4B Supabase tables and policies must already exist. Stop any older `npm run dev` processes. Back up your working folder.

### Step 1 — Extract and open the inner project folder

Extract the ZIP. In VS Code open the **inner** `technorich-estate-agent-nextjs` folder containing `package.json`. `npm` won't work from the outer extracted folder.

### Step 2 — Copy your existing environment settings

Copy your previous Phase 4B `.env.local` to this inner folder, beside `package.json`.

Keep your current `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` exactly as before. Keep `OLLAMA_MODEL=qwen2.5:3b`.

Now in **Supabase Dashboard → your project → Project Settings → API Keys**, locate the **Secret key** (starts `sb_secret_`). Copy it securely to a **new non-public** entry in `.env.local`:

```
SUPABASE_SECRET_KEY=sb_secret_YOUR_SECRET_FROM_SUPABASE
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_URL=http://127.0.0.1:11434/api/generate
```

**SECURITY:** The Supabase secret key bypasses RLS. Never copy it into `NEXT_PUBLIC_*`, your browser, Git, screenshots, chat, or client-side JavaScript. The browser continues to use the publishable key. The only code reading `SUPABASE_SECRET_KEY` is the server route `src/app/api/public-chat/route.ts`.

### Step 3 — Apply one new non-destructive SQL migration

Supabase Dashboard → SQL Editor → New Query. Open `supabase/phase5-website-chat.sql` from this project, paste it in full and click **Run**.

It adds `public_chat_sites` and `public_chat_sessions` without changing your existing leads, qualification reports, conversations, properties or site visits. Existing private RLS policies remain in place. The new site configuration is owned by the currently signed-in user; visitor sessions have **no** anon or authenticated database table permissions.

### Step 4 — Start Ollama

In a separate PowerShell terminal, check Ollama:

```
ollama list
ollama run qwen2.5:3b
```

Type `/bye` to exit the interactive model. Leave the Ollama background service running. The server communicates with local Ollama. If the model is unreachable, the demo uses a simple safe fallback reply.

### Step 5 — Install and verify

In VS Code terminal, from inside the folder containing package.json:

```
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Use each command separately. Fix all errors before deployment. An online package installation/build could not be completed in the artifact creation environment, so verify locally.

Go to `http://localhost:3000`. If Next chooses port 3001, use the port it prints.

### Step 6 — Create your buyer chat link

1. Sign in with your existing Supabase staff account.
2. Under the sidebar, select **Website chatbot**.
3. Set the brand and greeting, then press **Create buyer chat link**.
4. Click **Open demo**. It opens a `/chat/estately-xxxxxxxx` URL and does NOT show the staff login form.
5. Ensure you have at least one Active property in the original **Properties** page. You may also add a future property slot there.

### Step 7 — End-to-end test with fictional information only

1. On the public chat page, use a fictional buyer name and fictional phone number (example 9000000002), city Patna, budget 75 lakh, 2 BHK.
2. Tick the specific enquiry consent checkbox and submit.
3. In the buyer chat, ask: `I want a 2 BHK in Bailey Road below 75 lakh. What options do you have?`
4. Expect an AI answer grounded in your Active listings; fallback answer if Ollama is unavailable.
5. Refresh the page. This browser tab keeps the session token in sessionStorage, so messages reload.
6. In your private dashboard, look for the new lead in **All Leads**, and open it to view saved buyer conversation.
7. In the public chat, select **Request a site visit**, choose a property and a future slot, and click **Request visit**.
8. In the private **Site visits** page, verify the request is pending; confirm it manually. The same slot should not be offered again.
9. Open a second incognito browser: it must **not** see chat history without its own token. Log in with your second staff account: it must **not** see the first account's leads.

### Important limits

- **Local only:** `localhost` links work only on your machine. A public URL requires a securely deployed app, HTTPS, anti-abuse protections, a privacy notice, and always-on Ollama hosting. Do not publish the local Ollama port 11434.
- **No WhatsApp:** This version does not send WhatsApp messages. WhatsApp is postponed deliberately.
- **Server key security:** This backend route uses the elevated Supabase key only after binding the chat to an enabled site and a hashed session token. It limits input length and includes basic single-process request throttling. Before a real public launch, add persistent rate limits, CAPTCHA / Turnstile, auditing, lead spam controls, secret rotation, and a published data retention/privacy policy.
- **Buyer consent:** Visitors must consent to an enquiry and storage; this is distinct from consent for marketing communications.
- **No auto-booking:** A visit is a `Requested` appointment until a salesperson confirms it.
- **No transactional guarantees:** AI text is for guidance; property details are based on currently Active listings in Supabase and must be confirmed by staff.
- **Phone privacy:** The phone and email are saved in Supabase for staff follow-up, but not included in model prompts by the public chat route.
- **Ollama fallback:** The local AI model may be slow. If unreachable, a non-AI fallback response will be used and noted in the buyer interface.

## Common errors

- `ENOENT package.json`: `cd .\technorich-estate-agent-nextjs` from the outer folder.
- `Public chatbot is not configured`: ensure `SUPABASE_SECRET_KEY` is set in **this Phase 5** `.env.local` and restart Next.js.
- `relation public_chat_sites does not exist`: run the Phase 5 SQL migration.
- 401 chat session expired: submit a fresh fictional enquiry; sessions expire after 7 days.
- Available properties empty: add an Active listing under the same Supabase staff account that owns the public link.
- No visit slots: create future visit slots in the Properties page; bookings cannot be confirmed by the AI.
- App still shows private login for `/chat/...`: stop the old Next dev server and start the Phase 5 project from its actual inner folder.

## Additional reference

See `README.md` and `PHASE4B-SETUP.md` for prior functionality.
