'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDebts } from '@/lib/useDebts';
import { resolveDebt, markChecked, recordQuestionShown } from '@/lib/store';
import { pickQuestion, type Question } from '@/lib/pickQuestion';
import type { Concept } from '@/lib/types';

const CONCEPTS: Concept[] = [
  'off_by_one',
  'null_handling',
  'scope_error',
  'type_mismatch',
  'logic_error',
];

type GradeResult = {
  passed: boolean;
  what_you_got: string;
  specific_gap: string;
  memory_clue: string;
  next_step: string;
};

function formatConcept(concept: string) {
  return concept
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function TestEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { debts, loading, refresh } = useDebts();

  const conceptParam = String(params.concept || '');
  const entryId = String(params.entryId || '');
  const concept = CONCEPTS.includes(conceptParam as Concept)
    ? (conceptParam as Concept)
    : null;

  const entry = useMemo(
    () => debts.find((d) => d.id === entryId) ?? null,
    [debts, entryId]
  );

  const isReview = entry?.status === 'resolved';

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && (!concept || (debts.length > 0 && !entry))) {
      router.replace(`/test/${conceptParam}`);
    }
  }, [loading, concept, entry, debts.length, conceptParam, router]);

  useEffect(() => {
    if (!entry || !concept) return;
    const q = pickQuestion(concept, entry.last_question_id);
    setQuestion(q);
    if (q) recordQuestionShown(entry.id, q.id);
  }, [entry, concept]);

  async function handleSubmit() {
    if (!answer.trim() || !entry || !question || !concept) return;

    setChecking(true);
    setResult(null);

    try {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (!response.ok) throw new Error(data.error || 'Unable to check your answer.');

      setResult(data);

      if (data.passed) {
        if (isReview) {
          await markChecked(entry.id, question.id);
        } else {
          await resolveDebt(entry.id, question.id);
        }
        await refresh();
      }
    } catch {
      setResult({
        passed: false,
        what_you_got: "We couldn't check your answer right now.",
        specific_gap: "Your answer hasn't been evaluated yet.",
        memory_clue: 'Think back to the original bug and the idea behind the AI fix.',
        next_step: 'Try again when Ledger can check your answer.',
      });
    } finally {
      setChecking(false);
    }
  }

  function tryAnotherQuestion() {
    if (!entry || !concept) return;
    const q = pickQuestion(concept, question?.id ?? entry.last_question_id);
    setQuestion(q);
    setResult(null);
    setAnswer('');
    if (q) recordQuestionShown(entry.id, q.id);
  }

  if (loading || !entry || !concept || !question) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </main>
    );
  }

  const passed = result?.passed === true;

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={() => router.push(`/test/${concept}`)}
          className="mb-8 text-sm text-neutral-500 hover:text-black"
        >
          ← Back to {formatConcept(concept)}
        </button>

        <div className="mb-8 border border-black bg-black px-5 py-4 text-white">
          <p className="text-xs font-semibold tracking-[0.18em]">
            AI ASSISTANCE: OFF
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            {isReview
              ? 'Confirming this skill is still yours'
              : 'Independent attempt required'}
          </p>
        </div>

        {!result && (
          <>
            <p className="text-sm font-medium text-neutral-500">
              {isReview ? 'Review mode' : 'Prove this skill'}
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {formatConcept(concept)}
            </h1>

            <p className="mt-4 max-w-2xl text-neutral-600">
              {isReview
                ? "You already proved this once. Let's make sure it's still there — this is what \"check before my interview\" looks like."
                : 'You used AI to solve a related problem earlier. Now show that the underlying skill stuck.'}
            </p>

            <section className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Transfer question
              </p>
              <div className="mt-3 border border-neutral-200 bg-neutral-50 p-6">
                <p className="text-lg leading-8">{question.prompt}</p>
              </div>
            </section>

            <section className="mt-8">
              <label htmlFor="answer" className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Your answer
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={checking}
                placeholder="Explain it in your own words..."
                className="mt-3 min-h-[180px] w-full resize-y border border-neutral-300 px-4 py-4 text-base outline-none focus:border-black disabled:bg-neutral-100"
              />
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || checking}
                className="mt-4 bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checking ? 'Checking your answer...' : 'Check my answer'}
              </button>
            </section>
          </>
        )}

        {result && (
          <section className="mt-6">
            <div className={`border p-7 ${passed ? 'border-black bg-black text-white' : 'border-neutral-200 bg-neutral-50 text-black'}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${passed ? 'text-neutral-300' : 'text-neutral-500'}`}>
                {passed ? 'Skill proven' : 'Almost there'}
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {passed
                  ? isReview
                    ? "Still yours."
                    : 'You know this one.'
                  : "You're getting there."}
              </h2>

              <div className={`mt-6 space-y-5 text-base leading-7 ${passed ? 'text-neutral-200' : 'text-neutral-700'}`}>
                {!passed && result.what_you_got && <p>{result.what_you_got}</p>}
                {!passed && result.specific_gap && <p>{result.specific_gap}</p>}
                {!passed && result.memory_clue && (
                  <p>
                    <span className="font-semibold text-black">Think back:</span>{' '}
                    {result.memory_clue}
                  </p>
                )}
                {passed && (
                  <p>
                    {isReview
                      ? 'You checked in, and it held up. Independence isn\u2019t a one-time score \u2014 it\u2019s something you can keep proving.'
                      : 'Proven. You used to need help with this — not anymore.'}
                  </p>
                )}
                {result.next_step && (
                  <p className={passed ? 'text-neutral-200' : 'text-black'}>{result.next_step}</p>
                )}
              </div>

              {passed ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-white px-5 py-3 text-sm font-medium text-black hover:bg-neutral-200"
                  >
                    See my progress
                  </button>
                  <button
                    onClick={tryAnotherQuestion}
                    className="border border-neutral-600 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    Practice again
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setResult(null);
                    setAnswer('');
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
