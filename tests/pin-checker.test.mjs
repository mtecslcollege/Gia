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
out.push('migrations applied');
const as = async (uid, sql, params=[]) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub','${uid||''}',false); set role ${uid?'authenticated':'anon'};`); return db.query(sql, params); };
const tryq = async (uid, sql, params) => { try { const r = await as(uid, sql, params); return {ok:true, r}; } catch(e){ return {ok:false, e:e.message}; } };

const U={};
for (const [k,role] of [['principal',null],['admin','admin'],['teacher','teacher'],['parent','parent'],['vp','vice_principal'],['examo','exam_officer']]) {
  const r = await db.query(`insert into auth.users(email, raw_user_meta_data) values ($1,$2::jsonb) returning id`,[k+'@t.test',JSON.stringify({requested_role:role||'parent'})]); U[k]=r.rows[0].id; }
await as(U.principal, `select approve_user($1,'admin')`,[U.admin]);
for (const [k,r] of [['teacher','teacher'],['parent','parent'],['vp','vice_principal'],['examo','exam_officer']]) await as(U.admin, `select approve_user($1,$2::app_role)`,[U[k],r]);
await db.exec('reset role');
const [a,b,c]=(await db.query(`select id from students order by adm_no limit 3`)).rows.map(x=>x.id);
const yr=(await db.query(`insert into academic_years(name,is_current) values('2026/2027',true) returning id`)).rows[0].id;
const t1=(await db.query(`insert into terms(academic_year_id,name,seq) values($1,'First Term',1) returning id`,[yr])).rows[0].id;
const t2=(await db.query(`insert into terms(academic_year_id,name,seq) values($1,'Second Term',2) returning id`,[yr])).rows[0].id;
const cls=(await db.query(`select id from classes where name='JSS 1'`)).rows[0].id;
const sub=(await db.query(`insert into subjects(code,name) values('MTH','Mathematics') returning id`)).rows[0].id;
const sub2=(await db.query(`insert into subjects(code,name) values('ENG','English') returning id`)).rows[0].id;
await db.query(`insert into enrolments(student_id,class_id,academic_year_id) values($1,$2,$3)`,[a,cls,yr]);
const sc=(await db.query(`insert into grading_scales(name,active) values('s',true) returning id`)).rows[0].id;
await db.query(`insert into grade_boundaries(scale_id,grade,min_score,max_score) values($1,'A',70,100),($1,'F',0,69.99)`,[sc]);
// grades inserted as service (bypass), then published through the workflow as principal
await db.query(`insert into grades(student_id,class_id,subject_id,term_id,test_score,exam_score,entered_by) values($1,$2,$3,$4,30,80,$5),($1,$2,$6,$4,20,60,$5),($1,$2,$3,$7,10,10,$5)`,[a,cls,sub,t1,U.teacher,sub2,t2]);
const gs=(await db.query(`select id, subject_id, term_id from grades where student_id=$1`,[a])).rows;
const pub=gs.filter(g=>g.term_id===t1 && g.subject_id===sub).map(g=>g.id);
for (const [who,to] of [['examo','Submitted']]) {}
await db.query(`update grades set status='Submitted' where id=any($1::uuid[])`,[gs.map(g=>g.id)]);   // service shortcut to Submitted
await as(U.examo,`select transition_grades($1::uuid[],'Verified')`,[gs.map(g=>g.id)]);
await as(U.vp,`select transition_grades($1::uuid[],'Approved')`,[gs.map(g=>g.id)]);
await as(U.principal,`select transition_grades($1::uuid[],'Published')`,[pub]);   // only Maths T1 published
const svc = (sql,p)=>{ return db.exec(`reset role; set role service_role;`).then(()=>db.query(sql,p)); };
const verify = async (pid,pin,term,client='c1') => (await svc(`select verify_result($1,$2,$3,$4) v`,[pid,pin,term,client])).rows[0].v;
// ISSUE
let r = await tryq(U.teacher, `select issue_result_pin($1,$2)`,[a,t1]); ok('teacher cannot issue PIN', !r.ok);
r = await tryq(U.parent, `select issue_result_pin($1,$2)`,[a,t1]); ok('parent cannot issue PIN', !r.ok);
r = await tryq(null, `select issue_result_pin($1,$2)`,[a,t1]); ok('anon cannot issue PIN', !r.ok);
r = await tryq(U.admin, `select issue_result_pin($1,$2) pin`,[a,t1]); ok('admin issues PIN', r.ok); const PIN=r.r?.rows[0].pin;
ok('PIN is 10 chars from safe alphabet', /^[A-HJ-NP-Z2-9]{10}$/.test(PIN));
await db.exec('reset role');
const row=(await db.query(`select pin_hash from result_pins limit 1`)).rows[0];
ok('PIN stored only as bcrypt hash', row.pin_hash.startsWith('$2') && !row.pin_hash.includes(PIN));
r = await tryq(U.admin, `select pin_hash from result_pins`); ok('managers cannot read pin_hash', !r.ok);
r = await tryq(U.admin, `select id,status from result_pins`); ok('managers can read PIN status', r.ok && r.r.rows.length===1);
r = await tryq(U.admin, `select issue_result_pin($1,$2)`,[a,t1]); ok('second issue without reason refused', !r.ok);
// VERIFY
let v = await verify(PIN.slice(0,5)+'-'+PIN.slice(5)); // wrong pupil id typed below; test correct next
const adm=(await db.query(`select adm_no from students where id=$1`,[a])).rows[0].adm_no;
v = await verify(adm, PIN.slice(0,5)+'-'+PIN.slice(5).toLowerCase(), null, 'c2');
ok('valid credentials return result (dash/lowercase tolerated)', v.status==='ok');
ok('only the PUBLISHED subject is returned', v.subjects.length===1 && v.subjects[0].subject==='Mathematics' && v.subjects[0].grade==='F');
ok('response excludes guardian, dob, fees, other term', !JSON.stringify(v).match(/guardian|dob|fees|Second Term|English/i) && v.pupil.pupil_id===adm);
ok('average only from published marks', Number(v.average)===55);
v = await verify(adm.toLowerCase(), PIN, t1, 'c3'); ok('pupil id case-insensitive + matching term ok', v.status==='ok');
v = await verify(adm, PIN, t2, 'c4'); ok('PIN does not open another session', v.status==='invalid');
const bad1 = await verify(adm,'AAAAAAAAAA',null,'c5'), bad2 = await verify('NOPE999','AAAAAAAAAA',null,'c5b');
ok('wrong PIN and unknown pupil give identical response', JSON.stringify(bad1)===JSON.stringify(bad2) && bad1.status==='invalid');
const otherPupil=(await db.query(`select adm_no from students where id=$1`,[b])).rows[0].adm_no;
v = await verify(otherPupil, PIN, null,'c6'); ok("this PIN cannot open another pupil's result", v.status==='invalid');
// LOCKOUT
for (let i=0;i<5;i++) await verify(adm,'BBBBBBBBBB',null,'attacker');
v = await verify(adm, PIN, null, 'attacker'); ok('5 failures lock that client, even with the right PIN', v.status==='locked');
v = await verify(adm, PIN, null, 'parent-phone'); ok('legitimate parent on another connection still works', v.status==='ok');
for (let i=0;i<5;i++) await verify('GHOST1','BBBBBBBBBB',null,'attacker');
v = await verify('GHOST1','BBBBBBBBBB',null,'attacker'); ok('lockout applies to unknown pupil ids too (no enumeration)', v.status==='locked');
for (let i=0;i<40;i++) await verify(adm,'CCCCCCCCCC',null,'bot'+i);
v = await verify(adm, PIN, null, 'fresh'); ok('distributed guessing on one pupil locks that pupil (40/hour)', v.status==='locked');
v = await verify('', PIN, null,'x'); ok('empty pupil id invalid', v.status==='invalid');
r = await tryq(U.admin, `select verify_result($1,$2,null,'x')`,[adm,PIN]); ok('signed-in users cannot call verify_result', !r.ok);
r = await tryq(null, `select verify_result($1,$2,null,'x')`,[adm,PIN]); ok('anon cannot call verify_result', !r.ok);
r = await tryq(null, `select * from result_pins`); ok('anon cannot read PIN table', !r.ok);
r = await tryq(null, `select * from result_attempts`); ok('anon cannot read attempts', !r.ok);
await db.exec(`reset role; delete from result_attempts;`);
// REISSUE / REVOKE
r = await tryq(U.admin, `select issue_result_pin($1,$2,'Parent identity checked at the office') pin`,[a,t1]); ok('reissue with reason works', r.ok); const PIN2=r.r?.rows[0].pin;
ok('new PIN differs', PIN2!==PIN);
v = await verify(adm,PIN,null,'d1'); ok('old PIN stops working after reissue', v.status==='invalid');
v = await verify(adm,PIN2,null,'d2'); ok('new PIN works', v.status==='ok');
await db.exec('reset role'); const act=(await db.query(`select id from result_pins where status='active'`)).rows[0].id;
r = await tryq(U.teacher, `select revoke_result_pin($1,'compromised phone')`,[act]); ok('teacher cannot revoke', !r.ok);
r = await tryq(U.admin, `select revoke_result_pin($1,'x')`,[act]); ok('revoke needs reason', !r.ok);
r = await tryq(U.admin, `select revoke_result_pin($1,'PIN shared on social media')`,[act]); ok('admin revokes PIN', r.ok);
v = await verify(adm,PIN2,null,'d3'); ok('revoked PIN invalid', v.status==='invalid');
// EXPIRY
r = await tryq(U.admin, `select issue_result_pin($1,$2) pin`,[a,t2]); if(!r.ok) console.log('PIN3 error:', r.e); const PIN3=r.r?.rows[0].pin;
await db.exec(`reset role; update result_pins set expires_at = now() - interval '1 day' where status='active'`);
v = await verify(adm,PIN3,null,'e1'); ok('expired PIN invalid', v.status==='invalid');
// BULK
const cb=(await db.query(`select id from students offset 5 limit 1`)).rows[0].id; await db.query(`insert into enrolments(student_id,class_id,academic_year_id) values($1,$2,$3)`,[cb,cls,yr]);
r = await tryq(U.admin, `select * from issue_result_pins_for_class($1,$2)`,[cls,t1]); ok('bulk issue returns PINs for enrolled pupils without an active one', r.ok && r.r.rows.length===2 && r.r.rows.every(x=>x.pin.length===10));
r = await tryq(U.admin, `select * from issue_result_pins_for_class($1,$2)`,[cls,t1]); ok('bulk issue does not reissue existing PINs', r.ok && r.r.rows.length===0);
// AUDIT
r = await tryq(U.admin, `select action from audit_log where table_name='result_pins'`); const acts=r.r.rows.map(x=>x.action);
ok('issue/revoke/reissue audited', acts.includes('PIN_ISSUED') && acts.includes('PIN_REVOKED'));
await db.exec('reset role');
ok('audit log never contains PINs or hashes', (await db.query(`select count(*)::int c from audit_log where new_data::text ~ '\\$2[aby]\\$' or new_data::text like '%${PIN2}%'`)).rows[0].c===0);
ok('attempts log holds no PIN', (await db.query(`select count(*)::int c from result_attempts where pupil_key like '%${PIN2}%' or client_key like '%${PIN2}%'`)).rows[0].c===0);
console.log(out.join('\n')); console.log('FAILURES:',fail);
