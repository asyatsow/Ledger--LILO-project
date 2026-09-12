alter table debt_entries
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_question_id text;

-- Backfill: existing resolved debts were last verified when they were resolved.
update debt_entries
set last_checked_at = resolved_at
where status = 'resolved' and last_checked_at is null;
