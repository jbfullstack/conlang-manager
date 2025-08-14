import useSWR from 'swr';
import { useAuth } from '@/hooks/useDevAuth';
import { fetch as signedFetch } from '@/utils/api-client';

export type Usage = {
  compositionsCreated: number;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useDailyUsage(userId?: string) {
  const { user } = useAuth();                    
  const effectiveId = userId ?? user?.id;        
  const key = effectiveId ? `/api/user/usage?userId=${effectiveId}` : null;

  const { data, mutate, isLoading, error } = useSWR<Usage>(key, fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  const incrementComposition = async (uid?: string) => {
    const id = uid ?? effectiveId;             
    if (!id) { console.warn('incrementComposition: called without userId — noop'); return; }
    await mutate(async () => {
      const resp = await signedFetch(`/api/user/usage?userId=${id}`,'POST',{ increment: 'compositions' });
      return await resp.json();
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
