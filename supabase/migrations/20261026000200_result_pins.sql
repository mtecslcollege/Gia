-- =====================================================================
-- GIA migration 3: administrator-issued result PINs + public result checker
-- * PINs are random (10 chars, 32-symbol alphabet, ~50 bits), shown ONCE, stored only as bcrypt hashes.
-- * A PIN is scoped to ONE pupil and ONE term/examination session.
-- * The public check runs ONLY through verify_result(), callable by the server (service_role), never by browsers.
-- * Only grades with status 'Published' are ever returned.
-- =====================================================================
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.result_pins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  term_id uuid not null references public.terms(id) on delete restrict,
  pin_hash text not null,
  status text not null default 'active' check (status in ('active','revoked')),
  issued_by uuid default auth.uid(),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_by uuid, revoked_at timestamptz, revoke_reason text,
  check (status = 'active' or revoked_at is not null)
);
create unique index one_active_pin_per_pupil_term on public.result_pins (student_id, term_id) where status = 'active';
alter table public.result_pins enable row level security;
-- managers may see status, never the hash (column-level grant)
grant select (id, student_id, term_id, status, issued_by, issued_at, expires_at, revoked_by, revoked_at, revoke_reason)
  on public.result_pins to authenticated;
grant all on public.result_pins to service_role;
create policy "management reads pin status" on public.result_pins for select to authenticated
  using (public.is_manager(auth.uid()));

-- attempts: used for lockouts and the access trail. Contains NO PINs. No client access at all.
create table public.result_attempts (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  pupil_key text not null,            -- sha256 of the normalised pupil id as typed (exists or not)
  client_key text not null,           -- hashed network identifier supplied by the server
  outcome text not null check (outcome in ('ok','bad_credentials','locked')),
  student_id uuid, term_id uuid
);
create index result_attempts_recent on public.result_attempts (at);
create index result_attempts_pupil on public.result_attempts (pupil_key, at);
create index result_attempts_client on public.result_attempts (client_key, at);
alter table public.result_attempts enable row level security;
grant all on public.result_attempts to service_role;
create policy "management reads result access trail" on public.result_attempts for select to authenticated
  using (public.is_manager(auth.uid()));
grant select (id, at, outcome, student_id, term_id) on public.result_attempts to authenticated;

-- ---------- issuing / revoking (management only) ----------
create or replace function public._new_pin() returns text language plpgsql
set search_path = public, extensions as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := gen_random_bytes(10); s text := ''; i int;
begin
  for i in 0..9 loop s := s || substr(alphabet, (get_byte(b, i) % 32) + 1, 1); end loop;
  return s;
end $$;

create or replace function public._audit(_action text, _record text, _data jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_log (actor, action, table_name, record_id, new_data) values (auth.uid(), _action, 'result_pins', _record, _data)
$$;

create or replace function public.issue_result_pin(_student uuid, _term uuid, _reason text default null)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare pin text; pid uuid; old public.result_pins;
begin
  if not public.is_manager(auth.uid()) then raise exception 'Only school management can issue result PINs'; end if;
  if not exists (select 1 from public.students where id = _student) then raise exception 'Pupil not found'; end if;
  if not exists (select 1 from public.terms where id = _term) then raise exception 'Examination session not found'; end if;
  select * into old from public.result_pins where student_id = _student and term_id = _term and status = 'active' for update;
  if found then
    if length(btrim(coalesce(_reason,''))) < 5 then raise exception 'A PIN already exists; give a reason (identity checked) to reissue'; end if;
    update public.result_pins set status = 'revoked', revoked_by = auth.uid(), revoked_at = now(), revoke_reason = 'Reissued: ' || _reason where id = old.id;
    perform public._audit('PIN_REVOKED', old.id::text, jsonb_build_object('student_id', _student, 'term_id', _term, 'reason', 'Reissued: ' || _reason));
  end if;
  pin := public._new_pin();
  insert into public.result_pins (student_id, term_id, pin_hash) values (_student, _term, crypt(pin, gen_salt('bf', 10))) returning id into pid;
  perform public._audit('PIN_ISSUED', pid::text, jsonb_build_object('student_id', _student, 'term_id', _term, 'reissue', old.id is not null));
  return pin;   -- shown once by the interface; never stored
end $$;

create or replace function public.issue_result_pins_for_class(_class uuid, _term uuid)
returns table (student_id uuid, adm_no text, full_name text, pin text)
language plpgsql security definer set search_path = public, extensions as $$
declare s record; newpin text; pid uuid;
begin
  if not public.is_manager(auth.uid()) then raise exception 'Only school management can issue result PINs'; end if;
  if not exists (select 1 from public.terms where id = _term) then raise exception 'Examination session not found'; end if;
  for s in select st.id, st.adm_no, st.full_name from public.students st
           join public.terms t on t.id = _term
           join public.enrolments e on e.student_id = st.id and e.class_id = _class and e.academic_year_id = t.academic_year_id and e.status = 'Enrolled'
           where not exists (select 1 from public.result_pins p where p.student_id = st.id and p.term_id = _term and p.status = 'active')
           order by st.adm_no
  loop
    newpin := public._new_pin();
    insert into public.result_pins (student_id, term_id, pin_hash) values (s.id, _term, crypt(newpin, gen_salt('bf', 10))) returning id into pid;
    perform public._audit('PIN_ISSUED', pid::text, jsonb_build_object('student_id', s.id, 'term_id', _term, 'bulk', true));
    student_id := s.id; adm_no := s.adm_no; full_name := s.full_name; pin := newpin; return next;
  end loop;
end $$;

create or replace function public.revoke_result_pin(_pin_id uuid, _reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.result_pins;
begin
  if not public.is_manager(auth.uid()) then raise exception 'Only school management can revoke result PINs'; end if;
  if length(btrim(coalesce(_reason,''))) < 5 then raise exception 'A reason is required'; end if;
  update public.result_pins set status = 'revoked', revoked_by = auth.uid(), revoked_at = now(), revoke_reason = _reason
   where id = _pin_id and status = 'active' returning * into p;
  if not found then raise exception 'No active PIN with that id'; end if;
  perform public._audit('PIN_REVOKED', _pin_id::text, jsonb_build_object('student_id', p.student_id, 'term_id', p.term_id, 'reason', _reason));
end $$;

-- ---------- the public check (server only) ----------
-- Always answers {"status":"invalid"} for any credential problem, whether or not the pupil exists.
create or replace function public.verify_result(_pupil_id text, _pin text, _term uuid, _client text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  pkey text := encode(digest(lower(btrim(coalesce(_pupil_id,''))), 'sha256'), 'hex');
  ckey text := left(coalesce(nullif(_client,''), 'unknown'), 128);
  normpin text := upper(regexp_replace(coalesce(_pin,''), '[^A-Za-z0-9]', '', 'g'));
  stu public.students; pr public.result_pins; matched public.result_pins; result jsonb;
  dummy constant text := '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5BUyZsDUQnsZ5Q6vBNBlLQWPpD2Wy';
begin
  if length(btrim(coalesce(_pupil_id,''))) = 0 or length(btrim(_pupil_id)) > 40 or length(normpin) <> 10 then
    insert into public.result_attempts (pupil_key, client_key, outcome) values (pkey, ckey, 'bad_credentials');
    return jsonb_build_object('status','invalid');
  end if;
  -- lockouts (recent failures only)
  if (select count(*) from public.result_attempts where pupil_key = pkey and client_key = ckey and outcome = 'bad_credentials' and at > now() - interval '15 minutes') >= 5
     or (select count(*) from public.result_attempts where client_key = ckey and outcome = 'bad_credentials' and at > now() - interval '15 minutes') >= 30
     or (select count(*) from public.result_attempts where pupil_key = pkey and outcome = 'bad_credentials' and at > now() - interval '1 hour') >= 40 then
    insert into public.result_attempts (pupil_key, client_key, outcome) values (pkey, ckey, 'locked');
    return jsonb_build_object('status','locked');
  end if;

  select * into stu from public.students where lower(btrim(adm_no)) = lower(btrim(_pupil_id));
  if not found then
    perform crypt(normpin, dummy);       -- keep timing similar
  else
    for pr in select * from public.result_pins where student_id = stu.id and status = 'active'
              and (expires_at is null or expires_at > now()) and (_term is null or term_id = _term) loop
      if pr.pin_hash = crypt(normpin, pr.pin_hash) then matched := pr; exit; end if;
    end loop;
  end if;
  if matched.id is null then
    insert into public.result_attempts (pupil_key, client_key, outcome) values (pkey, ckey, 'bad_credentials');
    return jsonb_build_object('status','invalid');
  end if;
  insert into public.result_attempts (pupil_key, client_key, outcome, student_id, term_id) values (pkey, ckey, 'ok', stu.id, matched.term_id);

  select jsonb_build_object(
    'status', 'ok',
    'school', (select jsonb_build_object('name', school_name, 'motto', motto, 'logo_url', logo_url, 'email', contact_email, 'phone', contact_phone)
               from public.school_settings where id = 1),
    'pupil', jsonb_build_object('name', stu.full_name, 'pupil_id', stu.adm_no,
               'class', coalesce((select c.name from public.enrolments e join public.classes c on c.id = e.class_id
                                  join public.terms t on t.academic_year_id = e.academic_year_id where t.id = matched.term_id and e.student_id = stu.id), stu.class_name)),
    'session', (select jsonb_build_object('term', t.name, 'academic_year', y.name) from public.terms t join public.academic_years y on y.id = t.academic_year_id where t.id = matched.term_id),
    'subjects', coalesce((select jsonb_agg(jsonb_build_object('subject', r.subject, 'test', r.test_score, 'exam', r.exam_score,
                          'mean', r.mean_score, 'grade', r.grade_letter, 'remark', r.grade_remark) order by r.subject)
                          from public.grade_results r where r.student_id = stu.id and r.term_id = matched.term_id and r.status = 'Published'), '[]'::jsonb),
    'average', (select avg(r.mean_score) from public.grade_results r where r.student_id = stu.id and r.term_id = matched.term_id and r.status = 'Published'),
    'published_at', (select max(h.at) from public.grade_status_history h join public.grades g on g.id = h.grade_id
                     where g.student_id = stu.id and g.term_id = matched.term_id and h.to_status = 'Published' and g.status = 'Published'),
    'class_position', null          -- not implemented; only if GIA approves (school_settings.show_class_position)
  ) into result;
  return result;
end $$;

create or replace function public.purge_result_attempts() returns int language sql security definer set search_path = public as $$
  with d as (delete from public.result_attempts where at < now() - interval '90 days' returning 1) select count(*)::int from d
$$;

-- ---------- execute rights ----------
revoke all on function public._new_pin(), public._audit(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.issue_result_pin(uuid, uuid, text), public.issue_result_pins_for_class(uuid, uuid),
  public.revoke_result_pin(uuid, text), public.verify_result(text, text, uuid, text), public.purge_result_attempts() from public, anon;
grant execute on function public.issue_result_pin(uuid, uuid, text), public.issue_result_pins_for_class(uuid, uuid),
  public.revoke_result_pin(uuid, text) to authenticated, service_role;
revoke execute on function public.verify_result(text, text, uuid, text), public.purge_result_attempts() from authenticated;
grant execute on function public.verify_result(text, text, uuid, text), public.purge_result_attempts() to service_role;
