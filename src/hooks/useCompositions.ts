// src/hooks/useCompositions.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetch } from '@/utils/api-client';
import { useSpace } from '@/app/components/providers/SpaceProvider';

type Composition = {
  id: string;
  pattern: string[] | string;
  sens?: string;
  description?: string;
  statut?: string;
  createdAt?: string;
};

export function useCompositions() {
  const { current } = useSpace();
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!current?.id) return; // attendre l’espace
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compositions?spaceId=${current.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCompositions(Array.isArray(data) ? data : data.compositions || []);
    } catch (e: any) {
      console.error('📚 Error fetching compositions:', e);
      setError(e?.message || 'Erreur réseau');
      setCompositions([]);
    } finally {
      setLoading(false);
    }
  }, [current?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { compositions, loading, error, reload: load };
}
