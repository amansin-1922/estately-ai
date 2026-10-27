# Estately AI Phase 4A — Free local buyer conversation simulator

## What's new

- **Buyer conversation simulator** inside each lead detail drawer.
- Type a **fictional** buyer message; local Ollama (`qwen2.5:3b`) drafts an answer for human review.
- Conversation persists privately in Supabase (`lead_conversations` table).
- This does **not** send WhatsApp messages, access real property listings, or book visits.
- Phase 3 lead qualification and Supabase authentication remain in place.

## 1. Back up working Phase 3

Copy your previous `technorich-estate-agent-nextjs` folder somewhere safe.

## 2. Extract Phase 4 ZIP; open the inner folder in VS Code

Expected folder: `technorich-estate-agent-nextjs` containing `package.json`.

## 3. Environment

Copy your existing **private** `.env.local` into the new project (not included in ZIP):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
OLLAMA_MODEL=qwen2.5:3b
```

Do NOT copy any old compromised OpenAI key. `.env.local` must stay private.

## 4. SQL migration

In Supabase **SQL Editor**, run `supabase/phase4-buyer-conversations.sql`.

It adds a new table, indexes, and per-user RLS. It does not modify the existing leads.

## 5. Local requirements

Start Ollama (on Windows, it normally runs in the tray) and ensure:

```
ollama list
```

lists `qwen2.5:3b`. If missing:

```
ollama pull qwen2.5:3b
```

## 6. Run

From the **inner** folder containing `package.json`:

```
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Visit `http://localhost:3000` or the port shown.

## 7. Test

1. Sign in using your existing Supabase account.
2. Open All Leads, click Rahul Sharma.
3. Scroll to **Buyer conversation simulator**.
4. Type: `I want a 2 BHK in Patna, budget 75 lakh, and would like a visit next weekend.`
5. Click **Save buyer message & generate AI draft**.
6. Confirm two messages appear, one simulated buyer message and one AI response draft.
7. Refresh, reopen Rahul, and check chat persists.
8. In Supabase Table Editor, check `lead_conversations` contains records.
9. Test with your second account: it must not see Rahul's conversation. Your first account must not see the second account's messages.

## Important limitations

- Conversation is an **internal demo**, not customer messaging.
- Avoid real names, phone numbers, addresses, IDs, sensitive medical/financial information. Simple PII redaction is not guaranteed.
- You still need a verified property catalogue, site-visit calendar, human approvals, messaging consent, and deployment architecture for production.
- Ollama runs on your laptop: `localhost` on Vercel is not your laptop.
- The local model can invent details; review every draft.
