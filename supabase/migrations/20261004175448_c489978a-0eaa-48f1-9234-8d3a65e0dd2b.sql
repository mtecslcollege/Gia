
create type public.app_role as enum ('proprietor','principal','vice_principal','admin','finance','coordinator','hod','formmaster','teacher','parent','student');

-- profiles
create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  email text,
  phone text,
  requested_role public.app_role not null default 'parent',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = _user_id and r.role = _role and p.approved)
$$;

create or replace function public.has_any_role(_user_id uuid, _roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = _user_id and r.role = any(_roles) and p.approved)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(_user_id, array['proprietor','principal','vice_principal','admin','finance','coordinator','hod','formmaster','teacher']::public.app_role[])
$$;

create or replace function public.is_manager(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(_user_id, array['proprietor','principal','vice_principal','admin']::public.app_role[])
$$;

create policy "own profile or managers" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_manager(auth.uid()));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own roles or managers" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_manager(auth.uid()));

-- registration gate
create table public.school_settings (
  id int primary key default 1 check (id = 1),
  registration_open boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select on public.school_settings to anon, authenticated;
grant update (registration_open, updated_at) on public.school_settings to authenticated;
grant all on public.school_settings to service_role;
alter table public.school_settings enable row level security;
create policy "anyone reads settings" on public.school_settings for select to anon, authenticated using (true);
create policy "admins change settings" on public.school_settings for update to authenticated
  using (public.has_any_role(auth.uid(), array['admin','principal','proprietor']::public.app_role[]))
  with check (public.has_any_role(auth.uid(), array['admin','principal','proprietor']::public.app_role[]));
insert into public.school_settings (id, registration_open) values (1, true);

-- new user: gate + profile; very first account becomes principal + admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  first_user boolean;
  req public.app_role;
begin
  select not exists (select 1 from public.profiles) into first_user;
  if not first_user and not (select registration_open from public.school_settings where id = 1) then
    raise exception 'Registration is currently closed';
  end if;
  begin
    req := coalesce(nullif(new.raw_user_meta_data->>'requested_role',''), 'parent')::public.app_role;
  exception when others then req := 'parent';
  end;
  if req in ('proprietor','principal') and not first_user then req := 'teacher'; end if;
  insert into public.profiles (id, full_name, email, phone, requested_role, approved)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email,
          new.raw_user_meta_data->>'phone', case when first_user then 'principal' else req end, first_user);
  if first_user then
    insert into public.user_roles (user_id, role) values (new.id, 'principal'), (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- approve / revoke accounts (admin chain only)
create or replace function public.approve_user(_user_id uuid, _role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_any_role(auth.uid(), array['admin','principal','proprietor']::public.app_role[]) then
    raise exception 'Not allowed';
  end if;
  if _role in ('proprietor','principal') and not public.has_any_role(auth.uid(), array['principal','proprietor']::public.app_role[]) then
    raise exception 'Only the principal can grant this role';
  end if;
  update public.profiles set approved = true where id = _user_id;
  insert into public.user_roles (user_id, role) values (_user_id, _role) on conflict do nothing;
end $$;

create or replace function public.revoke_user(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_any_role(auth.uid(), array['admin','principal','proprietor']::public.app_role[]) then
    raise exception 'Not allowed';
  end if;
  if _user_id = auth.uid() then raise exception 'You cannot remove your own access'; end if;
  update public.profiles set approved = false where id = _user_id;
  delete from public.user_roles where user_id = _user_id;
end $$;
revoke execute on function public.approve_user(uuid, public.app_role) from anon;
revoke execute on function public.revoke_user(uuid) from anon;

-- students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  adm_no text not null unique,
  full_name text not null,
  class_name text not null,
  gender text not null default 'M',
  dob date,
  house text,
  guardian_name text,
  guardian_phone text,
  status text not null default 'Active',
  fees_due numeric not null default 0,
  created_at timestamptz not null default now()
);
create table public.parent_students (
  parent_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (parent_id, student_id)
);
grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
grant select, insert, delete on public.parent_students to authenticated;
grant all on public.parent_students to service_role;
alter table public.students enable row level security;
alter table public.parent_students enable row level security;

create or replace function public.is_parent_of(_user_id uuid, _student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.parent_students where parent_id = _user_id and student_id = _student_id)
$$;

create policy "staff or linked parent read students" on public.students for select to authenticated
  using (public.is_staff(auth.uid()) or public.is_parent_of(auth.uid(), id));
create policy "managers write students" on public.students for insert to authenticated with check (public.is_manager(auth.uid()));
create policy "managers update students" on public.students for update to authenticated using (public.is_manager(auth.uid()));
create policy "managers delete students" on public.students for delete to authenticated using (public.is_manager(auth.uid()));
create policy "read links" on public.parent_students for select to authenticated
  using (parent_id = auth.uid() or public.is_manager(auth.uid()));
create policy "managers link" on public.parent_students for insert to authenticated with check (public.is_manager(auth.uid()));
create policy "managers unlink" on public.parent_students for delete to authenticated using (public.is_manager(auth.uid()));

-- payments (finance only writes)
create sequence public.receipt_seq start 250;
grant usage on sequence public.receipt_seq to authenticated;
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique default ('GIA-R-' || lpad(nextval('public.receipt_seq')::text, 5, '0')),
  client_uuid uuid unique,
  student_id uuid not null references public.students(id) on delete restrict,
  amount numeric not null check (amount > 0),
  purpose text not null,
  term text not null default 'First Term',
  academic_year text not null default '2025/2026',
  method text not null,
  status text not null default 'Completed',
  received_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "finance chain or parent reads payments" on public.payments for select to authenticated
  using (public.has_any_role(auth.uid(), array['finance','admin','principal','vice_principal','proprietor']::public.app_role[])
         or public.is_parent_of(auth.uid(), student_id));
create policy "finance records payments" on public.payments for insert to authenticated
  with check (public.has_role(auth.uid(), 'finance') and received_by = auth.uid());
create policy "finance updates payments" on public.payments for update to authenticated
  using (public.has_role(auth.uid(), 'finance'));

-- grades
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject text not null,
  term text not null,
  academic_year text not null default '2025/2026',
  test_score numeric check (test_score between 0 and 100),
  exam_score numeric check (exam_score between 0 and 100),
  status text not null default 'Draft',
  entered_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject, term, academic_year)
);
grant select, insert, update, delete on public.grades to authenticated;
grant all on public.grades to service_role;
alter table public.grades enable row level security;
create policy "staff or parent reads grades" on public.grades for select to authenticated
  using (public.is_staff(auth.uid()) or public.is_parent_of(auth.uid(), student_id));
create policy "teachers write grades" on public.grades for insert to authenticated
  with check (public.has_any_role(auth.uid(), array['teacher','hod','formmaster','coordinator','vice_principal','principal']::public.app_role[]));
create policy "teachers update grades" on public.grades for update to authenticated
  using (public.has_any_role(auth.uid(), array['teacher','hod','formmaster','coordinator','vice_principal','principal']::public.app_role[]));

-- notices
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  audience text not null default 'Entire School',
  priority text not null default 'Normal',
  status text not null default 'Pending Approval',
  author_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notices to authenticated;
grant all on public.notices to service_role;
alter table public.notices enable row level security;
create policy "read notices" on public.notices for select to authenticated
  using (author_id = auth.uid() or public.is_manager(auth.uid())
    or (status = 'Published' and (
      audience in ('Entire School')
      or (audience = 'All Staff' and public.is_staff(auth.uid()))
      or (audience = 'All Parents' and public.has_role(auth.uid(), 'parent'))
      or (audience = 'All Students' and public.has_role(auth.uid(), 'student'))
      or (audience not in ('All Staff','All Parents','All Students') and public.is_staff(auth.uid())))));
create policy "staff post notices" on public.notices for insert to authenticated
  with check (author_id = auth.uid()
    and public.has_any_role(auth.uid(), array['proprietor','principal','vice_principal','admin','finance','coordinator','hod','formmaster','teacher']::public.app_role[])
    and (audience <> 'All Staff' or public.has_any_role(auth.uid(), array['principal','proprietor']::public.app_role[]))
    and (status in ('Draft','Pending Approval') or public.has_any_role(auth.uid(), array['principal','proprietor']::public.app_role[])));
create policy "principal approves notices" on public.notices for update to authenticated
  using (public.has_any_role(auth.uid(), array['principal','proprietor']::public.app_role[]));
create policy "author or principal deletes" on public.notices for delete to authenticated
  using (author_id = auth.uid() or public.has_any_role(auth.uid(), array['principal','proprietor']::public.app_role[]));

-- demo rows
insert into public.students (adm_no, full_name, class_name, gender, dob, house, guardian_name, guardian_phone, fees_due) values
('GIA001','Abubakar Kamara','JSS 1','M','2012-01-01','Blue','Mrs. Alhaji Kamara','+232 76 100 101',2400000),
('GIA002','Fatmata Conteh','JSS 2','F','2011-03-02','Gold','Mr. Haja Conteh','+232 77 107 138',2400000),
('GIA003','Mohamed Sesay','JSS 3','M','2013-05-03','Green','Mr. Pa Sesay','+232 78 115 175',2400000),
('GIA004','Aminata Koroma','SSS 1','F','2014-07-04','Red','Mrs. Mama Koroma','+232 79 123 211',3000000),
('GIA005','Ibrahim Bangura','SSS 2','M','2010-09-05','Blue','Mr. Alhaji Bangura','+232 70 131 248',3000000),
('GIA006','Mariama Turay','SSS 3','F','2011-11-06','Gold','Mr. Haja Turay','+232 71 139 285',3000000),
('GIA007','Alhaji Mansaray','JSS 1','M','2012-01-07','Green','Mrs. Pa Mansaray','+232 72 147 322',2400000),
('GIA008','Isatu Kanu','JSS 2','F','2013-03-08','Red','Mr. Mama Kanu','+232 73 155 359',2400000),
('GIA009','Sorie Jalloh','JSS 3','M','2014-05-09','Blue','Mr. Alhaji Jalloh','+232 74 163 396',2400000),
('GIA010','Kadiatu Fofanah','SSS 1','F','2010-07-10','Gold','Mrs. Haja Fofanah','+232 76 171 433',3000000),
('GIA011','Osman Kamara','SSS 2','M','2011-09-11','Green','Mr. Pa Kamara','+232 77 179 470',3000000),
('GIA012','Hawa Conteh','SSS 3','F','2012-11-12','Red','Mr. Mama Conteh','+232 78 187 507',3000000),
('GIA013','Santigie Sesay','JSS 1','M','2013-01-13','Blue','Mrs. Alhaji Sesay','+232 79 195 544',2400000),
('GIA014','Adama Koroma','JSS 2','F','2014-03-14','Gold','Mr. Haja Koroma','+232 70 203 581',2400000),
('GIA015','Foday Bangura','JSS 3','M','2010-05-15','Green','Mr. Pa Bangura','+232 71 211 618',2400000),
('GIA016','Zainab Turay','SSS 1','F','2011-07-16','Red','Mrs. Mama Turay','+232 72 219 655',3000000),
('GIA017','Abdul Mansaray','SSS 2','M','2012-09-17','Blue','Mr. Alhaji Mansaray','+232 73 227 692',3000000),
('GIA018','Christiana Kanu','SSS 3','F','2013-11-18','Gold','Mr. Haja Kanu','+232 74 235 729',3000000),
('GIA019','Musa Jalloh','JSS 1','M','2014-01-19','Green','Mrs. Pa Jalloh','+232 76 243 766',2400000),
('GIA020','Jeneba Fofanah','JSS 2','F','2010-03-20','Red','Mr. Mama Fofanah','+232 77 251 803',2400000);

insert into public.notices (title, body, audience, priority, status, author_id) values
('School holiday announcement','School closes for the mid-term break on Friday.','Entire School','Normal','Published',null),
('First term examination timetable','The timetable is posted on the notice board.','All Students','High','Published',null),
('Parent–teacher meeting','All parents are invited on Saturday at 10am.','All Parents','Normal','Published',null);
