# GIA result PIN + public result checker (migration 3)

Apply AFTER migration 2 (foundation). Files:
- `supabase/migrations/20261026000200_result_pins.sql`
- `app/src/lib/result-checker.functions.ts`  server function (type-checked, `vite build` passes)
- `app/src/routes/results.tsx`               mobile-first public page at /results (copy both into src/; the route tree regenerates on build)
- `tests/pin-checker.test.mjs`               40 checks on real Postgres (PGlite)

## How it works
Admin (principal/VP/admin/proprietor) -> `issue_result_pin(student, term)` or `issue_result_pins_for_class(class, term)`
-> PIN shown once (10 random chars, ~50 bits), stored only as bcrypt hash, scoped to ONE pupil + ONE term.
Parent -> /results -> server function -> `verify_result()` (service role only) -> published grades only.

## Security properties (each is tested)
- No plaintext PIN anywhere (DB, audit log, attempts log). Managers cannot even read the hash column.
- Wrong PIN and unknown pupil ID return the identical response; timing is padded with a dummy bcrypt.
- Lockouts: 5 failures per pupil+connection, 30 per connection, 40 per pupil per hour (15 min / 1 h windows).
- Revoked, expired, reissued-old and wrong-term PINs fail. A PIN cannot open another pupil.
- Only grades with status Published are returned; no guardian, DOB, fees or other-term data.
- Browsers can never call verify_result (anon and signed-in users both refused).
- Issue / revoke / reissue are audited without secrets. Response sent with Cache-Control: no-store.

## Setup you must do
1. Set an env var RESULT_CLIENT_SALT (random string) on the server; the service-role key stays server-side only.
2. Run `select purge_result_attempts();` monthly (Supabase cron) to drop attempt logs older than 90 days.
3. Regenerate `types.ts`; add a link to /results from the public site (the static site can link to the portal URL).
4. Issue PINs on paper slips or through a verified channel only; reissue needs a written reason (identity checked).

## Known limits / decisions for GIA
- Behind a proxy the client IP comes from x-forwarded-for; confirm the host sets it honestly.
- Average is unrounded in the database (page shows 1 decimal). Rounding rule and class position are NOT decided.
- Subjects appear only after each is Published; there is no "whole term published" switch yet.
- Not included: QR / verification reference for employers (Phase 12), CAPTCHA (add Cloudflare Turnstile if abuse appears).
- The page UI was type-checked and built but not viewed in a browser.
