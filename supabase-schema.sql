create table if not exists public.student_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  course_name text not null default 'Web Design',
  course_status text not null default 'Active',
  progress_percent numeric(5, 2) not null default 0,
  total_lessons integer not null default 0,
  rating numeric(3, 1) not null default 0,
  quiz_score numeric(5, 2) not null default 0,
  lessons_completed integer not null default 0,
  learning_streak integer not null default 0,
  completed_chapters jsonb not null default '[]'::jsonb,
  completed_courses jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.student_progress
  add column if not exists completed_chapters jsonb not null default '[]'::jsonb,
  add column if not exists completed_courses jsonb not null default '[]'::jsonb;

alter table public.student_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'student_progress'
      and policyname = 'Users can read their own progress'
  ) then
    create policy "Users can read their own progress"
      on public.student_progress for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'student_progress'
      and policyname = 'Users can insert their own progress'
  ) then
    create policy "Users can insert their own progress"
      on public.student_progress for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'student_progress'
      and policyname = 'Users can update their own progress'
  ) then
    create policy "Users can update their own progress"
      on public.student_progress for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'student_progress'
  ) then
    alter publication supabase_realtime add table public.student_progress;
  end if;
end
$$;