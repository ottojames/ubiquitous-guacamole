create table if not exists councils (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email text not null,
  created_at timestamptz default now()
);

