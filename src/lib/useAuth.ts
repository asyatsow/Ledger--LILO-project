'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const client = getSupabaseClient();

    if (!client) {
      setLoading(false);
      return;
    }

    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard`
            : undefined,
      },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    configured,
    signInWithEmail,
    signOut,
  };
}
