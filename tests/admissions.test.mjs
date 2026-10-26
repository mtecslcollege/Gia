import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
const db = new PGlite({extensions:{pgcrypto}});
const out=[]; let fail=0;
const ok=(n,c)=>{out.push((c?'PASS ':'FAIL ')+n); if(!c) fail++;};
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
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
out.push('migrations applied');
const as = async (uid, sql, params=[]) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub','${uid||''}',false); set role ${uid?'authenticated':'anon'};`); return db.query(sql, params); };
const tryq = async (uid, sql, params) => { try { const r = await as(uid, sql, params); return {ok:true, r}; } catch(e){ return {ok:false, e:e.message}; } };


const U={};
for (const [k,role] of [['principal',null],['admin','admin'],['registrar','registrar'],['teacher','teacher'],['parent','parent']]) {
  const r = await db.query(`insert into auth.users(email, raw_user_meta_data) values ($1,$2::jsonb) returning id`,[k+'@t.test',JSON.stringify({requested_role:role||'parent'})]); U[k]=r.rows[0].id; }
await as(U.principal, `select approve_user($1,'admin')`,[U.admin]);
for (const [k,r] of [['registrar','registrar'],['teacher','teacher'],['parent','parent']]) await as(U.admin, `select approve_user($1,$2::app_role)`,[U[k],r]);
await db.exec('reset role');
const svc = async (sql,p)=>{ await db.exec(`reset role; set role service_role;`); return db.query(sql,p); };
const sub = async (d,client='c1') => (await svc(`select submit_application($1::jsonb,$2) v`,[JSON.stringify(d),client])).rows[0].v;
const good = {pupil_name:'Fatmata Koroma',dob:'2015-04-02',gender:'Female',level:'Grades 1–6',class_applied:'Grade 4',guardian_name:'Aminata Koroma',guardian_phone:'+232 76 123456',consent_true:true,consent_rules:true,signature_name:'Aminata Koroma'};
let v = await sub(good); ok('valid application accepted with reference', v.status==='ok' && /^APP-\d{5}$/.test(v.ref)); const ref=v.ref;
v = await sub(good,'c2'); ok('same pupil+phone returns the same reference (no duplicate)', v.status==='ok' && v.ref===ref && v.duplicate===true);
ok('only one stored', (await db.query(`select count(*)::int c from applications`)).rows[0].c===1);
for (const [name,bad,field] of [['missing consent',{...good,pupil_name:'Other Child',consent_true:false},'consent'],['bad phone',{...good,pupil_name:'Other Child',guardian_phone:'abc'},'guardian_phone'],['bad gender',{...good,pupil_name:'Other Child',gender:''},'gender'],['future dob',{...good,pupil_name:'Other Child',dob:'2099-01-01'},'dob'],['short name',{...good,pupil_name:'A'},'pupil_name'],['bad email',{...good,pupil_name:'Other Child',guardian_email:'nope'},'guardian_email'],['no signature',{...good,pupil_name:'Other Child',signature_name:''},'signature_name']]) {
  const r = await sub(bad,'cv'); ok('rejects '+name, r.status==='invalid' && r.field===field); }
for (let i=0;i<5;i++) await sub({...good,pupil_name:'Child Number '+i,guardian_phone:'0761000'+i},'spammer');
v = await sub({...good,pupil_name:'Child Number 9',guardian_phone:'07610009'},'spammer'); ok('6th application from one connection in an hour is limited', v.status==='limited');
v = await sub({...good,pupil_name:'Child Number 9',guardian_phone:'07610009'},'someone-else'); ok('other connections unaffected', v.status==='ok');
await db.exec(`reset role; update school_settings set admissions_open=false`);
v = await sub({...good,pupil_name:'Late Child',guardian_phone:'07619999'},'late'); ok('closed admissions refuse submissions', v.status==='closed');
await db.exec(`update school_settings set admissions_open=true`);
// access
let r = await tryq(null, `select * from applications`); ok('anon cannot read applications', !r.ok);
r = await tryq(null, `select submit_application('{}'::jsonb,'x')`); ok('anon cannot call submit_application', !r.ok);
r = await tryq(U.admin, `select submit_application('{}'::jsonb,'x')`); ok('signed-in users cannot call submit_application', !r.ok);
r = await tryq(U.parent, `select count(*)::int c from applications`); ok('parent sees no applications', r.ok && r.r.rows[0].c===0);
r = await tryq(U.teacher, `select count(*)::int c from applications`); ok('teacher sees no applications', r.ok && r.r.rows[0].c===0);
r = await tryq(U.registrar, `select id, status from applications where ref=$1`,[ref]); ok('registrar reads applications', r.ok && r.r.rows.length===1); const aid=r.r?.rows[0].id;
r = await tryq(U.registrar, `update applications set status='Admitted' where id=$1`,[aid]); ok('nobody can edit applications directly', !r.ok);
r = await tryq(U.teacher, `select decide_application($1,'Approved')`,[aid]); ok('teacher cannot decide', !r.ok);
r = await tryq(U.registrar, `select decide_application($1,'Rejected')`,[aid]); ok('rejection needs a reason', !r.ok);
r = await tryq(U.registrar, `select decide_application($1,'Under review')`,[aid]); ok('registrar marks under review', r.ok);
const cls=(await db.query(`select id from classes where name='JSS 1'`)).rows[0].id;
r = await tryq(U.registrar, `select admit_application($1,$2)`,[aid,cls]); ok('cannot admit before approval', !r.ok);
await as(U.registrar, `select decide_application($1,'Approved')`,[aid]);
r = await tryq(U.teacher, `select admit_application($1,$2)`,[aid,cls]); ok('teacher cannot admit', !r.ok);
r = await tryq(U.registrar, `select admit_application($1,$2) v`,[aid,cls]); ok('registrar admits approved application', r.ok && r.r.rows[0].v.adm_no==='GIA021');
await db.exec('reset role');
const st=(await db.query(`select adm_no, full_name, class_name, gender, guardian_phone from students where adm_no='GIA021'`)).rows[0];
ok('student created in existing students table with next pupil ID', st && st.full_name==='Fatmata Koroma' && st.class_name==='JSS 1' && st.gender==='F' && st.guardian_phone==='+232 76 123456');
r = await tryq(U.registrar, `select admit_application($1,$2)`,[aid,cls]); ok('cannot admit twice', !r.ok);
r = await tryq(U.registrar, `select decide_application($1,'Rejected','changed my mind later')`,[aid]); ok('admitted application cannot be re-decided', !r.ok);
ok('application linked to its student', (await db.query(`select student_id is not null ok from applications where id=$1`,[aid])).rows[0].ok);
// second admission gets next ID; current year enrols
await db.exec(`reset role; insert into academic_years(name,is_current) values('2026/2027',true)`);
const a2=(await db.query(`select id from applications where pupil_name='Child Number 0'`)).rows[0].id;
await as(U.admin, `select decide_application($1,'Approved')`,[a2]);
r = await tryq(U.admin, `select admit_application($1,$2) v`,[a2,cls]); ok('next pupil ID increments and enrols in the current year', r.ok && r.r.rows[0].v.adm_no==='GIA022' && r.r.rows[0].v.enrolled===true);
r = await tryq(U.admin, `select count(*)::int c from audit_log where table_name='applications'`); ok('application changes audited', r.ok && r.r.rows[0].c>=5);
console.log(out.join('\n')); console.log('FAILURES:',fail);
