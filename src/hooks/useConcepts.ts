// src/hooks/useConcepts.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetch } from '@/utils/api-client';
import { useSpace } from '@/app/components/providers/SpaceProvider';

type Concept = {
  id: string;
  mot: string;
  type: string;
  definition?: string;
};

export function useConcepts() {
  const { current } = useSpace();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!current?.id) return; // attendre l’espace
    setLoading(true);
    setError(null);
    try {
      // explicite: on passe le spaceId
      const res = await fetch(`/api/concepts?spaceId=${current.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConcepts(Array.isArray(data) ? data : data.concepts || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur réseau');
      setConcepts([]);
    } finally {
      setLoading(false);
    }
  }, [current?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { concepts, loading, error, reload: load };
}
