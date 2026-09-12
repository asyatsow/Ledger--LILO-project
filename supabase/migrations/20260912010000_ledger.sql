create table if not exists debt_entries (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users not null, concept text not null check (concept in ('off_by_one','null_handling','scope_error','type_mismatch','logic_error')), original_error text not null, ai_fix_summary text not null, status text not null default 'open' check(status in ('open','resolved')), created_at timestamptz not null default now(), resolved_at timestamptz);
alter table debt_entries enable row level security;
create policy "Users can view their own debt entries" on debt_entries for select using (auth.uid()=user_id);
create policy "Users can insert their own debt entries" on debt_entries for insert with check (auth.uid()=user_id);
create policy "Users can update their own debt entries" on debt_entries for update using (auth.uid()=user_id);
