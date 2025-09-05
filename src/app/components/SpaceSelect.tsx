'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetch as signedFetch } from '@/utils/api-client';

type Space = {
  id: string;
  slug: string;
  name: string;
  role: 'MEMBER' | 'MODERATOR' | 'MADROLE' | 'OWNER';
};

export default function SpaceSelect({ currentSlug }: { currentSlug?: string }) {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await signedFetch('/api/spaces?mine=1'); // ✅ bonne route
        const raw = await r.json();
        const rows = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
        const mapped = rows.map((row: any) => {
          // tolère plusieurs shapes: {id,slug,name,role} OU {space:{...}, role}
          const s = row.space || row;
          return {
            id: s.id,
            slug: s.slug,
            name: s.name ?? s.slug ?? 'unnamed',
            role: row.role ?? s.role ?? 'MEMBER',
          };
        });
        setSpaces(mapped);
      } catch {
        if (mounted) setSpaces([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const cookieSlug = useMemo(() => {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(/(?:^|;\s*)x-space-id=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  }, []);

  const value = useMemo(() => {
    const slug = currentSlug || cookieSlug;
    if (!slug) return '';
    const found = spaces.find((s) => s.slug === slug) || spaces.find((s) => s.id === slug);
    return found?.slug ?? '';
  }, [currentSlug, cookieSlug, spaces]);

  function selectSpace(nextSlug: string) {
    if (!nextSlug) return;
    const s = spaces.find((x) => x.slug === nextSlug);
    if (!s) return;

    // Écrire l’ID (pas le slug)
    document.cookie = `x-space-id=${encodeURIComponent(s.id)}; Path=/; SameSite=Lax`;

    // Compat LS (deux clés utilisées par ton code)
    localStorage.setItem('space.currentId', s.id);
    localStorage.setItem('current.spaceId', s.id);

    // L’URL reste lisible au slug
    router.push(`/spaces/${s.slug}`);
  }

  if (loading)
    return (
      <div className="inline-flex items-center rounded-xl border px-3 py-2 text-sm opacity-70">
        Chargement des espaces…
      </div>
    );
  if (!spaces.length)
    return (
      <select
        className="w-full min-w-[200px] rounded-xl border bg-white/50 px-3 py-2 text-sm"
        disabled
      >
        <option>Aucun espace disponible</option>
      </select>
    );

  return (
    <select
      className="w-full min-w-[200px] rounded-xl border bg-white/70 px-3 py-2 text-sm hover:bg-white focus:outline-none"
      value={value}
      onChange={(e) => selectSpace(e.target.value)}
    >
      <option value="" disabled>
        — Sélectionner un espace —
      </option>
      {spaces.map((s) => (
        <option key={s.id} value={s.slug}>
          {s.name}
          {s.role === 'MADROLE' ? ' ✨' : ''}
        </option>
      ))}
    </select>
  );
}
