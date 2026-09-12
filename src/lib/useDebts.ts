'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Debt } from './types';
import { loadDebts } from './store';

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await loadDebts();
    setDebts(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { debts, setDebts, loading, refresh };
}
