-- Create enums for notices and events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notice_status') THEN
    CREATE TYPE notice_status AS ENUM (
      'draft',
      'submitted',
      'council_review',
      'approved',
      'published',
      'rejected'
    );
  END IF;
END
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notice_application_type') THEN
    CREATE TYPE notice_application_type AS ENUM (
      'grant',
      'variation',
      'review'
    );
  END IF;
END
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notice_region') THEN
    CREATE TYPE notice_region AS ENUM (
      'england_wales',
      'scotland',
      'ni'
    );
  END IF;
END
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notice_actor_role') THEN
    CREATE TYPE notice_actor_role AS ENUM (
      'applicant',
      'council',
      'system'
    );
  END IF;
END
$$;

-- Extend councils table
alter table public.councils
  rename column email to reps_email;

alter table public.councils
  add column if not exists region notice_region,
  add column if not exists postal_address jsonb,
  add column if not exists reps_url text,
  add column if not exists is_verified boolean default false,
  add column if not exists slug text,
  alter column reps_email set not null;

create unique index if not exists councils_slug_key on public.councils (slug);

-- Recreate notices table with new structure
-- Drop existing table if present
create table if not exists public._notices_old as table public.notices;
drop table if exists public.notices cascade;

create table public.notices (
  id bigint generated always as identity primary key,
  applicant_id uuid references auth.users(id) default auth.uid(),
  status notice_status not null default 'draft',
  council_id uuid references public.councils(id),
  applicant_name text not null,
  applicant_email text not null,
  premises_address_json jsonb not null,
  application_type notice_application_type not null,
  region notice_region not null,
  activities jsonb,
  reps_deadline date,
  preview_text text,
  published_at timestamptz,
  publisher_of_record text not null default 'Public Notice Portal',
  audit jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Notices RLS
alter table public.notices enable row level security;

grant select on public.notices to anon, authenticated;
grant insert, update on public.notices to authenticated;

create policy "Public read published notices" on public.notices
  for select using (status = 'published');

create policy "Applicants manage own drafts" on public.notices
  for all to authenticated
  using (applicant_id = auth.uid())
  with check (applicant_id = auth.uid() and status = 'draft');

create policy "Councils access notices" on public.notices
  for select to authenticated
  using (auth.jwt()->>'council_id' = council_id::text);

create policy "Councils update notices" on public.notices
  for update to authenticated
  using (auth.jwt()->>'council_id' = council_id::text)
  with check (auth.jwt()->>'council_id' = council_id::text);

-- Notice events table
create table if not exists public.notice_events (
  id bigint generated always as identity primary key,
  notice_id bigint references public.notices(id) on delete cascade,
  actor_id uuid,
  actor_role notice_actor_role,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.notice_events enable row level security;

grant select, insert on public.notice_events to authenticated;
grant select on public.notice_events to anon;

create policy "Events visible to related users" on public.notice_events
  for select using (
    exists (
      select 1 from public.notices n
      where n.id = notice_events.notice_id
        and (
          n.status = 'published'
          or n.applicant_id = auth.uid()
          or auth.jwt()->>'council_id' = n.council_id::text
        )
    )
  );

create policy "Events insert authenticated" on public.notice_events
  for insert to authenticated
  with check (true);
