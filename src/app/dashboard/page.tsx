"use client";

import Link from "next/link";
import { useDebts } from "@/lib/useDebts";
import { stats } from "@/lib/store";
import type { Concept } from "@/lib/types";

const concepts: { key: Concept; label: string }[] = [
  { key: "off_by_one", label: "Off-by-one" },
  { key: "null_handling", label: "Null handling" },
  { key: "scope_error", label: "Scope" },
  { key: "type_mismatch", label: "Type mismatch" },
  { key: "logic_error", label: "Logic" },
];

function getState(readiness: number) {
  if (readiness >= 70) {
    return { label: "Proven", color: "proven", progress: "progress-proven" };
  }
  if (readiness >= 40) {
    return { label: "Almost there", color: "almost", progress: "progress-almost" };
  }
  return { label: "Learning", color: "learning", progress: "progress-learning" };
}

export default function DashboardPage() {
  const { debts, loading } = useDebts();

  const rows = concepts
    .map((concept) => {
      const result = stats(debts, concept.key);
      return {
        ...concept,
        readiness: result.readiness,
        total: result.total,
        open: result.open,
        needsRefresh: result.needsRefresh,
        focusDebtId: result.focusDebtId,
        state: getState(result.readiness),
      };
    })
    .sort((a, b) => a.readiness - b.readiness);

  const total = debts.length;
  const resolved = debts.filter((debt) => debt.status === "resolved").length;
  const independence = total ? Math.round((resolved / total) * 100) : 0;
  const overall = getState(independence);

  const nextConcept = rows.find((row) => row.focusDebtId) ?? null;

  const mostFrequent = [...rows].filter((r) => r.total > 0).sort((a, b) => b.total - a.total)[0];

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-6xl px-7 py-7 md:px-12 md:py-10">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <Link href="/dashboard" className="ledger-display text-3xl md:text-4xl">
            Ledger
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
              Sign in
            </Link>
            <Link
              href="/log-bug"
              className="text-base font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 transition hover:decoration-[var(--ink)]"
            >
              Log a bug
            </Link>
          </div>
        </header>

        <section className="max-w-4xl pb-20 pt-20 md:pb-24 md:pt-24">
          <p className="ledger-display text-6xl leading-[0.92] md:text-8xl">
            Copilot makes you faster.
          </p>
          <p className="ledger-display mt-2 text-6xl leading-[0.92] text-[var(--muted)] md:text-8xl">
            Ledger tells you if you&apos;re getting better.
          </p>

          {mostFrequent && (
            <p className="mt-10 max-w-2xl text-xl leading-8 md:text-2xl md:leading-9">
              AI has helped you with{" "}
              <strong>{mostFrequent.label.toLowerCase()}</strong>{" "}
              {mostFrequent.total} {mostFrequent.total === 1 ? "time" : "times"}.
              {mostFrequent.focusDebtId ? " Can you do one right now?" : " You've proven it — check in anytime."}
            </p>
          )}

          <div className="mt-16 md:mt-20">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Independence
            </p>
            <p className={`ledger-display mt-1 text-8xl leading-none md:text-9xl ${overall.color}`}>
              {loading ? "—" : `${independence}%`}
            </p>
            <p className="mt-6 max-w-xl text-lg leading-7 text-[var(--muted)]">
              This isn&apos;t a one-time score. Skills soften over time if you
              don&apos;t revisit them — check in before it matters.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between border-b border-[var(--ink)] pb-4">
            <h2 className="ledger-serif text-3xl md:text-4xl">Your skills</h2>
            <span className="hidden text-sm text-[var(--muted)] md:block">
              Lowest independence first
            </span>
          </div>

          <div>
            {rows.map((row) => (
              <div key={row.key} className="border-b border-[var(--line)] py-9 md:py-10">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                      {row.label}
                    </h3>

                    {row.total > 0 && (
                      <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
                        AI has helped you with this {row.total}{" "}
                        {row.total === 1 ? "time" : "times"}.
                        {row.open === 0 && row.needsRefresh && (
                          <>
                            <br />
                            It&apos;s been a while — worth a quick check-in.
                          </>
                        )}
                      </p>
                    )}

                    <p className={`mt-5 text-base font-bold ${row.state.color}`}>
                      {row.state.label}
                    </p>
                  </div>

                  <div className="md:min-w-[150px] md:text-right">
                    <p className={`ledger-display text-5xl md:text-6xl ${row.state.color}`}>
                      {row.readiness}%
                    </p>

                    {row.focusDebtId ? (
                      <Link
                        href={`/test/${row.key}/${row.focusDebtId}`}
                        className={`mt-3 inline-block text-base font-semibold ${row.state.color} underline decoration-current underline-offset-4 transition-opacity hover:opacity-60`}
                      >
                        {row.open > 0 ? "Practice this →" : "Check in →"}
                      </Link>
                    ) : row.total > 0 ? (
                      <span className="mt-3 inline-block text-base font-semibold proven">
                        Proven
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="progress-track mt-7">
                  <div
                    className={row.state.progress}
                    style={{ width: `${row.readiness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {nextConcept && (
            <div className="pb-20 pt-10">
              <Link
                href={`/test/${nextConcept.key}/${nextConcept.focusDebtId}`}
                className="ledger-button text-base"
              >
                {nextConcept.readiness < 40
                  ? `Start ${nextConcept.label.toLowerCase()} →`
                  : `Practice ${nextConcept.label.toLowerCase()} →`}
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
