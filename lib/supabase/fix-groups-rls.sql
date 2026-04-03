-- Fix groups policies without recursive references between groups
-- and group_members.

drop policy if exists "Users can view groups they belong to" on groups;
drop policy if exists "Authenticated users can create groups" on groups;
drop policy if exists "Creator can update/delete their group" on groups;
drop policy if exists "Creator can update groups" on groups;
drop policy if exists "Creator can delete their group" on groups;
drop policy if exists "Creator can delete groups" on groups;

create policy "Users can view groups they belong to"
  on groups
  for select
  to authenticated
  using (
    created_by = auth.uid()
  );

create policy "Authenticated users can create groups"
  on groups
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
  );

create policy "Creator can update groups"
  on groups
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Creator can delete groups"
  on groups
  for delete
  to authenticated
  using (created_by = auth.uid());
