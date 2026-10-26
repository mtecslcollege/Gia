# GIA migration 2 (foundation) - how to apply

Files (copy into `supabase/migrations/`, in this order):
1. `20261026000000_add_exam_roles.sql`  adds roles `exam_officer`, `registrar`
2. `20261026000100_foundation.sql`     everything else

Apply on a Supabase BRANCH or a copy of the project first. Take a backup before production.
Apply file 1, let it commit, then file 2 (Supabase CLI / Lovable do this automatically).

## What it changes (existing data is kept)
- New: audit_log, academic_years, terms, classes, subjects, class_subjects, teaching_assignments,
  enrolments, grading_scales, grade_boundaries, grade_status_history, fee_charges,
  attendance_sessions, attendance_records, views grade_results and student_fee_balances.
- students: new `class_id` (filled from class_name), case-insensitive unique admission number.
- school_settings: school name/motto/contact/pass mark/class-position switch (off) + bootstrap flag.
- grades: marks locked after submit; status changes only through `transition_grades()`;
  parents see Published only; teachers write only for assigned class+subject+enrolled pupils.
- payments: append-only; refunds only through `reverse_payment()` (management only).
- fees_due becomes DEPRECATED: copied once into fee_charges as an opening balance.
- Helper functions are no longer callable by anonymous users.

## After applying you MUST (the database is deliberately empty of policy)
1. Create the current academic year (is_current = true) and its terms.
2. Add subjects, link classes, create teaching_assignments and enrolments.
3. Enter GIA's grading scale (grading_scales + grade_boundaries); results cannot be published without it.
4. Confirm with GIA: the verifier/approver role matrix, rounding rule, pass mark, class positions.
5. Regenerate `src/integrations/supabase/types.ts`.

## Not in this migration (next)
Result PINs and public result checker, offline sync tables, restricting teachers' view of guardian/DOB
fields (needs an app change), demo-row cleanup (GIA001-GIA020 and 3 sample notices came from migration 1).

## Test
`node tests/migration-permissions.test.mjs` (needs `npm i @electric-sql/pglite` and the original migration saved as m1.sql).
46 checks ran against real Postgres (PGlite) with stubbed Supabase auth.
