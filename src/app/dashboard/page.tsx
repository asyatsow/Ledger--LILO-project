"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadDebts, stats, type Debt } from "@/lib/store";
import type { Concept } from "@/lib/types";

const concepts: { key: Concept; label: string }[] = [
  { key: "off_by_one", label: "Off-by-one" },
  { key: "null_handling", label: "Null handling" },
  { key: "scope_error", label: "Scope" },
  { key: "type_mismatch", label: "Type mismatch" },
  { key: "logic_error", label: "Logic" },
];

function getState(independence: number) {
  if (independence >= 70) {
    return {
      label: "Proven",
      color: "proven",
      progress: "progress-proven",
    };
  }

  if (independence >= 40) {
    return {
      label: "Almost there",
      color: "almost",
      progress: "progress-almost",
    };
  }

  return {
    label: "Learning",
    color: "learning",
    progress: "progress-learning",
  };
}

export default function DashboardPage() {
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    setDebts(loadDebts());
  }, []);

  const rows = concepts
    .map((concept) => {
      const result = stats(debts, concept.key);

      return {
        ...concept,
        independence: result.readiness,
        total: result.total,
        open: result.open,
        state: getState(result.readiness),
      };
    })
    .sort((a, b) => a.independence - b.independence);

  const total = debts.length;
  const resolved = debts.filter(
    (debt) => debt.status === "resolved"
  ).length;

  const independence = total
    ? Math.round((resolved / total) * 100)
    : 0;

  const overall = getState(independence);

  const nextConcept =
    rows.find((row) => row.open > 0) ?? rows[0];

  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-6xl px-7 py-7 md:px-12 md:py-10">

        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <Link
            href="/dashboard"
            className="ledger-display text-3xl md:text-4xl"
          >
            Ledger
          </Link>

          <Link
            href="/log-bug"
            className="text-base font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 transition hover:decoration-[var(--ink)]"
          >
            Log a bug
          </Link>
        </header>

        <section className="max-w-4xl pb-20 pt-20 md:pb-24 md:pt-24">
          <p className="ledger-display text-6xl leading-[0.92] md:text-8xl">
            Know what you know.
          </p>

          <p className="mt-8 max-w-2xl text-xl leading-8 md:text-2xl md:leading-9">
            Use AI to code faster. Know which skills are actually yours.
          </p>

          <div className="mt-16 md:mt-20">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Independence
            </p>

            <p
              className={`ledger-display mt-1 text-8xl leading-none md:text-9xl ${overall.color}`}
            >
              {independence}%
            </p>

            <p className="mt-6 max-w-xl text-lg leading-7 text-[var(--muted)]">
              You&apos;re making progress. Here&apos;s where to focus next.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between border-b border-[var(--ink)] pb-4">
            <h2 className="ledger-serif text-3xl md:text-4xl">
              Your skills
            </h2>

            <span className="hidden text-sm text-[var(--muted)] md:block">
              Lowest independence first
            </span>
          </div>

          <div>
            {rows.map((row) => (
              <div
                key={row.key}
                className="border-b border-[var(--line)] py-9 md:py-10"
              >
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">

                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                      {row.label}
                    </h3>

                    {row.total >= 5 && (
                      <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
                        You&apos;ve hit this pattern {row.total} times.
                        <br />
                        Let&apos;s turn it into a skill you own.
                      </p>
                    )}

                    <p
                      className={`mt-5 text-base font-bold ${row.state.color}`}
                    >
                      {row.state.label}
                    </p>
                  </div>

                  <div className="md:min-w-[150px] md:text-right">
                    <p
                      className={`ledger-display text-5xl md:text-6xl ${row.state.color}`}
                    >
                      {row.independence}%
                    </p>

                    {row.open > 0 ? (
                      <Link
                        href={`/test/${row.key}`}
                        className={`mt-3 inline-block text-base font-semibold ${row.state.color} underline decoration-current underline-offset-4 transition-opacity hover:opacity-60`}
                      >
                        Practice this →
                      </Link>
                    ) : (
                      <span className="mt-3 inline-block text-base font-semibold proven">
                        Proven
                      </span>
                    )}
                  </div>
                </div>

                <div className="progress-track mt-7">
                  <div
                    className={row.state.progress}
                    style={{
                      width: `${row.independence}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {nextConcept && (
            <div className="pb-20 pt-10">
              <Link
                href={`/test/${nextConcept.key}`}
                className="ledger-button text-base"
              >
                {nextConcept.independence < 40
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