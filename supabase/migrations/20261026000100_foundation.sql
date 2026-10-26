-- =====================================================================
-- GIA migration 2b: foundation (additive; existing rows are preserved)
--  1 audit log          5 grades approval workflow + grading scale
--  2 academic structure 6 payments ledger, fee charges, balances
--  3 school settings    7 attendance
--  4 safer signup bootstrap, function execute rights
-- NOTHING here invents GIA policy: no grade boundaries, no academic years,
-- no class positions. Those stay empty/off until GIA confirms them.
-- =====================================================================

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create or replace function public.forbid_change() returns trigger language plpgsql as $$
begin raise exception '% rows are append-only; use a reversal or adjustment', tg_table_name; end $$;

create or replace function public.is_member(_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
                 where r.user_id = _uid and p.approved)
$$;

-- ---------- 1. audit log (append-only) ----------
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb
);
alter table public.audit_log enable row level security;
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
create policy "managers read audit" on public.audit_log for select to authenticated
  using (public.is_manager(auth.uid()));
create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function public.forbid_change();

create or replace function public.audit_row() returns trigger language plpgsql
security definer set search_path = public as $$
begin
  insert into public.audit_log (actor, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name,
          coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id'),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- ---------- 2. academic structure ----------
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                 -- e.g. 2026/2027
  starts_on date, ends_on date,
  is_current boolean not null default false,
  check (ends_on is null or starts_on is null or ends_on > starts_on)
);
create unique index one_current_year on public.academic_years (is_current) where is_current;

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  name text not null,
  seq int not null check (seq > 0),
  starts_on date, ends_on date,
  unique (academic_year_id, seq), unique (academic_year_id, name)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level text, stream text,
  form_teacher_id uuid,
  sort_order int not null default 0
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text unique, name text not null unique, department text,
  active boolean not null default true
);
create table public.class_subjects (
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (class_id, subject_id)
);
create table public.teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  unique (teacher_id, class_id, subject_id, academic_year_id)
);
create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  status text not null default 'Enrolled' check (status in ('Enrolled','Transferred','Withdrawn','Promoted','Repeated')),
  created_at timestamptz not null default now(),
  unique (student_id, academic_year_id)
);

-- keep pupil IDs unique ignoring case/spaces (adm_no stays the stable pupil ID)
create unique index students_adm_no_norm on public.students (lower(btrim(adm_no)));
alter table public.students add column class_id uuid references public.classes(id);
comment on column public.students.fees_due is 'DEPRECATED: balances now come from fee_charges and payments (view student_fee_balances). Changes are audited.';

-- backfill classes from the existing free-text class_name (no data is changed)
insert into public.classes (name, level)
select distinct class_name,
       case when class_name ilike 'JSS%' then 'JSS' when class_name ilike 'SSS%' then 'SSS' end
from public.students on conflict (name) do nothing;
update public.students s set class_id = c.id from public.classes c where c.name = s.class_name and s.class_id is null;

create or replace function public.is_assigned(_uid uuid, _class uuid, _subject uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teaching_assignments ta
                 join public.academic_years y on y.id = ta.academic_year_id and y.is_current
                 where ta.teacher_id = _uid and ta.class_id = _class and ta.subject_id = _subject)
$$;
create or replace function public.is_class_staff(_uid uuid, _class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes c where c.id = _class and c.form_teacher_id = _uid)
      or exists (select 1 from public.teaching_assignments ta
                 join public.academic_years y on y.id = ta.academic_year_id and y.is_current
                 where ta.teacher_id = _uid and ta.class_id = _class)
$$;

-- ---------- 3. school settings (single source for identity & policy switches) ----------
alter table public.school_settings
  add column if not exists school_name text,
  add column if not exists motto text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists address text,
  add column if not exists logo_url text,
  add column if not exists show_class_position boolean not null default false,
  add column if not exists pass_mark numeric check (pass_mark between 0 and 100),
  add column if not exists bootstrap_complete boolean not null default false;
update public.school_settings set
  school_name = coalesce(school_name, 'Gbonkolenken International Academy'),
  motto = coalesce(motto, 'Seat of Wisdom'),
  contact_email = coalesce(contact_email, 'infogia@gmail.com')
where id = 1;
update public.school_settings set bootstrap_complete = true
where id = 1 and exists (select 1 from public.profiles);
grant update (school_name, motto, contact_email, contact_phone, address, logo_url, show_class_position, pass_mark)
  on public.school_settings to authenticated;

-- ---------- 4. safer signup: first-account bootstrap happens once, race-free ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean; req public.app_role;
begin
  perform pg_advisory_xact_lock(7340211);
  select not coalesce((select bootstrap_complete from public.school_settings where id = 1), false)
         and not exists (select 1 from public.profiles) into first_user;
  if not first_user and not (select registration_open from public.school_settings where id = 1) then
    raise exception 'Registration is currently closed';
  end if;
  begin
    req := coalesce(nullif(new.raw_user_meta_data->>'requested_role',''), 'parent')::public.app_role;
  exception when others then req := 'parent';
  end;
  if req in ('proprietor','principal','exam_officer','registrar') and not first_user then req := 'teacher'; end if;
  insert into public.profiles (id, full_name, email, phone, requested_role, approved)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email,
          new.raw_user_meta_data->>'phone', case when first_user then 'principal' else req end, first_user);
  if first_user then
    insert into public.user_roles (user_id, role) values (new.id, 'principal'), (new.id, 'admin');
    update public.school_settings set bootstrap_complete = true where id = 1;
  end if;
  return new;
end $$;

-- ---------- 5. grades: approval workflow ----------
create table public.grading_scales (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default false
);
create unique index one_active_scale on public.grading_scales (active) where active;
create table public.grade_boundaries (
  id uuid primary key default gen_random_uuid(),
  scale_id uuid not null references public.grading_scales(id) on delete cascade,
  grade text not null, min_score numeric not null, max_score numeric not null, remark text,
  check (min_score <= max_score), unique (scale_id, grade)
);

alter table public.grades
  add column class_id uuid references public.classes(id),
  add column subject_id uuid references public.subjects(id),
  add column term_id uuid references public.terms(id),
  add column academic_year_id uuid references public.academic_years(id);
alter table public.grades add constraint grades_status_chk
  check (status in ('Draft','Submitted','Verified','Approved','Published'));
create unique index grades_unique_ids on public.grades (student_id, subject_id, term_id)
  where subject_id is not null and term_id is not null;

create table public.grade_status_history (
  id bigint generated always as identity primary key,
  grade_id uuid not null references public.grades(id) on delete cascade,
  from_status text, to_status text not null,
  actor uuid, reason text, at timestamptz not null default now()
);
create trigger grade_history_immutable before update or delete on public.grade_status_history
  for each row execute function public.forbid_change();

create or replace function public.grades_guard() returns trigger language plpgsql
security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then new.status := 'Draft'; new.entered_by := auth.uid(); end if;
    if new.subject_id is not null then new.subject := (select name from public.subjects where id = new.subject_id); end if;
    if new.term_id is not null then
      select t.name, y.name, y.id into new.term, new.academic_year, new.academic_year_id
        from public.terms t join public.academic_years y on y.id = t.academic_year_id where t.id = new.term_id;
    end if;
    return new;
  end if;
  if new.student_id <> old.student_id or new.subject_id is distinct from old.subject_id
     or new.term_id is distinct from old.term_id or new.class_id is distinct from old.class_id
     or new.entered_by is distinct from old.entered_by then
    raise exception 'Grade identity fields cannot be changed';
  end if;
  if old.status <> 'Draft' and (new.test_score is distinct from old.test_score or new.exam_score is distinct from old.exam_score) then
    raise exception 'Marks are locked once submitted; ask for the grade to be returned to Draft';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger grades_guard_trg before insert or update on public.grades
  for each row execute function public.grades_guard();

drop policy "staff or parent reads grades" on public.grades;
drop policy "teachers write grades" on public.grades;
drop policy "teachers update grades" on public.grades;
create policy "staff read grades" on public.grades for select to authenticated
  using (public.is_staff(auth.uid()));
create policy "parents read published grades" on public.grades for select to authenticated
  using (status = 'Published' and public.is_parent_of(auth.uid(), student_id));
create policy "assigned teachers insert draft grades" on public.grades for insert to authenticated
  with check (
    public.has_any_role(auth.uid(), array['teacher','hod','formmaster','coordinator']::public.app_role[])
    and class_id is not null and subject_id is not null and term_id is not null
    and public.is_assigned(auth.uid(), class_id, subject_id)
    and exists (select 1 from public.terms t join public.enrolments e on e.academic_year_id = t.academic_year_id
                where t.id = term_id and e.student_id = grades.student_id and e.class_id = grades.class_id and e.status = 'Enrolled'));
create policy "assigned teachers edit draft grades" on public.grades for update to authenticated
  using (status = 'Draft' and public.has_any_role(auth.uid(), array['teacher','hod','formmaster','coordinator']::public.app_role[])
         and public.is_assigned(auth.uid(), class_id, subject_id))
  with check (status = 'Draft' and public.is_assigned(auth.uid(), class_id, subject_id));
revoke insert, update, delete on public.grades from authenticated;
grant insert (student_id, class_id, subject_id, term_id, test_score, exam_score) on public.grades to authenticated;
grant update (test_score, exam_score) on public.grades to authenticated;
-- the old text columns stay NOT NULL; the guard fills them from the ids on insert

create or replace function public.transition_grades(_ids uuid[], _to text, _reason text default null)
returns int language plpgsql security definer set search_path = public as $$
declare g public.grades; n int := 0; uid uuid := auth.uid(); ok boolean;
  verifiers public.app_role[] := array['exam_officer','hod','coordinator','vice_principal','principal'];
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if _to not in ('Draft','Submitted','Verified','Approved','Published') then raise exception 'Unknown status %', _to; end if;
  if _to = 'Published' and not exists (select 1 from public.grade_boundaries b join public.grading_scales s on s.id = b.scale_id and s.active) then
    raise exception 'Grading scale is not configured, so results cannot be published';
  end if;
  for g in select * from public.grades where id = any(_ids) for update loop
    ok := case
      when g.status = 'Draft' and _to = 'Submitted' then
        (g.test_score is not null or g.exam_score is not null)
        and public.has_any_role(uid, array['teacher','hod','formmaster','coordinator']::public.app_role[])
        and public.is_assigned(uid, g.class_id, g.subject_id)
      when g.status = 'Submitted' and _to = 'Verified' then
        g.entered_by is distinct from uid and public.has_any_role(uid, verifiers)
      when g.status in ('Submitted','Verified') and _to = 'Draft' then
        public.has_any_role(uid, verifiers)
      when g.status = 'Verified' and _to = 'Approved' then
        g.entered_by is distinct from uid
        and public.has_any_role(uid, array['vice_principal','principal','proprietor']::public.app_role[])
      when g.status = 'Approved' and _to = 'Published' then
        public.has_any_role(uid, array['principal','proprietor']::public.app_role[])
      when g.status in ('Approved','Published') and _to = 'Draft' then
        public.has_any_role(uid, array['principal','proprietor']::public.app_role[])
        and length(btrim(coalesce(_reason,''))) >= 5
      else false end;
    if not ok then raise exception 'Not allowed: % to % (grade %)', g.status, _to, g.id; end if;
    update public.grades set status = _to where id = g.id;
    insert into public.grade_status_history (grade_id, from_status, to_status, actor, reason)
    values (g.id, g.status, _to, uid, _reason);
    n := n + 1;
  end loop;
  if n <> (select count(distinct x) from unnest(_ids) x) then raise exception 'Some grades were not found'; end if;
  return n;
end $$;

create view public.grade_results with (security_invoker = true) as
select g.*, m.mean_score, bb.grade as grade_letter, bb.remark as grade_remark
from public.grades g
cross join lateral (select case when g.test_score is not null and g.exam_score is not null
                                then (g.test_score + g.exam_score) / 2 end as mean_score) m   -- mean confirmed by GIA; rounding NOT decided
left join lateral (select b.grade, b.remark from public.grade_boundaries b
                   join public.grading_scales s on s.id = b.scale_id and s.active
                   where m.mean_score between b.min_score and b.max_score
                   order by b.min_score desc limit 1) bb on true;

-- ---------- 6. payments: append-only ledger ----------
alter table public.payments
  add column kind text not null default 'payment' check (kind in ('payment','reversal')),
  add column reverses_id uuid references public.payments(id),
  add column reason text,
  add column device_id text,
  add column client_created_at timestamptz,
  add constraint payments_reversal_shape check ((kind = 'reversal') = (reverses_id is not null)),
  add constraint payments_reversal_reason check (kind <> 'reversal' or length(btrim(coalesce(reason,''))) >= 5);
create unique index one_reversal_per_payment on public.payments (reverses_id) where kind = 'reversal';
create trigger payments_immutable before update or delete on public.payments
  for each row execute function public.forbid_change();

drop policy "finance updates payments" on public.payments;
drop policy "finance records payments" on public.payments;
create policy "finance records payments" on public.payments for insert to authenticated
  with check (public.has_role(auth.uid(), 'finance') and received_by = auth.uid() and kind = 'payment');
revoke insert, update, delete on public.payments from authenticated;
grant insert (student_id, amount, purpose, term, academic_year, method, client_uuid, device_id, client_created_at)
  on public.payments to authenticated;

create or replace function public.reverse_payment(_payment uuid, _reason text) returns uuid
language plpgsql security definer set search_path = public as $$
declare p public.payments; rid uuid;
begin
  if not public.is_manager(auth.uid()) then raise exception 'Only the school management can reverse a payment'; end if;
  select * into p from public.payments where id = _payment;
  if not found then raise exception 'Payment not found'; end if;
  if p.kind <> 'payment' then raise exception 'Only an original payment can be reversed'; end if;
  insert into public.payments (student_id, amount, purpose, term, academic_year, method, kind, reverses_id, reason, received_by)
  values (p.student_id, p.amount, 'Reversal of ' || p.receipt_no, p.term, p.academic_year, p.method, 'reversal', p.id, _reason, auth.uid())
  returning id into rid;
  return rid;
end $$;

create table public.fee_charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  academic_year text not null, term text,
  description text not null,
  kind text not null check (kind in ('charge','discount','opening_balance','adjustment')),
  amount numeric not null check (amount <> 0),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check (kind <> 'charge' or amount > 0), check (kind <> 'discount' or amount < 0)
);
create trigger fee_charges_immutable before update or delete on public.fee_charges
  for each row execute function public.forbid_change();
alter table public.fee_charges enable row level security;
grant select on public.fee_charges to authenticated;
grant insert (student_id, academic_year, term, description, kind, amount) on public.fee_charges to authenticated;
grant all on public.fee_charges to service_role;
create policy "finance chain or parent reads charges" on public.fee_charges for select to authenticated
  using (public.has_any_role(auth.uid(), array['finance','admin','principal','vice_principal','proprietor']::public.app_role[])
         or public.is_parent_of(auth.uid(), student_id));
create policy "management adds charges and discounts" on public.fee_charges for insert to authenticated
  with check (public.is_manager(auth.uid()) and created_by = auth.uid());

-- carry the old stored balance over once, as an opening-balance charge
insert into public.fee_charges (student_id, academic_year, term, description, kind, amount, created_by)
select s.id, 'Opening', null, 'Opening balance migrated from students.fees_due', 'opening_balance', s.fees_due, null
from public.students s
where s.fees_due > 0
  and not exists (select 1 from public.fee_charges c where c.student_id = s.id and c.kind = 'opening_balance');

create view public.student_fee_balances with (security_invoker = true) as
select s.id as student_id, s.adm_no, s.full_name, s.class_name,
       coalesce(c.charged, 0) as charged, coalesce(p.paid, 0) as paid,
       coalesce(c.charged, 0) - coalesce(p.paid, 0) as balance
from public.students s
left join (select student_id, sum(amount) as charged from public.fee_charges group by student_id) c on c.student_id = s.id
left join (select student_id, sum(case when kind = 'reversal' then -amount else amount end) as paid
           from public.payments group by student_id) p on p.student_id = s.id
where public.has_any_role(auth.uid(), array['finance','admin','principal','vice_principal','proprietor']::public.app_role[])
   or public.is_parent_of(auth.uid(), s.id);

-- ---------- 7. attendance ----------
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  term_id uuid references public.terms(id),
  session_date date not null,
  period text not null default 'Day',
  status text not null default 'Open' check (status in ('Open','Submitted')),
  taken_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (class_id, session_date, period)
);
create table public.attendance_records (
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('Present','Absent','Late','Excused')),
  note text,
  primary key (session_id, student_id)
);

-- ---------- RLS for the new configuration / structure tables ----------
do $$ declare t text; begin
  foreach t in array array['academic_years','terms','classes','subjects','class_subjects','teaching_assignments',
    'enrolments','grading_scales','grade_boundaries','grade_status_history','attendance_sessions','attendance_records']
  loop execute format('alter table public.%I enable row level security', t);
       execute format('grant select on public.%I to authenticated', t);
       execute format('grant all on public.%I to service_role', t); end loop;
end $$;
grant select on public.grade_results, public.student_fee_balances to authenticated;

do $$ declare t text; begin
  foreach t in array array['academic_years','terms','classes','subjects','class_subjects','grading_scales','grade_boundaries']
  loop
    execute format('create policy "members read" on public.%I for select to authenticated using (public.is_member(auth.uid()))', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "management write" on public.%I for all to authenticated using (public.has_any_role(auth.uid(), array[''principal'',''proprietor'',''admin'',''vice_principal'']::public.app_role[])) with check (public.has_any_role(auth.uid(), array[''principal'',''proprietor'',''admin'',''vice_principal'']::public.app_role[]))', t);
  end loop;
end $$;

create policy "teacher own or management read" on public.teaching_assignments for select to authenticated
  using (teacher_id = auth.uid() or public.is_manager(auth.uid()));
grant insert, update, delete on public.teaching_assignments to authenticated;
create policy "management assigns" on public.teaching_assignments for all to authenticated
  using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

create policy "staff or parent read enrolments" on public.enrolments for select to authenticated
  using (public.is_staff(auth.uid()) or public.is_parent_of(auth.uid(), student_id));
grant insert, update on public.enrolments to authenticated;
create policy "management or registrar enrol" on public.enrolments for insert to authenticated
  with check (public.has_any_role(auth.uid(), array['principal','proprietor','admin','vice_principal','registrar']::public.app_role[]));
create policy "management or registrar update enrolments" on public.enrolments for update to authenticated
  using (public.has_any_role(auth.uid(), array['principal','proprietor','admin','vice_principal','registrar']::public.app_role[]));

create policy "staff read grade history" on public.grade_status_history for select to authenticated
  using (public.is_staff(auth.uid()));

create policy "staff or parent read attendance sessions" on public.attendance_sessions for select to authenticated
  using (public.is_staff(auth.uid()) or exists (select 1 from public.attendance_records r
         where r.session_id = id and public.is_parent_of(auth.uid(), r.student_id)));
grant insert, update on public.attendance_sessions to authenticated;
create policy "class staff open sessions" on public.attendance_sessions for insert to authenticated
  with check (public.is_class_staff(auth.uid(), class_id) and taken_by = auth.uid());
create policy "class staff or management update sessions" on public.attendance_sessions for update to authenticated
  using ((status = 'Open' and public.is_class_staff(auth.uid(), class_id)) or public.is_manager(auth.uid()));
create policy "staff or parent read attendance" on public.attendance_records for select to authenticated
  using (public.is_staff(auth.uid()) or public.is_parent_of(auth.uid(), student_id));
grant insert, update on public.attendance_records to authenticated;
create policy "class staff write open attendance" on public.attendance_records for insert to authenticated
  with check (exists (select 1 from public.attendance_sessions s where s.id = session_id and s.status = 'Open'
                      and public.is_class_staff(auth.uid(), s.class_id)));
create policy "class staff edit open attendance" on public.attendance_records for update to authenticated
  using (exists (select 1 from public.attendance_sessions s where s.id = session_id and s.status = 'Open'
                 and public.is_class_staff(auth.uid(), s.class_id)));

-- ---------- audit triggers ----------
do $$ declare t text; begin
  foreach t in array array['students','grades','payments','fee_charges','user_roles','school_settings','enrolments','teaching_assignments','grading_scales','grade_boundaries']
  loop execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.audit_row()', t); end loop;
end $$;

-- ---------- function execute rights: signed-in users only ----------
do $$ declare f text; begin
  foreach f in array array[
    'public.has_role(uuid, public.app_role)','public.has_any_role(uuid, public.app_role[])','public.is_staff(uuid)',
    'public.is_manager(uuid)','public.is_parent_of(uuid, uuid)','public.is_member(uuid)',
    'public.is_assigned(uuid, uuid, uuid)','public.is_class_staff(uuid, uuid)',
    'public.approve_user(uuid, public.app_role)','public.revoke_user(uuid)',
    'public.transition_grades(uuid[], text, text)','public.reverse_payment(uuid, text)']
  loop execute format('revoke all on function %s from public, anon', f);
       execute format('grant execute on function %s to authenticated, service_role', f); end loop;
end $$;
