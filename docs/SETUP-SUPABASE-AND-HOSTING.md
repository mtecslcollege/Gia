# GIA portal: Supabase database + free hosting (development)

Tested by Claude: the project builds for Netlify (`NITRO_PRESET=netlify vite build` -> `dist/` + `.netlify/functions-internal`), and the
SQL migrations 1-4 pass their database tests on real Postgres. NOT tested: your actual Supabase and Netlify accounts.

## 0. Rules for the development phase
- Use FAKE pupils only. Free Supabase has no automatic backups and pauses after 7 days idle (see section 6).
- The `.env` that was inside an earlier zip must be treated as exposed: rotate those keys if they belonged to a project you keep.
- Never commit `.env`. Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser or in a `VITE_` variable.

## 1. Create the database (Supabase)
1. supabase.com > New project. Name `gia-dev`. Strong database password (save it in a password manager). Pick a region; Europe
   (London or Frankfurt) is usually the lowest-latency choice from West Africa, but test it, or choose another region if you prefer.
2. Later create a SECOND project `gia-prod` (owned by MTeC/GIA) for real data. Do all testing on `gia-dev` first.
3. Project Settings > API: copy the Project URL, the publishable (anon) key and the secret service_role key.

## 2. Load the schema (in this exact order)
Easiest way: Supabase dashboard > SQL Editor > New query, paste each file from `supabase/migrations/`, run, and wait for Success:
1. `20261004175448_...sql` (original: tables, roles, demo data)   2. `20261026000000_add_exam_roles.sql`   (run it ALONE)
3. `20261026000100_foundation.sql`   4. `20261026000200_result_pins.sql`   5. `20261026000300_admissions.sql`   6. `20261026000400_application_form.sql` (creates the private file bucket)
Or with the CLI: `npm i -g supabase`, `supabase login`, `supabase link --project-ref YOUR-REF`, `supabase db push`.
If a file errors, stop and send the error to Claude; do not skip files. Migration 1 inserts 20 fake pupils and 3 sample notices (fine for dev).
Then: Authentication > URL Configuration: set Site URL to your Netlify address (and `http://localhost:3000` / `http://localhost:5173` in Redirect URLs).
Authentication > Providers > Email: for development you may turn "Confirm email" off so test accounts sign in at once.

## 3. FIRST account = school owner
The first person to sign up becomes principal + admin automatically (one time only). Sign up yourself BEFORE sharing the site link.
Everyone after that waits as "pending" until an admin approves them and gives a role.

## 4. Run locally
```
cp .env.example .env      # fill in the 5 values
npm install --legacy-peer-deps
npm run dev
```

## 5. Host free on Netlify
1. Push the project to GitHub (private repo; `.env` is already ignored).
2. app.netlify.com > Add new site > Import from Git > pick the repo. `netlify.toml` already sets: build `npm run build`, publish `dist`,
   `NITRO_PRESET=netlify`, Node 22.
3. Site configuration > Environment variables: add the same 5 names as `.env.example`. Mark `SUPABASE_SERVICE_ROLE_KEY` as secret.
4. Deploy. Copy the `https://....netlify.app` address into Supabase Site URL (section 2). Every Git branch gets its own preview URL.
5. Check: home page, sign up / log in, /admissions form (submit a fake application, see it in /app/admissions), /results page loads.
Other free options: Cloudflare Workers/Pages is the project's default build target (also an official TanStack Start host; needs a
`wrangler.jsonc`; not tested here). Free-plan limits change often: confirm current limits on each provider's pricing page.

## 6. Free Supabase: avoid surprises
- Free projects PAUSE after 7 days with no activity and need a manual restore. The workflow `.github/workflows/keepalive.yml` pings the
  API twice a week (add the two repository secrets). Check the dashboard before demos.
- Free = 500 MB database, 2 projects, NO automatic backups. Before real pupils: move to the Pro plan (daily backups) on `gia-prod`.
- Manual backup now and then: `supabase db dump --linked -f backup.sql` (keep it private; it contains data).

## 7. Working with Claude and Lovable together
- The repo is the source of truth. Give Claude the zip or repo plus `CLAUDE.md`; apply Claude's migrations as NEW files in `supabase/migrations/`.
- `supabase/config.toml` still names the original Lovable Cloud project. If you move to your own Supabase, stop making database changes
  from the Lovable editor (they would go to the old backend) and treat Lovable as design-only, or check Lovable's current docs for
  connecting your own Supabase. Do not edit the same files in both tools at once; use a `dev` branch and review diffs.
- After each migration: regenerate types (`supabase gen types typescript --linked > src/integrations/supabase/types.ts`) and rerun tests.

## 8. Go-live checklist (later)
`gia-prod` on Pro plan with backups, strong admin accounts, remove demo pupils, correct academic year/terms/classes/grading scale,
email confirmation ON, custom domain with HTTPS, rotate all keys, restore test from a backup, staff training.
