-- 1) Make uploader_id nullable
alter table public.uploads
  alter column uploader_id drop not null;

-- (Optional) keep default; will be NULL for service role calls
alter table public.uploads
  alter column uploader_id set default auth.uid();

-- 2) Policies (idempotent, ok if already exist)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='uploads' and policyname='uploads_insert_authenticated'
  ) then
    create policy "uploads_insert_authenticated"
      on public.uploads for insert to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='uploads' and policyname='uploads_select_authenticated'
  ) then
    create policy "uploads_select_authenticated"
      on public.uploads for select to authenticated
      using (true);
  end if;
end $$;

-- 3) Verify
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='uploads' and column_name='uploader_id';

select policyname, cmd, roles from pg_policies
where schemaname='public' and tablename='uploads'
order by policyname;
