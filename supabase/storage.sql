insert into storage.buckets (id, name, public)
values
  ('trip-covers', 'trip-covers', true),
  ('trip-photos', 'trip-photos', false),
  ('trip-documents', 'trip-documents', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can read trip covers'
  ) then
    create policy "Authenticated users can read trip covers"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'trip-covers');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload trip covers'
  ) then
    create policy "Authenticated users can upload trip covers"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'trip-covers');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can manage trip photos'
  ) then
    create policy "Authenticated users can manage trip photos"
    on storage.objects for all
    to authenticated
    using (bucket_id = 'trip-photos')
    with check (bucket_id = 'trip-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can manage trip documents'
  ) then
    create policy "Authenticated users can manage trip documents"
    on storage.objects for all
    to authenticated
    using (bucket_id = 'trip-documents')
    with check (bucket_id = 'trip-documents');
  end if;
end $$;
