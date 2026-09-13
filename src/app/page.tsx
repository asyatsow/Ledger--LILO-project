"use client";

import Link from "next/link";
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  CircleDot,
  Clock3,
  Database,
  GitBranch,
  Play,
} from "lucide-react";
import { useDebts } from "@/lib/useDebts";
import { stats } from "@/lib/store";
import type { Concept } from "@/lib/types";

const concepts: {
  key: Concept;
  label: string;
  detail: string;
  icon: typeof Braces;
}[] = [
  {
    key: "off_by_one",
    label: "Off-by-one errors",
    detail: "Loops and array boundaries",
    icon: Braces,
  },
  {
    key: "null_handling",
    label: "Null handling",
    detail: "Missing and optional values",
    icon: CircleDot,
  },
  {
    key: "scope_error",
    label: "Scope",
    detail: "Variables and visibility",
    icon: GitBranch,
  },
  {
    key: "type_mismatch",
    label: "Type mismatch",
    detail: "Data types and conversions",
    icon: Database,
  },
  {
    key: "logic_error",
    label: "Logic",
    detail: "Conditions and program flow",
    icon: CheckCircle2,
  },
];

function stateFor(readiness: number, total: number) {
  if (!total) {
    return {
      label: "Not started",
      className: "neutral-status",
    };
  }

  if (readiness >= 70) {
    return {
      label: "Mastered",
      className: "mastered-status",
    };
  }

  if (readiness >= 40) {
    return {
      label: "Almost there",
      className: "almost-status",
    };
  }

  return {
    label: "Learning",
    className: "learning-status",
  };
}

export default function DashboardPage() {
  const { debts, loading } = useDebts();

  const rows = concepts
    .map((concept) => {
      const result = stats(debts, concept.key);

      return {
        ...concept,
        ...result,
        state: stateFor(result.readiness, result.total),
      };
    })
    .sort((a, b) => b.open - a.open || a.readiness - b.readiness);

  const total = debts.length;

  const resolved = debts.filter(
    (debt) => debt.status === "resolved"
  ).length;

  const independence = total
    ? Math.round((resolved / total) * 100)
    : 0;

  const reviewRows = rows
    .filter((row) => row.focusDebtId)
    .slice(0, 2);

  const next = reviewRows[0];

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <h1>Good afternoon</h1>

          <p>
            {reviewRows.length
              ? `${reviewRows.length} concepts are ready for a quick check today.`
              : "Your learning ledger is up to date."}
          </p>
        </div>

        {next && (
          <Link
            className="primary-button"
            href={`/test/${next.key}/${next.focusDebtId}`}
          >
            <Play size={16} fill="currentColor" />
            Start review
          </Link>
        )}
      </section>

      <section className="metric-grid" aria-label="Learning summary">
        <article className="metric-card">
          <span>Concepts saved</span>
          <strong>{loading ? "—" : total}</strong>
          <small>From your AI-assisted fixes</small>
        </article>

        <article className="metric-card">
          <span>Ready to review</span>

          <strong className="coral-text">
            {loading ? "—" : reviewRows.length}
          </strong>

          <small>
            {reviewRows.length
              ? "About 8 minutes"
              : "Nothing due today"}
          </small>
        </article>

        <article className="metric-card">
          <div className="metric-row">
            <span>Independent mastery</span>
            <strong>{loading ? "—" : `${independence}%`}</strong>
          </div>

          <div className="mastery-track">
            <span style={{ width: `${independence}%` }} />
          </div>

          <small>
            {resolved} of {total} learning checks passed
          </small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <div>
              <span className="section-label">
                Your learning ledger
              </span>

              <h2>What you know on your own</h2>
            </div>

            <Link href="/log-bug" className="text-link">
              Add a fix
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="concept-list">
            {rows.map((row) => {
              const Icon = row.icon;

              const href = row.focusDebtId
                ? `/test/${row.key}/${row.focusDebtId}`
                : "/log-bug";

              return (
                <Link
                  href={href}
                  className="concept-card"
                  key={row.key}
                >
                  <span className="concept-icon">
                    <Icon size={20} />
                  </span>

                  <span className="concept-copy">
                    <strong>{row.label}</strong>

                    <small>
                      {row.detail} · {row.total}{" "}
                      {row.total === 1 ? "entry" : "entries"}
                    </small>
                  </span>

                  <span
                    className={`status-pill ${row.state.className}`}
                  >
                    {row.state.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="review-card">
          <span className="today-pill">
            <Clock3 size={14} />
            Today
          </span>

          <h2>Small review, real progress</h2>

          <p>
            Practice the idea without AI. Your results update the
            dashboard automatically.
          </p>

          <div className="review-list">
            {reviewRows.length ? (
              reviewRows.map((row) => (
                <div key={row.key}>
                  <span>{row.label}</span>
                  <small>4 min</small>
                </div>
              ))
            ) : (
              <div>
                <span>No reviews due</span>
                <small>All caught up</small>
              </div>
            )}
          </div>

          {next ? (
            <Link
              className="yellow-button"
              href={`/test/${next.key}/${next.focusDebtId}`}
            >
              Begin review
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link className="yellow-button" href="/log-bug">
              Log a new fix
              <ArrowRight size={16} />
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}