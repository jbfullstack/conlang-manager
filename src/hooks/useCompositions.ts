import { useEffect, useState } from 'react';

export function useCompositions() {
  const [comps, setComps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    fetch('/api/compositions')
      .then((r) => r.json())
      .then((data) => {
        if (aborted) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.compositions)
            ? data.compositions
            : [];
        setComps(list);
        setLoading(false);
      })
      .catch(() => {
        if (!aborted) {
          setComps([]);
          setLoading(false);
        }
      });
    return () => { aborted = true; };
  }, []);

  return { communityComps: comps, loading };
}