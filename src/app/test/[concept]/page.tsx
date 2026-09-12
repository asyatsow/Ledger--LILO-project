'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDebts } from '@/lib/useDebts';
import { CONCEPT_LABELS } from '@/lib/types';
import type { Concept } from '@/lib/types';

const CONCEPTS: Concept[] = [
  'off_by_one',
  'null_handling',
  'scope_error',
  'type_mismatch',
  'logic_error',
];

function timeAgo(iso?: string | null) {
  if (!iso) return 'never verified';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'verified today';
  if (days === 1) return 'verified 1 day ago';
  return `verified ${days} days ago`;
}

export default function ConceptChooserPage() {
  const params = useParams();
  const router = useRouter();
  const { debts, loading } = useDebts();

  const conceptParam = String(params.concept || '');
  const concept = CONCEPTS.includes(conceptParam as Concept)
    ? (conceptParam as Concept)
    : null;

  if (!concept) {
    if (typeof window !== 'undefined') router.replace('/dashboard');
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-black">
        <p className="text-sm text-neutral-500">Loading...</p>
      </main>
    );
  }

  const rows = debts.filter((d) => d.concept === concept);
  const open = rows.filter((d) => d.status === 'open');
  const resolved = rows.filter((d) => d.status === 'resolved');

  return (
    <main className="min-h-screen bg-[var(--paper)] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-xs underline">
          ← DASHBOARD
        </Link>

        <p className="mt-8 text-sm font-medium text-[#85827a]">
          Every debt is proven on its own
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">
          {CONCEPT_LABELS[concept]}
        </h1>
        <p className="mt-3 max-w-xl text-[#68665f]">
          AI has helped you with this {rows.length}{' '}
          {rows.length === 1 ? 'time' : 'times'}. Each one below is checked
          separately — clearing one doesn&apos;t clear the rest.
        </p>

        {open.length > 0 && (
          <section className="mt-10">
            <p className="text-[10px] tracking-[.15em] text-[#85827a]">
              OPEN — PROVE THESE
            </p>
            <div className="mt-3 space-y-3">
              {open.map((d) => (
                <Link
                  key={d.id}
                  href={`/test/${concept}/${d.id}`}
                  className="card block p-5 hover:bg-[#f4f3ee]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {d.original_error}
                      </div>
                      <div className="mt-1 text-xs text-[#85827a]">
                        {d.ai_fix_summary}
                      </div>
                    </div>
                    <span className="bg-[var(--warning)] px-2 py-1 text-[10px] font-bold shrink-0">
                      OPEN
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {resolved.length > 0 && (
          <section className="mt-10">
            <p className="text-[10px] tracking-[.15em] text-[#85827a]">
              RESOLVED — CHECK ANYTIME
            </p>
            <p className="mt-2 text-sm text-[#68665f]">
              Before an interview or exam, use these to confirm the skill is
              still yours.
            </p>
            <div className="mt-3 space-y-3">
              {resolved.map((d) => (
                <Link
                  key={d.id}
                  href={`/test/${concept}/${d.id}`}
                  className="card block p-5 hover:bg-[#f4f3ee]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {d.original_error}
                      </div>
                      <div className="mt-1 text-xs text-[#85827a]">
                        {timeAgo(d.last_checked_at ?? d.resolved_at)}
                      </div>
                    </div>
                    <span className="bg-[var(--accent)] px-2 py-1 text-[10px] font-bold shrink-0">
                      REVIEW
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {rows.length === 0 && (
          <div className="card mt-10 p-8">
            <h2 className="text-xl font-semibold">Nothing logged yet</h2>
            <p className="mt-2 text-[#68665f]">
              You don&apos;t have any {CONCEPT_LABELS[concept]} entries.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-block bg-black px-5 py-3 text-xs font-bold text-white"
            >
              BACK TO DASHBOARD
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
