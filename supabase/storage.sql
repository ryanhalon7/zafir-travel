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

  drop policy if exists "Authenticated users can manage trip photos" on storage.objects;
  create policy "Authenticated users can manage trip photos"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'trip-photos'
    and exists (
      select 1 from public.trip_members
      where "tripId" = (storage.foldername(name))[1]
        and "userId" = auth.uid()
    )
  )
  with check (
    bucket_id = 'trip-photos'
    and exists (
      select 1 from public.trip_members
      where "tripId" = (storage.foldername(name))[1]
        and "userId" = auth.uid()
    )
  );

  drop policy if exists "Authenticated users can manage trip documents" on storage.objects;
  create policy "Authenticated users can manage trip documents"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'trip-documents'
    and exists (
      select 1 from public.trip_members
      where "tripId" = (storage.foldername(name))[1]
        and "userId" = auth.uid()
    )
  )
  with check (
    bucket_id = 'trip-documents'
    and exists (
      select 1 from public.trip_members
      where "tripId" = (storage.foldername(name))[1]
        and "userId" = auth.uid()
    )
  );
end $$;
