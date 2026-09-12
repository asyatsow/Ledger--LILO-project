import type { Debt, Concept } from './types';
import { demoDebts } from './demo';
import { getSupabaseClient } from './supabase/client';

const KEY = 'ledger-debts-v1';
const TABLE = 'debt_entries';

// ---------- localStorage fallback (demo / signed-out mode) ----------

function readLocal(): Debt[] {
  if (typeof window === 'undefined') return demoDebts;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Debt[]) : demoDebts;
  } catch {
    return demoDebts;
  }
}

function writeLocal(debts: Debt[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(debts));
  }
}

// ---------- Supabase row <-> Debt mapping ----------

type Row = {
  id: string;
  concept: Concept;
  original_error: string;
  ai_fix_summary: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  last_checked_at: string | null;
  last_question_id: string | null;
};

function fromRow(row: Row): Debt {
  return {
    id: row.id,
    concept: row.concept,
    original_error: row.original_error,
    ai_fix_summary: row.ai_fix_summary,
    status: row.status,
    created_at: row.created_at,
    resolved_at: row.resolved_at,
    last_checked_at: row.last_checked_at ?? row.resolved_at,
    last_question_id: row.last_question_id,
  };
}

async function getUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

// ---------- Public API (all async now — signed-in state loads from Supabase) ----------

export async function loadDebts(): Promise<Debt[]> {
  const client = getSupabaseClient();
  const userId = client ? await getUserId() : null;

  if (client && userId) {
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return (data as Row[]).map(fromRow);
    }
  }

  return readLocal();
}

export async function addDebt(
  debt: Omit<Debt, 'id' | 'created_at'> & { id?: string; created_at?: string }
): Promise<Debt> {
  const client = getSupabaseClient();
  const userId = client ? await getUserId() : null;

  if (client && userId) {
    const { data, error } = await client
      .from(TABLE)
      .insert({
        user_id: userId,
        concept: debt.concept,
        original_error: debt.original_error,
        ai_fix_summary: debt.ai_fix_summary,
        status: debt.status ?? 'open',
      })
      .select()
      .single();

    if (!error && data) return fromRow(data as Row);
  }

  const full: Debt = {
    id: debt.id ?? crypto.randomUUID(),
    created_at: debt.created_at ?? new Date().toISOString(),
    concept: debt.concept,
    original_error: debt.original_error,
    ai_fix_summary: debt.ai_fix_summary,
    status: debt.status ?? 'open',
    resolved_at: debt.resolved_at ?? null,
    last_checked_at: debt.last_checked_at ?? null,
    last_question_id: debt.last_question_id ?? null,
  };

  const all = readLocal();
  writeLocal([full, ...all]);
  return full;
}

/** First-time resolution of an open debt. */
export async function resolveDebt(id: string, questionId?: string): Promise<Debt[]> {
  const now = new Date().toISOString();
  const client = getSupabaseClient();
  const userId = client ? await getUserId() : null;

  if (client && userId) {
    await client
      .from(TABLE)
      .update({
        status: 'resolved',
        resolved_at: now,
        last_checked_at: now,
        last_question_id: questionId ?? null,
      })
      .eq('id', id);

    return loadDebts();
  }

  const all = readLocal().map((d) =>
    d.id === id
      ? {
          ...d,
          status: 'resolved' as const,
          resolved_at: now,
          last_checked_at: now,
          last_question_id: questionId ?? d.last_question_id ?? null,
        }
      : d
  );
  writeLocal(all);
  return all;
}

/**
 * Review Mode: re-verify a debt that's already resolved, any time —
 * "can I still do this before my interview." Does not change status,
 * just refreshes last_checked_at so confidence decay resets.
 */
export async function markChecked(id: string, questionId?: string): Promise<Debt[]> {
  const now = new Date().toISOString();
  const client = getSupabaseClient();
  const userId = client ? await getUserId() : null;

  if (client && userId) {
    await client
      .from(TABLE)
      .update({
        last_checked_at: now,
        last_question_id: questionId ?? null,
      })
      .eq('id', id);

    return loadDebts();
  }

  const all = readLocal().map((d) =>
    d.id === id
      ? { ...d, last_checked_at: now, last_question_id: questionId ?? d.last_question_id ?? null }
      : d
  );
  writeLocal(all);
  return all;
}

/** Records which question was just shown, without changing status (used on attempts, not just passes). */
export async function recordQuestionShown(id: string, questionId: string): Promise<void> {
  const client = getSupabaseClient();
  const userId = client ? await getUserId() : null;

  if (client && userId) {
    await client.from(TABLE).update({ last_question_id: questionId }).eq('id', id);
    return;
  }

  const all = readLocal().map((d) =>
    d.id === id ? { ...d, last_question_id: questionId } : d
  );
  writeLocal(all);
}

// ---------- Readiness / decay ----------

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_DAYS = 21; // resolved skills count fully for 3 weeks
const DECAY_WINDOW_DAYS = 60; // then soften over the next 60 days
const DECAY_FLOOR = 0.4; // never fully forget a resolved skill

/** How much credit a single resolved debt still contributes, based on how long since it was last verified. */
function decayFactor(lastChecked?: string | null): number {
  if (!lastChecked) return DECAY_FLOOR;
  const days = (Date.now() - new Date(lastChecked).getTime()) / DAY_MS;
  if (days <= GRACE_DAYS) return 1;
  const progress = Math.min(1, (days - GRACE_DAYS) / DECAY_WINDOW_DAYS);
  return 1 - progress * (1 - DECAY_FLOOR);
}

export type ConceptStats = {
  total: number;
  open: number;
  resolved: number;
  dependency: number;
  readiness: number;
  /** True once at least one resolved debt has started to decay and could use a refresh. */
  needsRefresh: boolean;
  /** The debt most worth re-testing right now: an open one first, else the stalest resolved one. */
  focusDebtId: string | null;
};

export function stats(debts: Debt[], concept: Concept): ConceptStats {
  const rows = debts.filter((d) => d.concept === concept);
  const open = rows.filter((d) => d.status === 'open');
  const resolved = rows.filter((d) => d.status === 'resolved');

  const effectiveResolved = resolved.reduce(
    (sum, d) => sum + decayFactor(d.last_checked_at ?? d.resolved_at),
    0
  );

  const total = rows.length;
  const readiness = total ? Math.round((effectiveResolved / total) * 100) : 0;
  const dependency = 100 - readiness;

  const needsRefresh = resolved.some(
    (d) => decayFactor(d.last_checked_at ?? d.resolved_at) < 1
  );

  const stalest = [...resolved].sort((a, b) => {
    const aTime = new Date(a.last_checked_at ?? a.resolved_at ?? a.created_at).getTime();
    const bTime = new Date(b.last_checked_at ?? b.resolved_at ?? b.created_at).getTime();
    return aTime - bTime;
  })[0];

  const focusDebtId = open[0]?.id ?? stalest?.id ?? null;

  return {
    total,
    open: open.length,
    resolved: resolved.length,
    dependency,
    readiness,
    needsRefresh,
    focusDebtId,
  };
}
