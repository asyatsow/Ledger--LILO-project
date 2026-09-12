"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import questions from "@/lib/questions.json";
import { loadDebts, resolveDebt } from "@/lib/store";
import type { Concept, Debt } from "@/lib/types";
import { CONCEPT_LABELS } from "@/lib/types";

export default function Test({
  params,
}: {
  params: Promise<{ concept: string }>;
}) {
  const [concept, setConcept] = useState<Concept>("off_by_one");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [debt, setDebt] = useState<Debt | null>(null);

  useEffect(() => {
    params.then((p) => {
      const c = p.concept as Concept;
      setConcept(c);

      const d = loadDebts().find(
        (x) => x.concept === c && x.status === "open"
      );

      setDebt(d || null);
    });
  }, [params]);

  const q = (questions as any)[concept]?.[0];

  const submit = async () => {
    if (!debt || !answer || !q) return;

    setLoading(true);

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          concept,
          question_id: q.id,
          user_answer: answer,
          entry_id: debt.id,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.pass) {
        resolveDebt(debt.id);

        setDebt({
          ...debt,
          status: "resolved",
          resolved_at: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-5 md:p-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-xs underline">
          ← DASHBOARD
        </Link>

        <div className="mt-10">
          <div className="text-[10px] tracking-[.2em] text-[#85827a]">
            02 / PROVE THE SKILL
          </div>

          <h1 className="mt-2 text-4xl font-black tracking-[-.06em]">
            {CONCEPT_LABELS[concept]}
          </h1>

          <p className="sans mt-3 text-sm text-[#68665f]">
            A fresh question tests the same concept. No AI assistance here.
            Your answer is the proof.
          </p>
        </div>

        {!debt ? (
          <div className="card mt-8 p-6">
            No open learning debt for this concept.{" "}
            <Link className="underline" href="/log-bug">
              Log a bug first.
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 bg-black text-white p-5 text-xs">
              <span className="font-bold">AI ASSISTANCE: OFF</span>
              <span className="ml-3 text-[#aaa]">
                Independent attempt required
              </span>
            </div>

            <div className="card mt-4 p-6">
              <div className="text-[10px] tracking-[.15em] text-[#85827a]">
                TRANSFER QUESTION
              </div>

              <p className="sans mt-4 text-base leading-7">
                {q?.prompt}
              </p>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explain your reasoning…"
                className="mt-6 w-full h-44 bg-[#f4f3ee] p-4 text-sm outline-none resize-none"
              />

              <button
                onClick={submit}
                disabled={loading || !answer}
                className="mt-4 bg-black text-white px-6 py-3 text-xs font-bold disabled:opacity-40"
              >
                {loading ? "GRADING…" : "SUBMIT FOR PROOF →"}
              </button>
            </div>

            {result && (
              <div
                className={`card mt-5 p-6 ${
                  result.pass
                    ? "bg-[var(--accent)]"
                    : "bg-[var(--warning)]"
                }`}
              >
                <div className="text-2xl font-black">
                  {result.pass ? "DEBT PAID" : "NOT YET"}
                </div>

                <p className="sans mt-2 text-sm">
                  {result.feedback}
                </p>

                {result.pass && (
                  <Link
                    href="/dashboard"
                    className="inline-block mt-4 underline text-xs font-bold"
                  >
                    VIEW UPDATED READINESS →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}