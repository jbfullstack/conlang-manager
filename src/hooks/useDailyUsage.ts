import useSWR from 'swr';

export type Usage = {
  compositionsCreated: number;
  // ⚠️ PAS de maxPerDay ici : c’est côté limits/FEATURE_FLAGS
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useDailyUsage(userId?: string) {
  const key = userId ? `/api/user/usage?userId=${userId}` : null;

  const { data, mutate, isLoading, error } = useSWR<Usage>(key, fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  const incrementComposition = async (uid?: string) => {
    const id = uid ?? userId;
    if (!id) { console.warn('incrementComposition: called without userId — noop'); return; } // ✅ au lieu de throw
    await mutate(async (current) => {
      const resp = await fetch(`/api/user/usage?userId=${id}`, { method: 'POST', body: JSON.stringify({ increment: 'compositions' }), headers: { 'Content-Type': 'application/json' } });
      const updated = await resp.json();
      return updated;
    }, { revalidate: false });
  };

  return {
    usage: data,
    compositionsCreated: data?.compositionsCreated ?? 0,
    incrementComposition,
    refreshUsage: () => mutate(),
    isLoading,
    error,
    swrKey: key,
  };
}
