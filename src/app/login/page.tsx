'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

export default function LoginPage() {
  const { configured, signInWithEmail, user } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] px-6 py-16">
      <div className="mx-auto max-w-md">
        <Link href="/dashboard" className="text-xs underline">
          ← DASHBOARD
        </Link>

        <h1 className="ledger-display mt-8 text-4xl">Sign in</h1>

        {!configured && (
          <div className="card mt-6 p-5 text-sm text-[#68665f]">
            Supabase isn&apos;t configured yet, so Ledger is running in demo
            mode. Progress is saved to this browser only and won&apos;t
            survive across devices or weeks. Set{' '}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
            enable real accounts.
          </div>
        )}

        {user && (
          <div className="card mt-6 p-5 text-sm">
            You&apos;re signed in as <strong>{user.email}</strong>.
          </div>
        )}

        {configured && !user && (
          <div className="mt-8">
            {sent ? (
              <p className="text-sm text-[#68665f]">
                Check <strong>{email}</strong> for a sign-in link.
              </p>
            ) : (
              <>
                <label className="text-[10px] tracking-[.15em] text-[#85827a]">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none"
                />
                {error && (
                  <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
                )}
                <button
                  onClick={submit}
                  disabled={!email || loading}
                  className="mt-4 bg-black px-6 py-3 text-xs font-bold text-white disabled:opacity-40"
                >
                  {loading ? 'SENDING…' : 'SEND MAGIC LINK →'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
