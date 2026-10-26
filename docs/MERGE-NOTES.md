# Merged GIA project (Lovable portal + static website content)

Base: the Lovable project (React / TanStack Start / Supabase). Kept as is: all pages, routes, login, roles, students,
dashboard design. Added:
- Public pages ported from the static site: /departments, /campus-life, /news-events, /staff, /privacy
  (content in src/lib/school-pages.ts). Existing /about /academics /gallery /contact /admissions were already ported by Lovable.
- Public site: "More" menu (desktop), full menu (phone), phone bottom bar (Home, Academics, Apply, Results, More), footer links.
- Real school address (src/lib/school-pages.ts) replaces the placeholder from mock.ts in the footer.
- Result checker: /results (+ server function) and admin page /app/result-pins; navigation link added under Academics.
- supabase/migrations: foundation (audit, academic structure, grades workflow, payments ledger, attendance) and result PINs.
- tests/: 86 database checks (node, PGlite). docs/: setup notes.

NOT merged on purpose: the static online_registration.html (77 KB form, PDF export). The Lovable /admissions page is a simple
mail form. Next step is to save applications in an admissions table and show them in /app/admissions.
Static site (HTML) is no longer needed once this project is deployed; keep it only as an archive.

Build checked: vite build passes and tsc shows no errors in the new files. Hosted school photos need internet to display.
