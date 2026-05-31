create table if not exists public.workbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  problems jsonb not null default '[]'::jsonb
);

alter table public.workbooks enable row level security;

create policy "Users can read own workbooks"
on public.workbooks
for select
using (auth.uid() = user_id);

create policy "Users can insert own workbooks"
on public.workbooks
for insert
with check (auth.uid() = user_id);

create policy "Users can update own workbooks"
on public.workbooks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own workbooks"
on public.workbooks
for delete
using (auth.uid() = user_id);
