# GIA School Portal: handover for Claude (read this first)

Client project: Gbonkolenken International Academy (GIA), Makeni, Sierra Leone. Developer/owner: MTeC.
RULE 1: ADAPT, DO NOT REBUILD. Keep existing screens, layout components (src/components/gia/*), routes, auth and schema.
Wire real data into existing screens; add migrations; never replace the stack or rename existing tables/columns.
RULE 2: Never fake features. If the backend is missing, build it (migration + RLS + test) or say so.

## Stack
React 19 + TanStack Start/Router/Query, Tailwind, shadcn/ui, Supabase (Postgres + RLS + Auth). Server functions: `createServerFn`
(`*.functions.ts`, load `supabaseAdmin` by dynamic import inside handlers). Browser data access: `supabase` client with RLS.
Currency NLe (new leones), helper `leo()` in src/lib/mock.ts (only the helper is still used from mock.ts).

## What is REAL (uses the database)
login/roles/approval, students (list/detail/edit), school settings, Finance overview + Record Payment + Receipts + Fee Balances,
online application form (/admissions: 7-step wizard ported from the old static form, photo crop, document uploads to PRIVATE storage bucket application-files via signed upload URLs, printable A4 application letter + PDF) + admin Admissions review, file viewing, printing and Admit (migrations 4-5: applications, submit_application/decide_application/admit_application/attach_application_files),
result PINs admin (/app/result-pins), public result checker (/results), public pages.
## What is still MOCK (src/lib/mock.ts): grades entry, approval, attendance, classes, subjects, communication,
documents, parent/student/staff portals, dashboard numbers, users page partly. Convert these one at a time (see ROADMAP).

## Database (supabase/migrations, apply in order; never edit applied migrations, add new ones)
1 original (profiles, user_roles, students, parent_students, grades, payments, notices, school_settings)
2a roles exam_officer/registrar; 2b foundation (audit_log, academic_years, terms, classes, subjects, class_subjects,
teaching_assignments, enrolments, grading_scales/boundaries, grade_status_history, fee_charges, attendance_*, views grade_results and
student_fee_balances); 3 result PINs (result_pins, result_attempts, verify_result()); 4 admissions (applications; 5 full application form columns + storage bucket; pupil ID format GIA### is a default, confirm with GIA).
Key rules: payments and fee_charges are APPEND-ONLY (reversal via reverse_payment(), management only); grades change status only via
transition_grades(); teachers write marks only for assigned class+subject+enrolled pupils; parents see only Published grades;
PINs only as bcrypt hashes, verify_result() callable by service_role only; helper functions not callable by anon.
`students.fees_due` is DEPRECATED (balances = fee_charges minus payments).
After any migration: regenerate src/integrations/supabase/types.ts (until then new tables/views are accessed through untyped casts, see
src/lib/finance.ts and result-pins.ts) and extend tests/.

## Unconfirmed GIA policy (ask, never invent)
grade boundaries, rounding rule, pass mark, class positions, who verifies/approves (defaults in transition_grades), fee schedule,
current academic year/terms, PIN expiry. Grade mean is (Test+Exam)/2 (confirmed).

## Testing
`node tests/migration-permissions.test.mjs` and `node tests/pin-checker.test.mjs` (need `npm i @electric-sql/pglite`; first file also needs the
original migration saved as m1.sql next to it). `npx tsc --noEmit`, `npx vite build` (set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY).
Never commit .env or keys. Use fake pupils in the development database.

## ROADMAP (in order)
1 DONE: Admissions. 2 Grades entry + approval screens on grades/transition_grades (needs academic year, terms, subjects, assignments, enrolments).
3 Attendance screens on attendance_* tables. 4 Classes/Subjects/Settings screens on the new tables. 5 Dashboard real numbers.
6 Parent portal (own children, published results, balances). 7 Offline-first + sync (IndexedDB queue, idempotency keys; see payments.client_uuid).
8 Backups/runbook, security review, UAT with GIA staff. 9 AI assistance last. SkoolPadi (future product) stays separate.

## Images (important for hosting)
School photos and the crest are real files in `public/images/school/` and `src/assets/school/*.asset.json` points `url` at `/images/school/<name>`.
The original Lovable URLs (`/__l5e/assets-v1/...`) only work on Lovable's own host and show broken images on Netlify/other hosts. Do not
re-introduce them. New images: put the file in `public/images/school/` and reference `/images/school/<file>`.
