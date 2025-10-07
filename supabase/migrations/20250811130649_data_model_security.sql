-- Ensure UUID generation extension
create extension if not exists pgcrypto;

-- Enums
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
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notice_actor_role') THEN
    CREATE TYPE notice_actor_role AS ENUM (
      'applicant',
      'council',
      'system'
    );
  END IF;
END
$$;

-- Councils table adjustments
alter table public.councils
  add column if not exists slug text,
  add column if not exists region notice_region,
  add column if not exists postal_address jsonb,
  add column if not exists reps_url text,
  add column if not exists is_verified boolean default false,
  add column if not exists reps_email text,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists councils_slug_key on public.councils(slug);

-- Ensure reps_email not null
alter table public.councils
  alter column reps_email set not null;

-- Trigger for updated_at on councils
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_councils_updated_at
before update on public.councils
for each row execute function public.set_updated_at();

-- Recreate notices table with UUID primary key
-- Drop dependent tables first
drop table if exists public.notice_events cascade;
drop table if exists public.notices cascade;

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references auth.users(id) default auth.uid(),
  status notice_status not null default 'draft',
  council_id uuid references public.councils(id),
  applicant_name text not null,
  applicant_email text not null,
  premises_address jsonb not null,
  application_type notice_application_type not null,
  region notice_region not null,
  activities jsonb[] not null default '{}'::jsonb[],
  reps_deadline date,
  application_date date not null,
  trading_name text,
  preview_text text,
  published_at timestamptz,
  publisher_of_record text not null default 'Public Notice Portal',
  audit jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_council_id_idx on public.notices(council_id);
create index if not exists notices_status_idx on public.notices(status);

create trigger set_notices_updated_at
before update on public.notices
for each row execute function public.set_updated_at();

-- Notice RLS
alter table public.notices enable row level security;

grant select on public.notices to anon, authenticated;
grant insert, update, delete on public.notices to authenticated;

create policy "Public read published notices" on public.notices
  for select using (status = 'published');

create policy "Applicants manage own notices" on public.notices
  for all to authenticated
  using (applicant_id = auth.uid())
  with check (applicant_id = auth.uid());

create policy "Councils read notices" on public.notices
  for select to authenticated
  using (auth.jwt()->>'council_id' = council_id::text);

create policy "Councils update notices" on public.notices
  for update to authenticated
  using (auth.jwt()->>'council_id' = council_id::text)
  with check (auth.jwt()->>'council_id' = council_id::text);

-- Notice events table
create table public.notice_events (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid references public.notices(id) on delete cascade,
  actor_id uuid,
  actor_role notice_actor_role,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.notice_events enable row level security;

grant select on public.notice_events to anon, authenticated;
grant insert on public.notice_events to authenticated;

create policy "Events visible to related users" on public.notice_events
  for select using (
    exists (
      select 1 from public.notices n
      where n.id = notice_events.notice_id
        and (
          n.status = 'published' or
          n.applicant_id = auth.uid() or
          auth.jwt()->>'council_id' = n.council_id::text
        )
    )
  );

create policy "Authenticated insert events" on public.notice_events
  for insert to authenticated
  with check (true);

-- Seed verified councils
insert into public.councils (id, name, slug, region, postal_address, reps_email, reps_url, is_verified)
values
  (gen_random_uuid(), 'Westminster City Council', 'westminster-city-council', 'england_wales',
   '{"line1":"Westminster City Hall","line2":"64 Victoria St","town":"London","postcode":"SW1E 6QP"}'::jsonb,
   'licensing@westminster.gov.uk', 'https://www.westminster.gov.uk/submit-representation', true),
  (gen_random_uuid(), 'Manchester City Council', 'manchester-city-council', 'england_wales',
   '{"line1":"Town Hall","line2":"","town":"Manchester","postcode":"M60 2LA"}'::jsonb,
   'licensing@manchester.gov.uk', 'https://www.manchester.gov.uk/licensing', true),
  (gen_random_uuid(), 'The City of Edinburgh Council', 'edinburgh-council', 'scotland',
   '{"line1":"City Chambers","line2":"High Street","town":"Edinburgh","postcode":"EH1 1YJ"}'::jsonb,
   'licensing@edinburgh.gov.uk', 'https://www.edinburgh.gov.uk/licensing', true),
  (gen_random_uuid(), 'Belfast City Council', 'belfast-city-council', 'ni',
   '{"line1":"City Hall","line2":"Donegall Square","town":"Belfast","postcode":"BT1 5GS"}'::jsonb,
   'licensing@belfastcity.gov.uk', 'https://www.belfastcity.gov.uk/licensing', true)
on conflict (slug) do nothing;

