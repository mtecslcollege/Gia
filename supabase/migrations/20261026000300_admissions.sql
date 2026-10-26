-- =====================================================================
-- GIA migration 4: online admissions (application form -> review -> admit)
-- * Public submissions go ONLY through submit_application() (server/service role), with validation,
--   duplicate guard and rate limits. Browsers cannot write or read this table.
-- * Review and admission are management/registrar functions with an audit trail.
-- * Admitting creates a row in the EXISTING students table (+ enrolment when a current year exists).
-- =====================================================================
alter table public.school_settings add column if not exists admissions_open boolean not null default true;
grant update (admissions_open) on public.school_settings to authenticated;

create sequence public.application_seq start 1;
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('APP-' || lpad(nextval('public.application_seq')::text, 5, '0')),
  created_at timestamptz not null default now(),
  status text not null default 'Pending' check (status in ('Pending','Under review','Approved','Rejected','Admitted')),
  pupil_name text not null check (char_length(pupil_name) between 2 and 120),
  dob date,
  gender text not null check (gender in ('M','F')),
  level text not null,
  class_applied text,
  department text,
  academic_year text,
  term text,
  guardian_name text not null check (char_length(guardian_name) between 2 and 120),
  guardian_phone text not null,
  guardian_email text,
  address text,
  previous_school text, last_class text, reason_leaving text,
  consent_true boolean not null, consent_rules boolean not null, consent_medical boolean not null default false,
  signature_name text not null,
  client_key text,
  decided_by uuid, decided_at timestamptz, decision_note text,
  student_id uuid references public.students(id) on delete set null,
  check (consent_true and consent_rules)
);
create index applications_status on public.applications (status, created_at desc);
create index applications_client on public.applications (client_key, created_at);
alter table public.applications enable row level security;
grant select on public.applications to authenticated;
grant all on public.applications to service_role;
create policy "management or registrar read applications" on public.applications for select to authenticated
  using (public.has_any_role(auth.uid(), array['principal','proprietor','admin','vice_principal','registrar']::public.app_role[]));
create trigger audit_applications after insert or update or delete on public.applications
  for each row execute function public.audit_row();

create or replace function public.submit_application(_d jsonb, _client text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  ckey text := left(coalesce(nullif(_client,''), 'unknown'), 128);
  pname text := btrim(coalesce(_d->>'pupil_name',''));  gname text := btrim(coalesce(_d->>'guardian_name',''));
  phone text := btrim(coalesce(_d->>'guardian_phone','')); sig text := btrim(coalesce(_d->>'signature_name',''));
  lvl text := btrim(coalesce(_d->>'level',''));
  g text := case upper(left(btrim(coalesce(_d->>'gender','')),1)) when 'M' then 'M' when 'F' then 'F' end;
  dobv date; email text := nullif(btrim(coalesce(_d->>'guardian_email','')),''); ex public.applications; new_ref text;
begin
  if not (select admissions_open from public.school_settings where id = 1) then return jsonb_build_object('status','closed'); end if;
  begin dobv := nullif(_d->>'dob','')::date; exception when others then return jsonb_build_object('status','invalid','field','dob'); end;
  if char_length(pname) not between 2 and 120 then return jsonb_build_object('status','invalid','field','pupil_name'); end if;
  if char_length(gname) not between 2 and 120 then return jsonb_build_object('status','invalid','field','guardian_name'); end if;
  if phone !~ '^[0-9+() -]{7,20}$' then return jsonb_build_object('status','invalid','field','guardian_phone'); end if;
  if email is not null and email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then return jsonb_build_object('status','invalid','field','guardian_email'); end if;
  if g is null then return jsonb_build_object('status','invalid','field','gender'); end if;
  if lvl = '' or char_length(lvl) > 60 then return jsonb_build_object('status','invalid','field','level'); end if;
  if dobv is not null and (dobv > current_date or dobv < current_date - interval '25 years') then return jsonb_build_object('status','invalid','field','dob'); end if;
  if coalesce((_d->>'consent_true')::boolean, false) is not true or coalesce((_d->>'consent_rules')::boolean, false) is not true then return jsonb_build_object('status','invalid','field','consent'); end if;
  if char_length(sig) < 2 then return jsonb_build_object('status','invalid','field','signature_name'); end if;

  -- same pupil + guardian phone already applied recently: return that reference instead of a second record
  select * into ex from public.applications where lower(pupil_name) = lower(pname) and guardian_phone = phone
     and dob is not distinct from dobv and status <> 'Rejected' and created_at > now() - interval '30 days' order by created_at desc limit 1;
  if found then return jsonb_build_object('status','ok','ref',ex.ref,'duplicate',true); end if;

  if (select count(*) from public.applications where client_key = ckey and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.applications where created_at > now() - interval '1 hour') >= 100 then
    return jsonb_build_object('status','limited');
  end if;
  insert into public.applications (pupil_name, dob, gender, level, class_applied, department, academic_year, term, guardian_name, guardian_phone,
      guardian_email, address, previous_school, last_class, reason_leaving, consent_true, consent_rules, consent_medical, signature_name, client_key)
  values (pname, dobv, g, left(lvl,60), left(nullif(btrim(coalesce(_d->>'class_applied','')),''),60), left(nullif(btrim(coalesce(_d->>'department','')),''),40),
      left(nullif(btrim(coalesce(_d->>'academic_year','')),''),20), left(nullif(btrim(coalesce(_d->>'term','')),''),20), gname, phone, left(email,160),
      left(nullif(btrim(coalesce(_d->>'address','')),''),300), left(nullif(btrim(coalesce(_d->>'previous_school','')),''),160),
      left(nullif(btrim(coalesce(_d->>'last_class','')),''),60), left(nullif(btrim(coalesce(_d->>'reason_leaving','')),''),300),
      true, true, coalesce((_d->>'consent_medical')::boolean, false), left(sig,120), ckey)
  returning ref into new_ref;
  return jsonb_build_object('status','ok','ref',new_ref);
end $$;

create or replace function public.decide_application(_id uuid, _status text, _note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a public.applications;
begin
  if not public.has_any_role(auth.uid(), array['principal','proprietor','admin','vice_principal','registrar']::public.app_role[]) then
    raise exception 'Not allowed'; end if;
  if _status not in ('Under review','Approved','Rejected') then raise exception 'Unknown decision %', _status; end if;
  if _status = 'Rejected' and length(btrim(coalesce(_note,''))) < 5 then raise exception 'A reason is required to reject an application'; end if;
  select * into a from public.applications where id = _id for update;
  if not found then raise exception 'Application not found'; end if;
  if a.status = 'Admitted' then raise exception 'This application has already been admitted'; end if;
  update public.applications set status = _status, decided_by = auth.uid(), decided_at = now(), decision_note = nullif(btrim(coalesce(_note,'')),'') where id = _id;
end $$;

create or replace function public.admit_application(_id uuid, _class uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.applications; c public.classes; n int; pid text; sid uuid; y uuid;
begin
  if not public.has_any_role(auth.uid(), array['principal','proprietor','admin','vice_principal','registrar']::public.app_role[]) then
    raise exception 'Not allowed'; end if;
  select * into a from public.applications where id = _id for update;
  if not found then raise exception 'Application not found'; end if;
  if a.status <> 'Approved' then raise exception 'Only an approved application can be admitted'; end if;
  select * into c from public.classes where id = _class;
  if not found then raise exception 'Choose the class to place the pupil in'; end if;
  perform pg_advisory_xact_lock(7340212);
  select coalesce(max((substring(adm_no from '^GIA([0-9]+)$'))::int), 0) + 1 into n from public.students;
  pid := 'GIA' || lpad(n::text, 3, '0');
  insert into public.students (adm_no, full_name, class_name, class_id, gender, dob, guardian_name, guardian_phone, status)
  values (pid, a.pupil_name, c.name, c.id, a.gender, a.dob, a.guardian_name, a.guardian_phone, 'Active') returning id into sid;
  select id into y from public.academic_years where is_current;
  if y is not null then insert into public.enrolments (student_id, class_id, academic_year_id) values (sid, c.id, y); end if;
  update public.applications set status = 'Admitted', student_id = sid, decided_by = auth.uid(), decided_at = now() where id = _id;
  return jsonb_build_object('student_id', sid, 'adm_no', pid, 'class', c.name, 'enrolled', y is not null);
end $$;

revoke all on function public.submit_application(jsonb, text), public.decide_application(uuid, text, text), public.admit_application(uuid, uuid) from public, anon;
grant execute on function public.decide_application(uuid, text, text), public.admit_application(uuid, uuid) to authenticated, service_role;
revoke execute on function public.submit_application(jsonb, text) from authenticated;
grant execute on function public.submit_application(jsonb, text) to service_role;
