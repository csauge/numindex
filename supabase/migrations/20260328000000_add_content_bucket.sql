-- Create a public bucket for content files like the guide
insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do nothing;

-- Set up RLS for the content bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'content' );

create policy "Admin Insert"
  on storage.objects for insert
  with check ( bucket_id = 'content' and auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin' );

create policy "Admin Update"
  on storage.objects for update
  using ( bucket_id = 'content' and auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin' );

create policy "Admin Delete"
  on storage.objects for delete
  using ( bucket_id = 'content' and auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin' );
