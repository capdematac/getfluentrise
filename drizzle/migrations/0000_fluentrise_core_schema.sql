-- ENUMS
create type public.app_role as enum ('admin', 'learner');
create type public.cefr_level as enum ('A1','A2','B1','B2','C1','C2');
create type public.skill_area as enum ('grammar','vocabulary','reading','listening','writing','speaking','use_of_english');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  goal text,
  estimated_level public.cefr_level,
  confidence numeric,
  onboarded boolean not null default false,
  daily_goal_minutes integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- PROFILE AUTO-CREATE
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'learner') on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- CONTENT: MODULES / LESSONS / EXERCISES
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  objective text,
  level public.cefr_level not null,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.modules to authenticated, anon;
grant insert, update, delete on public.modules to authenticated;
grant all on public.modules to service_role;
alter table public.modules enable row level security;
create policy "modules readable" on public.modules for select using (published or public.has_role(auth.uid(),'admin'));
create policy "modules admin write" on public.modules for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  summary text,
  est_minutes integer not null default 10,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.lessons to authenticated, anon;
grant insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "lessons readable" on public.lessons for select using (published or public.has_role(auth.uid(),'admin'));
create policy "lessons admin write" on public.lessons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  is_placement boolean not null default false,
  type text not null,
  level public.cefr_level not null,
  skill public.skill_area not null,
  title text,
  prompt text not null,
  passage text,
  options jsonb not null default '[]'::jsonb,
  answer jsonb not null,
  explanation text,
  examples text[] not null default '{}',
  tags text[] not null default '{}',
  objective text,
  est_seconds integer not null default 45,
  status text not null default 'published',
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.exercises to authenticated, anon;
grant insert, update, delete on public.exercises to authenticated;
grant all on public.exercises to service_role;
alter table public.exercises enable row level security;
create policy "exercises readable" on public.exercises for select using (status = 'published' or public.has_role(auth.uid(),'admin'));
create policy "exercises admin write" on public.exercises for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- LEARNER DATA
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  correct boolean not null,
  response text,
  skill public.skill_area not null,
  level public.cefr_level not null,
  context text not null default 'lesson',
  created_at timestamptz not null default now()
);
grant select, insert on public.attempts to authenticated;
grant all on public.attempts to service_role;
alter table public.attempts enable row level security;
create policy "own attempts read" on public.attempts for select to authenticated using (auth.uid() = user_id);
create policy "own attempts insert" on public.attempts for insert to authenticated with check (auth.uid() = user_id);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  due_at timestamptz not null default now(),
  interval_days integer not null default 1,
  reps integer not null default 0,
  lapses integer not null default 0,
  source text not null default 'mistake',
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);
grant select, insert, update, delete on public.review_items to authenticated;
grant all on public.review_items to service_role;
alter table public.review_items enable row level security;
create policy "own review read" on public.review_items for select to authenticated using (auth.uid() = user_id);
create policy "own review write" on public.review_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.placement_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  overall public.cefr_level not null,
  confidence numeric not null default 0.7,
  per_skill jsonb not null default '{}'::jsonb,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert on public.placement_results to authenticated;
grant all on public.placement_results to service_role;
alter table public.placement_results enable row level security;
create policy "own placement read" on public.placement_results for select to authenticated using (auth.uid() = user_id);
create policy "own placement insert" on public.placement_results for insert to authenticated with check (auth.uid() = user_id);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  accuracy numeric,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
grant select, insert, update on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;
alter table public.lesson_progress enable row level security;
create policy "own progress read" on public.lesson_progress for select to authenticated using (auth.uid() = user_id);
create policy "own progress write" on public.lesson_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.exercises (lesson_id, position);
create index on public.exercises (is_placement);
create index on public.attempts (user_id, created_at desc);
create index on public.review_items (user_id, due_at);
