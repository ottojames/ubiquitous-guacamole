-- Create notices table with RLS policies
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  type text not null,
  title text not null,
  address text,
  description text,
  opening_hours text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.notices enable row level security;

-- Grant access privileges
grant select on public.notices to anon, authenticated;
grant insert, update on public.notices to authenticated;

-- Policies
create policy "Public read access" on public.notices
  for select
  using (true);

create policy "Authenticated insert" on public.notices
  for insert
  to authenticated
  with check (true);

create policy "Authenticated update" on public.notices
  for update
  to authenticated
  using (true)
  with check (true);
