-- ============================================================
-- SplitMint — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable RLS globally
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ─── GROUPS ──────────────────────────────────────────────────
create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

alter table groups enable row level security;

create policy "Users can view groups they belong to"
  on groups for select
  using (
    auth.uid() = created_by
  );

create policy "Authenticated users can create groups"
  on groups for insert
  with check (auth.uid() = created_by);

create policy "Creator can update/delete their group"
  on groups for update using (auth.uid() = created_by);

create policy "Creator can delete their group"
  on groups for delete using (auth.uid() = created_by);


-- ─── GROUP MEMBERS ───────────────────────────────────────────
create table if not exists group_members (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references groups(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  display_name  text not null,
  color         text default '#6366f1',
  avatar_url    text,
  created_at    timestamptz default now()
);

alter table group_members enable row level security;

create policy "Members visible to group participants"
  on group_members for select
  using (
    exists (
      select 1 from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
    or user_id = auth.uid()
  );

create policy "Group creator can manage members"
  on group_members for all
  using (
    exists (
      select 1 from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
  );


-- ─── EXPENSES ─────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id) on delete cascade,
  description text not null,
  amount      numeric(12, 2) not null check (amount > 0),
  date        date not null default current_date,
  payer_id    uuid references group_members(id) on delete set null,
  split_mode  text not null check (split_mode in ('equal', 'custom', 'percentage')),
  category    text default 'other',
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table expenses enable row level security;

create policy "Group members can view expenses"
  on expenses for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = expenses.group_id
        and group_members.user_id = auth.uid()
    )
    or exists (
      select 1 from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  );

create policy "Group members can insert expenses"
  on expenses for insert
  with check (
    exists (
      select 1 from group_members
      where group_members.group_id = expenses.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Expense creator can update/delete"
  on expenses for update using (
    exists (
      select 1 from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  );

create policy "Group creator can delete expenses"
  on expenses for delete using (
    exists (
      select 1 from groups
      where groups.id = expenses.group_id
        and groups.created_by = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();


-- ─── EXPENSE SPLITS ───────────────────────────────────────────
create table if not exists expense_splits (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid references expenses(id) on delete cascade,
  member_id   uuid references group_members(id) on delete cascade,
  amount      numeric(12, 2),
  percentage  numeric(5, 2),
  created_at  timestamptz default now()
);

alter table expense_splits enable row level security;

create policy "Splits visible to group members"
  on expense_splits for select
  using (
    exists (
      select 1 from expenses e
      join group_members gm on gm.group_id = e.group_id
      where e.id = expense_splits.expense_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Group members can manage splits"
  on expense_splits for all
  using (
    exists (
      select 1 from expenses e
      join groups g on g.id = e.group_id
      where e.id = expense_splits.expense_id
        and g.created_by = auth.uid()
    )
  );


-- ─── USEFUL VIEWS ─────────────────────────────────────────────

-- Net balance per member per group
create or replace view member_balances as
select
  gm.id as member_id,
  gm.display_name,
  gm.group_id,
  gm.color,
  coalesce(paid.total, 0) - coalesce(owed.total, 0) as net_balance
from group_members gm
left join (
  select payer_id, sum(amount) as total
  from expenses
  group by payer_id
) paid on paid.payer_id = gm.id
left join (
  select member_id, sum(amount) as total
  from expense_splits
  group by member_id
) owed on owed.member_id = gm.id;
