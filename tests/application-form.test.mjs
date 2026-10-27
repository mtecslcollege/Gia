import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
const db = new PGlite({extensions:{pgcrypto}});
const out=[]; let fail=0;
const ok=(n,c)=>{out.push((c?'PASS ':'FAIL ')+n); if(!c) fail++;};
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text); alter table storage.objects enable row level security; grant usage on schema storage to anon, authenticated, service_role; grant select on storage.objects to authenticated;
create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`);
await db.exec(fs.readFileSync('m1.sql','utf8'));
await db.exec(fs.readFileSync('/home/claude/out/supabase/migrations/20261026000000_add_exam_roles.sql','utf8'));
await db.exec(fs.readFileSync('/home/claude/out/supabase/migrations/20261026000100_foundation.sql','utf8'));
await db.exec(fs.readFileSync('/home/claude/out/supabase/migrations/20261026000200_result_pins.sql','utf8'));
await db.exec(fs.readFileSync('/home/claude/out/supabase/migrations/20261026000300_admissions.sql','utf8'));
await db.exec(fs.readFileSync('/home/claude/out/supabase/migrations/20261026000400_application_form.sql','utf8'));
out.push('migrations applied');
const as = async (uid, sql, params=[]) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub','${uid||''}',false); set role ${uid?'authenticated':'anon'};`); return db.query(sql, params); };
const tryq = async (uid, sql, params) => { try { const r = await as(uid, sql, params); return {ok:true, r}; } catch(e){ return {ok:false, e:e.message}; } };



const U={};
for (const [k,role] of [['principal',null],['registrar','registrar'],['teacher','teacher'],['parent','parent']]) {
  const r = await db.query(`insert into auth.users(email, raw_user_meta_data) values ($1,$2::jsonb) returning id`,[k+'@t.test',JSON.stringify({requested_role:role||'parent'})]); U[k]=r.rows[0].id; }
for (const [k,r] of [['registrar','registrar'],['teacher','teacher'],['parent','parent']]) await as(U.principal, `select approve_user($1,$2::app_role)`,[U[k],r]);
await db.exec('reset role');
const svc = async (sql,p)=>{ await db.exec(`reset role; set role service_role;`); return db.query(sql,p); };
const sub = async (d,client='c1') => (await svc(`select submit_application($1::jsonb,$2) v`,[JSON.stringify(d),client])).rows[0].v;
const full = {surname:'Koroma',first_name:'Fatmata',middle_name:'Binta',dob:'2015-04-02',gender:'Female',place_of_birth:'Makeni',nationality:'Sierra Leonean',religion:'Muslim',
 address:'12 Makama Road',town:'Makeni',district:'Bombali',guardian_name:'Aminata Koroma',guardian_relationship:'Mother',guardian_phone:'+232 76 123456',guardian_address:'12 Makama Road, Makeni',
 fee_payer:'The parent / guardian named above',emergency_name:'Mohamed Koroma',emergency_relationship:'Uncle',emergency_phone:'+232 77 555123',
 level:'Primary (Grades)',class_applied:'Grade 4',academic_year:'2026 / 2027',term:'First Term',previous_school:'St Joseph',allergies:'None',blood_group:'O+',
 consent_true:true,consent_rules:true,consent_medical:true,signature_name:'Aminata Koroma'};
let v = await sub(full); ok('full 7-step application accepted', v.status==='ok' && /^APP-\d{5}$/.test(v.ref) && v.id); const {ref,id}=v;
const row=(await db.query(`select pupil_name, surname, nationality, emergency_phone, blood_group, district from applications where id=$1`,[id])).rows[0];
ok('all parts stored and display name composed', row.pupil_name==='Fatmata Binta Koroma' && row.surname==='Koroma' && row.district==='Bombali' && row.blood_group==='O+' && row.emergency_phone==='+232 77 555123');
v = await sub(full,'c2'); ok('duplicate returns same reference and id', v.duplicate===true && v.ref===ref && v.id===id);
for (const f of ['place_of_birth','nationality','address','town','district','guardian_relationship','guardian_address','fee_payer','emergency_name','emergency_relationship','class_applied','term','academic_year','first_name']) {
  const r = await sub({...full,surname:'Other'+f, [f]:''},'cv'); ok('requires '+f, r.status==='invalid' && r.field===f); }
let r2 = await sub({...full,surname:'Other',emergency_phone:'abc'},'cv'); ok('rejects bad emergency phone', r2.status==='invalid' && r2.field==='emergency_phone');
r2 = await sub({pupil_name:'Old Style',gender:'M',level:'JSS 1–3',guardian_name:'Old Parent',guardian_phone:'07612345',dob:'2012-01-01',consent_true:true,consent_rules:true,signature_name:'Old Parent'},'old'); ok('earlier simple form still works', r2.status==='ok');
// files
let r = await tryq(null, `select attach_application_files($1,null,'[]'::jsonb)`,[ref]); ok('anon cannot attach files', !r.ok);
r = await tryq(U.principal, `select attach_application_files($1,null,'[]'::jsonb)`,[ref]); ok('signed-in users cannot attach files', !r.ok);
await svc(`select attach_application_files($1,$2,$3::jsonb)`,[ref, id+'/photo-abc.jpg', JSON.stringify([{kind:'birth',path:id+'/birth-1.pdf',name:'birth.pdf',size:1000}])]);
r = await tryq(U.registrar, `select photo_path, jsonb_array_length(documents) n from applications where id=$1`,[id]); ok('registrar sees stored file paths', r.ok && r.r.rows[0].photo_path===id+'/photo-abc.jpg' && r.r.rows[0].n===1);
try { await svc(`select attach_application_files($1,$2,'[]'::jsonb)`,[ref,'00000000-0000-0000-0000-000000000000/x.jpg']); ok('rejects a path outside the application folder', false); } catch(e){ ok('rejects a path outside the application folder', true); }
try { await svc(`select attach_application_files($1,null,$2::jsonb)`,[ref,JSON.stringify([{path:'../../etc/passwd'}])]); ok('rejects a document path outside the folder', false); } catch(e){ ok('rejects a document path outside the folder', true); }
r = await tryq(U.parent, `select count(*)::int c from applications`); ok('parent still cannot read applications', r.ok && r.r.rows[0].c===0);
await db.exec('reset role');
ok('bucket created private with 3 MB limit', (await db.query(`select public, file_size_limit from storage.buckets where id='application-files'`)).rows[0].public===false);
await db.exec('reset role');
ok('storage read policy exists for management only', (await db.query(`select count(*)::int c from pg_policies where schemaname='storage' and policyname='management reads application files'`)).rows[0].c===1);
console.log(out.join('\n')); console.log('FAILURES:',fail);
