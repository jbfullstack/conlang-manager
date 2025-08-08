import { useEffect, useState } from 'react';
import { Concept } from '@/interfaces/concept.interface';

export function useConcepts() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    fetch('/api/concepts')
      .then((r) => r.json())
      .then((data: any) => {
        if (aborted) return;
        const list = data?.concepts ?? data ?? [];
        const mapped = list.map((c: any) => ({
          id: c.id,
          mot: c.mot,
          definition: c.definition ?? '',
          type: c.type,
          proprietes: c.conceptProperties?.map((cp: any) => cp.property?.name) ?? [],
          couleur: '#64748b',
        }));
        setConcepts(mapped as any);
        setLoading(false);
      })
      .catch(() => {
        if (!aborted) {
          setConcepts([]);
          setLoading(false);
        }
      });
    return () => { aborted = true; };
  }, []);

  return { concepts, loading };
}