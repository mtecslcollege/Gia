-- =====================================================================
-- GIA migration 5: full application form (7 steps), photo + documents in PRIVATE storage
-- Extends the existing applications table; old submissions and the earlier simple form keep working.
-- =====================================================================
alter table public.applications
  add column surname text, add column first_name text, add column middle_name text,
  add column place_of_birth text, add column nationality text, add column religion text, add column birth_cert_no text,
  add column town text, add column district text, add column chiefdom text,
  add column guardian_relationship text, add column guardian_occupation text, add column guardian_whatsapp text, add column guardian_address text,
  add column contact2_name text, add column contact2_phone text, add column fee_payer text, add column fee_payer_name text,
  add column blood_group text, add column allergies text, add column medical_conditions text, add column special_needs text,
  add column emergency_name text, add column emergency_relationship text, add column emergency_phone text,
  add column photo_path text, add column documents jsonb not null default '[]'::jsonb;

-- private bucket (only signed upload URLs created by the server, and signed downloads for school staff)
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('application-files', 'application-files', false, 3145728, array['application/pdf','image/jpeg','image/png'])
    on conflict (id) do nothing;
    create policy "management reads application files" on storage.objects for select to authenticated
      using (bucket_id = 'application-files' and public.has_any_role(auth.uid(),
             array['principal','proprietor','admin','vice_principal','registrar']::public.app_role[]));
  end if;
end $$;

create or replace function public.submit_application(_d jsonb, _client text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  ckey text := left(coalesce(nullif(_client,''), 'unknown'), 128);
  sn text := nullif(btrim(coalesce(_d->>'surname','')),''); fnm text := nullif(btrim(coalesce(_d->>'first_name','')),''); mn text := nullif(btrim(coalesce(_d->>'middle_name','')),'');
  newstyle boolean := nullif(btrim(coalesce(_d->>'surname','')),'') is not null;
  pname text; gname text := btrim(coalesce(_d->>'guardian_name',''));
  phone text := btrim(coalesce(_d->>'guardian_phone','')); sig text := btrim(coalesce(_d->>'signature_name',''));
  lvl text := btrim(coalesce(_d->>'level',''));
  g text := case upper(left(btrim(coalesce(_d->>'gender','')),1)) when 'M' then 'M' when 'F' then 'F' end;
  dobv date; email text := nullif(btrim(coalesce(_d->>'guardian_email','')),''); ex public.applications; new_ref text; new_id uuid;
  req text; emph text := nullif(btrim(coalesce(_d->>'emergency_phone','')),'');
  function_t constant text := '^[0-9+() -]{7,20}$';
begin
  if not (select admissions_open from public.school_settings where id = 1) then return jsonb_build_object('status','closed'); end if;
  if newstyle then
    if fnm is null then return jsonb_build_object('status','invalid','field','first_name'); end if;
    pname := concat_ws(' ', fnm, mn, sn);
    foreach req in array array['place_of_birth','nationality','address','town','district','guardian_relationship','guardian_address','fee_payer','emergency_name','emergency_relationship','class_applied','term','academic_year'] loop
      if nullif(btrim(coalesce(_d->>req,'')),'') is null then return jsonb_build_object('status','invalid','field',req); end if;
    end loop;
    if emph is null or emph !~ function_t then return jsonb_build_object('status','invalid','field','emergency_phone'); end if;
    if dobv is null and nullif(_d->>'dob','') is null then return jsonb_build_object('status','invalid','field','dob'); end if;
  else
    pname := btrim(coalesce(_d->>'pupil_name',''));
  end if;
  begin dobv := nullif(_d->>'dob','')::date; exception when others then return jsonb_build_object('status','invalid','field','dob'); end;
  if char_length(pname) not between 2 and 120 then return jsonb_build_object('status','invalid','field', case when newstyle then 'surname' else 'pupil_name' end); end if;
  if char_length(gname) not between 2 and 120 then return jsonb_build_object('status','invalid','field','guardian_name'); end if;
  if phone !~ function_t then return jsonb_build_object('status','invalid','field','guardian_phone'); end if;
  if email is not null and email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then return jsonb_build_object('status','invalid','field','guardian_email'); end if;
  if g is null then return jsonb_build_object('status','invalid','field','gender'); end if;
  if lvl = '' or char_length(lvl) > 60 then return jsonb_build_object('status','invalid','field','level'); end if;
  if dobv is not null and (dobv > current_date or dobv < current_date - interval '25 years') then return jsonb_build_object('status','invalid','field','dob'); end if;
  if coalesce((_d->>'consent_true')::boolean, false) is not true or coalesce((_d->>'consent_rules')::boolean, false) is not true then return jsonb_build_object('status','invalid','field','consent'); end if;
  if char_length(sig) < 2 then return jsonb_build_object('status','invalid','field','signature_name'); end if;

  select * into ex from public.applications where lower(pupil_name) = lower(pname) and guardian_phone = phone
     and dob is not distinct from dobv and status <> 'Rejected' and created_at > now() - interval '30 days' order by created_at desc limit 1;
  if found then return jsonb_build_object('status','ok','ref',ex.ref,'id',ex.id,'duplicate',true); end if;

  if (select count(*) from public.applications where client_key = ckey and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.applications where created_at > now() - interval '1 hour') >= 100 then
    return jsonb_build_object('status','limited');
  end if;
  insert into public.applications (pupil_name, surname, first_name, middle_name, dob, gender, level, class_applied, department, academic_year, term,
      guardian_name, guardian_phone, guardian_email, address, previous_school, last_class, reason_leaving,
      place_of_birth, nationality, religion, birth_cert_no, town, district, chiefdom, guardian_relationship, guardian_occupation, guardian_whatsapp, guardian_address,
      contact2_name, contact2_phone, fee_payer, fee_payer_name, blood_group, allergies, medical_conditions, special_needs, emergency_name, emergency_relationship, emergency_phone,
      consent_true, consent_rules, consent_medical, signature_name, client_key)
  values (pname, left(sn,60), left(fnm,60), left(mn,60), dobv, g, left(lvl,60), left(nullif(btrim(coalesce(_d->>'class_applied','')),''),60), left(nullif(btrim(coalesce(_d->>'department','')),''),40),
      left(nullif(btrim(coalesce(_d->>'academic_year','')),''),20), left(nullif(btrim(coalesce(_d->>'term','')),''),20), gname, phone, left(email,160),
      left(nullif(btrim(coalesce(_d->>'address','')),''),300), left(nullif(btrim(coalesce(_d->>'previous_school','')),''),160),
      left(nullif(btrim(coalesce(_d->>'last_class','')),''),60), left(nullif(btrim(coalesce(_d->>'reason_leaving','')),''),300),
      left(nullif(btrim(coalesce(_d->>'place_of_birth','')),''),100), left(nullif(btrim(coalesce(_d->>'nationality','')),''),60), left(nullif(btrim(coalesce(_d->>'religion','')),''),60),
      left(nullif(btrim(coalesce(_d->>'birth_cert_no','')),''),60), left(nullif(btrim(coalesce(_d->>'town','')),''),100), left(nullif(btrim(coalesce(_d->>'district','')),''),60),
      left(nullif(btrim(coalesce(_d->>'chiefdom','')),''),100), left(nullif(btrim(coalesce(_d->>'guardian_relationship','')),''),40), left(nullif(btrim(coalesce(_d->>'guardian_occupation','')),''),100),
      left(nullif(btrim(coalesce(_d->>'guardian_whatsapp','')),''),20), left(nullif(btrim(coalesce(_d->>'guardian_address','')),''),300),
      left(nullif(btrim(coalesce(_d->>'contact2_name','')),''),120), left(nullif(btrim(coalesce(_d->>'contact2_phone','')),''),20), left(nullif(btrim(coalesce(_d->>'fee_payer','')),''),80),
      left(nullif(btrim(coalesce(_d->>'fee_payer_name','')),''),120), left(nullif(btrim(coalesce(_d->>'blood_group','')),''),12), left(nullif(btrim(coalesce(_d->>'allergies','')),''),300),
      left(nullif(btrim(coalesce(_d->>'medical_conditions','')),''),300), left(nullif(btrim(coalesce(_d->>'special_needs','')),''),300), left(nullif(btrim(coalesce(_d->>'emergency_name','')),''),120),
      left(nullif(btrim(coalesce(_d->>'emergency_relationship','')),''),40), left(emph,20),
      true, true, coalesce((_d->>'consent_medical')::boolean, false), left(sig,120), ckey)
  returning ref, id into new_ref, new_id;
  return jsonb_build_object('status','ok','ref',new_ref,'id',new_id);
end $$;

-- called by the server after the browser has uploaded files with signed URLs; paths must live under this application's folder
create or replace function public.attach_application_files(_ref text, _photo text, _docs jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare a public.applications; d jsonb;
begin
  select * into a from public.applications where ref = _ref;
  if not found then raise exception 'Application not found'; end if;
  if a.status not in ('Pending','Under review','Approved') then raise exception 'Application is closed for changes'; end if;
  if _photo is not null and left(_photo, 37) <> a.id::text || '/' then raise exception 'Bad photo path'; end if;
  for d in select * from jsonb_array_elements(coalesce(_docs,'[]'::jsonb)) loop
    if left(d->>'path', 37) <> a.id::text || '/' then raise exception 'Bad document path'; end if;
  end loop;
  update public.applications set photo_path = coalesce(_photo, photo_path), documents = coalesce(_docs, documents) where id = a.id;
end $$;

revoke all on function public.submit_application(jsonb, text), public.attach_application_files(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_application(jsonb, text), public.attach_application_files(text, text, jsonb) to service_role;
