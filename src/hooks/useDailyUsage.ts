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
    if (!id) throw new Error('incrementComposition called without userId');

    await mutate(async (current: Usage | undefined) => {
      const resp = await fetch(`/api/user/usage?userId=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment: 'compositions' }),
      });
      if (!resp.ok) throw new Error('increment failed');

      const next: Usage = { ...(current ?? { compositionsCreated: 0 }) };
      next.compositionsCreated = (next.compositionsCreated ?? 0) + 1;
      return next;
    }, { revalidate: true });
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
