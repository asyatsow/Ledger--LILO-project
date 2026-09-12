"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import questionBank from "@/lib/questions.json";
import {
  loadDebts,
  resolveDebt,
} from "@/lib/store";
import type { Debt } from "@/lib/types";

const CONCEPTS = [
  "off_by_one",
  "null_handling",
  "scope_error",
  "type_mismatch",
  "logic_error",
] as const;

type Concept = (typeof CONCEPTS)[number];

type Question = {
  id: string;
  prompt: string;
  expected_understanding: string;
};

type GradeResult = {
  passed: boolean;
  what_you_got: string;
  specific_gap: string;
  memory_clue: string;
  next_step: string;
};

function formatConcept(concept: string) {
  return concept
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

export default function TestConceptPage() {
  const params = useParams();
  const router = useRouter();

  const conceptParam = String(params.concept || "");

  const concept = CONCEPTS.includes(
    conceptParam as Concept
  )
    ? (conceptParam as Concept)
    : null;

  const [entry, setEntry] = useState<Debt | null>(null);
  const [question, setQuestion] =
    useState<Question | null>(null);

  const [answer, setAnswer] = useState("");
  const [result, setResult] =
    useState<GradeResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!concept) {
      router.replace("/dashboard");
      return;
    }

    const entries = loadDebts();

    const openEntry = entries.find(
      (item) =>
        item.concept === concept &&
        item.status === "open"
    );

    setEntry(openEntry || null);

    const questions =
      questionBank[
        concept as keyof typeof questionBank
      ] as readonly Question[];

    if (questions?.length) {
      setQuestion(questions[0]);
    }

    setLoading(false);
  }, [concept, router]);

  async function handleSubmit() {
    if (
      !answer.trim() ||
      !entry ||
      !question ||
      !concept
    ) {
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entry_id: entry.id,
          concept,
          question_id: question.id,
          user_answer: answer,
          original_error: entry.original_error,
          ai_fix_summary: entry.ai_fix_summary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to check your answer."
        );
      }

      setResult(data);

      if (data.passed) {
        resolveDebt(entry.id);

        setEntry({
          ...entry,
          status: "resolved",
        });
      }
    } catch {
      setResult({
        passed: false,
        what_you_got:
          "We couldn't check your answer right now.",
        specific_gap:
          "Your answer hasn't been evaluated yet.",
        memory_clue:
          "Think back to the original bug and the idea behind the AI fix.",
        next_step:
          "Try again when Ledger can check your answer.",
      });
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-neutral-500">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!concept || !question) {
    return null;
  }

  if (!entry) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-10 text-sm text-neutral-500 hover:text-black"
          >
            ← Back to dashboard
          </button>

          <div className="border border-neutral-200 p-8">
            <h1 className="text-2xl font-semibold">
              Nothing to prove here
            </h1>

            <p className="mt-3 text-neutral-600">
              You don't have an open{" "}
              {formatConcept(concept)} item right now.
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const passed = result?.passed === true;

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-10">

        <nav className="mb-10 flex items-center justify-between border-b border-neutral-200 pb-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-lg font-semibold tracking-tight"
          >
            ledger_
          </button>

          <div className="flex gap-6 text-sm text-neutral-500">
            <button
              onClick={() => router.push("/dashboard")}
              className="hover:text-black"
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push("/log-bug")}
              className="hover:text-black"
            >
              Log a bug
            </button>

            <span className="text-black">
              Test me
            </span>
          </div>
        </nav>

        <button
          onClick={() => router.push("/dashboard")}
          className="mb-8 text-sm text-neutral-500 hover:text-black"
        >
          ← Back to dashboard
        </button>

        {/* AI OFF BANNER */}

        <div className="mb-8 border border-black bg-black px-5 py-4 text-white">
          <p className="text-xs font-semibold tracking-[0.18em]">
            AI ASSISTANCE: OFF
          </p>

          <p className="mt-1 text-sm text-neutral-300">
            Independent attempt required
          </p>
        </div>

        {/* QUESTION */}

        {!result && (
          <>
            <p className="text-sm font-medium text-neutral-500">
              Prove this skill
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {formatConcept(concept)}
            </h1>

            <p className="mt-4 max-w-2xl text-neutral-600">
              You used AI to solve a related problem earlier.
              Now show that the underlying skill stuck.
            </p>

            <section className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Transfer question
              </p>

              <div className="mt-3 border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-lg leading-8">
                  {question.prompt}
                </p>
              </div>
            </section>

            <section className="mt-8">
              <label
                htmlFor="answer"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500"
              >
                Your answer
              </label>

              <textarea
                id="answer"
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                disabled={checking}
                placeholder="Explain it in your own words..."
                className="mt-3 min-h-[180px] w-full resize-y border border-neutral-300 px-4 py-4 text-base outline-none focus:border-black disabled:bg-neutral-100"
              />

              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || checking}
                className="mt-4 bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checking
                  ? "Checking your answer..."
                  : "Check my answer"}
              </button>
            </section>
          </>
        )}

        {/* ONE FEEDBACK BOX */}

        {result && (
          <section className="mt-6">
            <div
              className={`border p-7 ${
                passed
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 bg-neutral-50 text-black"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                  passed
                    ? "text-neutral-300"
                    : "text-neutral-500"
                }`}
              >
                {passed
                  ? "Skill proven"
                  : "Almost there"}
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {passed
                  ? "You know this one."
                  : "You're getting there."}
              </h2>

              <div
                className={`mt-6 space-y-5 text-base leading-7 ${
                  passed
                    ? "text-neutral-200"
                    : "text-neutral-700"
                }`}
              >
                {!passed && result.what_you_got && (
                  <p>{result.what_you_got}</p>
                )}

                {!passed && result.specific_gap && (
                  <p>{result.specific_gap}</p>
                )}

                {!passed && result.memory_clue && (
                  <p>
                    <span className="font-semibold text-black">
                      Think back:
                    </span>{" "}
                    {result.memory_clue}
                  </p>
                )}

                {passed && (
                  <p>
                    Proven. You used to need help with this —
                    not anymore.
                  </p>
                )}

                {result.next_step && (
                  <p
                    className={
                      passed
                        ? "text-neutral-200"
                        : "text-black"
                    }
                  >
                    {result.next_step}
                  </p>
                )}
              </div>

              {passed ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-white px-5 py-3 text-sm font-medium text-black hover:bg-neutral-200"
                  >
                    See my progress
                  </button>

                  <button
                    onClick={() => {
                      setResult(null);
                      setAnswer("");
                    }}
                    className="border border-neutral-600 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    Practice again
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setResult(null);
                    setAnswer("");
                  }}
                  className="mt-8 bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Try again
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}