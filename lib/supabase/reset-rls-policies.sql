-- SplitMint RLS cleanup
-- Run this whole file in the Supabase SQL editor.
-- It resets the main app policies with clearer authenticated checks.

alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

drop policy if exists "Users can view groups they belong to" on groups;
drop policy if exists "Authenticated users can create groups" on groups;
drop policy if exists "Creator can update/delete their group" on groups;
drop policy if exists "Creator can delete their group" on groups;

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

drop policy if exists "Members visible to group participants" on group_members;
drop policy if exists "Group creator can manage members" on group_members;

create policy "Members visible to group participants"
  on group_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
    or user_id = auth.uid()
  );

create policy "Group creator can insert members"
  on group_members
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
  );

create policy "Group creator can update members"
  on group_members
  for update
  to authenticated
  using (
    exists (
      select 1
      from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
  );

create policy "Group creator can delete members"
  on group_members
  for delete
  to authenticated
  using (
    exists (
      select 1
      from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
  );

drop policy if exists "Group members can view expenses" on expenses;
drop policy if exists "Group members can insert expenses" on expenses;
drop policy if exists "Expense creator can update/delete" on expenses;
drop policy if exists "Group creator can delete expenses" on expenses;

create policy "Group members can view expenses"
  on expenses
  for select
  to authenticated
  using (
    exists (
      select 1
      from group_members
      where group_members.group_id = expenses.group_id
        and group_members.user_id = auth.uid()
    )
    or exists (
      select 1
      from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  );

create policy "Group members can insert expenses"
  on expenses
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from group_members
      where group_members.group_id = expenses.group_id
        and group_members.user_id = auth.uid()
    )
    or exists (
      select 1
      from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  );

create policy "Group creator can update expenses"
  on expenses
  for update
  to authenticated
  using (
    exists (
      select 1
      from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  );

create policy "Group creator can delete expenses"
  on expenses
  for delete
  to authenticated
  using (
    exists (
      select 1
      from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  );

drop policy if exists "Splits visible to group members" on expense_splits;
drop policy if exists "Group members can manage splits" on expense_splits;

create policy "Splits visible to group members"
  on expense_splits
  for select
  to authenticated
  using (
    exists (
      select 1
      from expenses e
      join group_members gm on gm.group_id = e.group_id
      where e.id = expense_splits.expense_id
        and gm.user_id = auth.uid()
    )
    or exists (
      select 1
      from expenses e
      join groups g on g.id = e.group_id
      where e.id = expense_splits.expense_id
        and g.created_by = auth.uid()
    )
  );

create policy "Group creator can insert splits"
  on expense_splits
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from expenses e
      join groups g on g.id = e.group_id
      where e.id = expense_splits.expense_id
        and g.created_by = auth.uid()
    )
  );

create policy "Group creator can update splits"
  on expense_splits
  for update
  to authenticated
  using (
    exists (
      select 1
      from expenses e
      join groups g on g.id = e.group_id
      where e.id = expense_splits.expense_id
        and g.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from expenses e
      join groups g on g.id = e.group_id
      where e.id = expense_splits.expense_id
        and g.created_by = auth.uid()
    )
  );

create policy "Group creator can delete splits"
  on expense_splits
  for delete
  to authenticated
  using (
    exists (
      select 1
      from expenses e
      join groups g on g.id = e.group_id
      where e.id = expense_splits.expense_id
        and g.created_by = auth.uid()
    )
  );
