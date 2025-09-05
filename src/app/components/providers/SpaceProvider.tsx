'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signedFetcher } from '@/utils/api-client';

type Space = {
  id: string;
  name: string;
  slug: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED';
};
type Membership = {
  spaceId: string;
  userId: string;
  role: 'OWNER' | 'MODERATOR' | 'MADROLE' | 'MEMBER';
  isActive: boolean;
};

type Ctx = {
  spaces: Space[];
  memberships: Membership[];
  current?: Space;
  role?: Membership['role'];
  setCurrent(spaceId: string): void;
};

const SpaceCtx = createContext<Ctx>({ spaces: [], memberships: [], setCurrent: () => {} });

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const d = await signedFetcher('/api/spaces?mine=1'); // d.spaces, d.memberships
      setSpaces(d.spaces || []);
      setMemberships(d.memberships || []);

      const stored =
        typeof window !== 'undefined' ? localStorage.getItem('space.currentId') || '' : '';

      // 1) si c’est déjà un ID présent
      let id = stored && (d.spaces || []).some((s: Space) => s.id === stored) ? stored : undefined;

      // 2) sinon, tente de l’interpréter comme slug
      if (!id && stored) {
        const bySlug = (d.spaces || []).find((s: Space) => s.slug === stored)?.id;
        if (bySlug) id = bySlug;
      }

      // 3) fallback 1er espace actif
      if (!id) id = (d.spaces || []).find((s: Space) => s.status === 'ACTIVE')?.id;

      if (id) {
        setCurrentId(id);
        if (typeof window !== 'undefined') localStorage.setItem('space.currentId', id);
      }
    })();
  }, []);

  const current = useMemo(() => spaces.find((s) => s.id === currentId), [spaces, currentId]);
  const role = useMemo(
    () => memberships.find((m) => m.spaceId === currentId)?.role,
    [memberships, currentId],
  );

  const setCurrent = (id: string) => {
    setCurrentId(id);
    if (typeof window !== 'undefined') localStorage.setItem('space.currentId', id);
  };

  return (
    <SpaceCtx.Provider value={{ spaces, memberships, current, role, setCurrent }}>
      {children}
    </SpaceCtx.Provider>
  );
}

export const useSpace = () => useContext(SpaceCtx);
