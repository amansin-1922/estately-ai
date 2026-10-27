# Phase 6 — Hosted Groq AI for Estately AI

This update uses GroqCloud whenever `GROQ_API_KEY` is configured server-side.
Without that key, local development continues to use Ollama at `127.0.0.1:11434`.
The following four endpoints use the new provider: qualification, conversations, matching, and public chat.

## Local setup
1. Add `GROQ_API_KEY=gsk_...` to `.env.local` only.
2. Optionally add `GROQ_MODEL=openai/gpt-oss-20b`.
3. Run `npm run typecheck`, `npm run lint`, `npm run build`, then `npm run dev`.
4. Test with a fictional buyer. Keep personal data out of prompts and testing.

## Vercel setup
1. In the active `estately-ai-8vq4` project, go to Settings → Environment Variables.
2. Add `GROQ_API_KEY` as a server-only sensitive/secret variable and `GROQ_MODEL=openai/gpt-oss-20b`, for Production (and Preview if needed).
3. Redeploy the latest `main` commit.
4. Keep Vercel Authentication protection during testing.

No Groq key is included in these files. Never commit `.env.local`, expose `GROQ_API_KEY` under `NEXT_PUBLIC_`, or paste secrets into chats.

## Limitations
- Hosted model output should never be taken as verified facts. Listing details must be confirmed from Supabase.
- The existing per-instance in-memory limiter is NOT sufficient for public production traffic. Add persistent rate limits, abuse detection, and a human-verified contact/consent flow before public launch.
- Free-tier availability and rate limits can change. Configure spending limits and monitoring.
- Provider errors in public chat fall back to a generic response instead of showing private provider details.
