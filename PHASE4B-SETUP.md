# Estately AI Phase 4B — Property inventory, matching and site-visit bookings

This package **includes the complete prior application** (Phase 1 dashboard, Phase 2 Supabase authentication and leads, Phase 3 Ollama AI qualification, and Phase 4A private buyer conversations). Phase 4B adds property inventory, property matching, availability slots and human-controlled visit scheduling.

## 1. Protect your working project

- Copy your existing **working Phase 4A folder** to a backup location.
- Extract the new ZIP and open the **inner** folder named `technorich-estate-agent-nextjs` in VS Code (the folder containing `package.json`).
- Copy `.env.local` from your working Phase 4A project to the **inner** Phase 4B folder, beside `package.json`. Do not copy `.next` or `node_modules`.
- `.env.local` must have these entries (replace placeholders with your existing credentials):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
OLLAMA_MODEL=qwen2.5:3b
```

Do not add a service-role/secret Supabase key to NEXT_PUBLIC variables. **The OpenAI key is NOT needed.** Revoke any formerly exposed key.

## 2. Run the new SQL migration in the existing Supabase project

1. Open https://supabase.com/dashboard, select the **same project used in Phase 4A**.
2. Choose **SQL Editor > New query**.
3. Open `supabase/phase4b-properties-visits.sql` in VS Code; copy the complete contents into the SQL Editor, then click **Run**.
4. In Table Editor, confirm three new tables: `properties`, `property_visit_slots`, and `site_visits`.
5. **Do not rerun the Phase 2 ownership migration** or reset your `leads` table. Phase 4B's SQL is non-destructive and does not delete prior leads, AI reviews or conversations.
6. If the migration returns a SQL error, stop; copy the error text (not API keys) and resolve it before opening Phase 4B UI.

**Access model:** All new records are scoped to the signed-in `auth.uid()`. The SQL requires every visit's lead and property slot to belong to the same user. Overlapping property time slots are rejected; a unique partial index also blocks two active ('Requested' or 'Confirmed') visits for one slot. A visit remains **Requested** until a salesperson manually confirms it. This is a per-account internal demo; organization-wide sharing requires a separate tenancy design.

## 3. Install and verify on Windows

Open the Phase 4B **inner** project folder in VS Code, then **Terminal > New Terminal**:

```powershell
# Confirm package.json exists in the folder:
dir package.json
npm install
npm run typecheck
npm run lint
npm run build
```

These checks must succeed before a public deployment. `npm audit` identifies dependency vulnerabilities; inspect fixes instead of immediately using `npm audit fix --force`.

Stop any earlier Phase 4A Next.js server with `Ctrl+C`, then:

```powershell
npm run dev
```

Open the localhost URL shown in the terminal (usually `http://localhost:3000`; if occupied, it may be `3001`). **Keep Ollama running on your laptop.** Confirm `ollama list` shows `qwen2.5:3b`.

## 4. Test Phase 4B with fictional data

### Property inventory

1. Sign in with the Supabase user that owns Rahul Sharma.
2. Click **Properties** in the sidebar, then **Add verified listing**.
3. Example ONLY: Title `Demo Bailey Road Residency`; City `Patna`; Locality `Bailey Road`; Price `7200000` (=₹72 lakh); 2 BHK; 2 bathrooms; area 1150 sq ft; amenities `Parking, Security, Lift`; status `Active`.
4. Submit and verify the property appears. Reload and confirm it remains. Check Supabase `properties` table.
5. Add a second example: `Demo Boring Road Heights`, Patna, Boring Road, ₹85 lakh, 3 BHK, Active.
6. Try editing, pausing and reactivating a listing.

### Ollama matching

1. Open **All Leads**, select **Rahul Sharma**.
2. Scroll to **Match verified properties**.
3. Set city `Patna`, locality `Bailey Road`, max budget `7500000` and bedrooms `2`.
4. Click **Match properties**. You should see the Bailey Road property ranked high, an explanation when Ollama is reachable, and factual tradeoffs for less suitable listings.
5. If local Ollama fails, the system displays **rule-based results** with a warning instead of inventing AI responses.

### Site-visit booking

1. Open **Properties > Available site-visit slots**. Choose the Active Bailey Road listing and add a future date/time (for example tomorrow, 4:00 pm, for 60 minutes).
2. Open **Site visits**; choose **Rahul Sharma**, the Active Bailey Road property and the new time slot.
3. Click **Request visit**. A new record appears as **Requested**.
4. Switch to **Confirmed** only after checking with a salesperson; at that point the lead status becomes `Visit Booked`.
5. Open another browser tab/session and try to book the **same time slot** for another test lead. The database must reject the duplicate active booking.
6. Change the original visit status to **Cancelled**, refresh, and verify the slot becomes bookable again.
7. In the second Supabase account, confirm these properties and bookings are **not visible**.

### Regression test earlier phases

- Phase 1: dashboard and enquiry creation still work.
- Phase 2: Supabase login and private lead storage still work.
- Phase 3: AI buyer qualification for Rahul Sharma still works.
- Phase 4A: simulated buyer messages and AI drafts still persist after refreshing.
- Phase 4B: inventory and appointments persist after refreshing.

## Important limits before client deployment

- Ollama is called at `http://127.0.0.1:11434` by the **Next.js server**; local AI does not automatically work on Vercel or an external server.
- This build does not send WhatsApp messages, process actual payments, synchronize Google Calendar, or confirm visits without an authorized person.
- Listing prices/availability come only from records you enter; verify them before sharing them with customers.
- No per-organization teams or role permissions yet. For commercial use, implement organization tenancy, staff roles, robust auditing, rate limits, privacy notices and consent, error monitoring, backups, and integration tests.
- Slots cannot be deleted if they are referenced by a visit. This preserves booking history; pause a property instead of deleting a listing with history.
- The AI fit score is an **indicative, explainable ranking**, not a guarantee of property suitability; salespeople should verify affordability and needs.
- Unit values are in **Indian rupees**; enter `7200000` for ₹72 lakh. Site-visit times are displayed in your laptop's timezone.

## Troubleshooting

| Problem | Fix |
|---|---|
| `ENOENT package.json` | `cd` into the **inner** `technorich-estate-agent-nextjs` folder; run `dir package.json`. |
| `relation public.properties does not exist` | Run `supabase/phase4b-properties-visits.sql` in the **same Supabase project** as Phase 4A. |
| `new row violates row-level security policy` | Ensure you signed in, used the correct Supabase project, and ran the complete Phase 4B SQL. |
| `duplicate key ... one_live_visit_per_slot` | The slot is already requested/confirmed. Select another available slot or cancel the earlier request. |
| `Could not match with Ollama` | Check `ollama --version` and `ollama list`. The app will still show a rule-based shortlist. |
| Multiple Next.js dev servers | Stop the older server using `Ctrl+C`; use the terminal's displayed localhost port. |
| Extra lockfile warning | Remove **only** the stray outer-folder `package-lock.json` after confirming which folder contains your actual project. |

**Build verification:** The source files were parsed for TypeScript/TSX syntax in the preparation environment. Full dependency installation and Next.js production build were unavailable there; verify with the commands above on your Windows laptop before making public claims.
