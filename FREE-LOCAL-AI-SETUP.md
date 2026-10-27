# Free Local AI for Estately AI — Windows

This version replaces paid OpenAI calls with a local Ollama model. Supabase authentication, RLS and lead storage are unchanged.

1. Install Ollama for Windows: https://ollama.com/download/windows
2. Open a NEW PowerShell terminal and run `ollama --version`.
3. Download the free model: `ollama pull qwen2.5:3b` (a one-time multi-GB download).
4. Test locally: `ollama run qwen2.5:3b` then ask a question; type `/bye` to exit.
5. In the new project's root `.env.local`, copy your TWO Supabase configuration lines from the working Phase 3 folder and add `OLLAMA_MODEL=qwen2.5:3b`. **Do not put an OpenAI secret key here.**
6. In Supabase, keep the existing Phase 2 ownership policies and Phase 3 AI columns; do not rerun migrations unless needed.
7. In the inner Next.js project directory (where `package.json` exists), run `npm install`, `npm run typecheck`, `npm run lint`, then `npm run dev`.
8. Log in at http://localhost:3000 (or the port printed), open your test lead and press `Analyze with AI`.

**Requirements and limitations**
- Ollama must be running while analyzing; its default API is http://127.0.0.1:11434.
- Local generation is slower than a hosted model, especially without a dedicated GPU. Around 8GB RAM is a practical starting point for small models; system requirements vary.
- The local AI endpoint is used by the Next.js SERVER running on the same Windows PC. This does **not** work unchanged on Vercel or other cloud deployments.
- Never expose Ollama's port to the public internet. Keep Supabase RLS enabled and test with fictional leads.
- Model answers are suggestions only; salespeople review drafts before contacting clients.
- If the previous Phase 3 developer server is active, stop it with Ctrl+C. Also verify `OPENAI_API_KEY` previously pasted into chat has been revoked.

Troubleshooting:
- `ollama` is not recognized: restart VS Code/PowerShell after installing Ollama.
- `Cannot reach Ollama`: start the Ollama desktop app; test `Invoke-RestMethod http://localhost:11434/api/tags` from PowerShell.
- `Local AI request failed`: run `ollama list` to confirm qwen2.5:3b downloaded.
- Port 3000 busy: stop the old Next.js server; do not run two versions simultaneously.
- Missing Supabase config: `.env.local` should be beside `package.json`, not in the parent extracted folder.
