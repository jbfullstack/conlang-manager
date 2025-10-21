'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetch as signedFetch } from '@/utils/api-client';

type UserRole = 'USER' | 'PREMIUM' | 'MODERATOR' | 'ADMIN';

// --- Les profils visibles dans le switcher (aucun ID ici) ---
const DEV_USERNAMES = ['alice', 'bob', 'charlie', 'dave', 'admin'] as const;
type DevName = (typeof DEV_USERNAMES)[number];

// Pastille "utilisateur" (cosmétique, propre à chaque nom)
const USER_CHIPS: Record<DevName, { icon: string; cls: string; label: string }> = {
  alice: { icon: '🧪', cls: 'bg-sky-100 text-sky-800', label: 'alice' },
  bob: { icon: '🧑‍💻', cls: 'bg-indigo-100 text-indigo-800', label: 'bob' },
  charlie: { icon: '🧑‍🏫', cls: 'bg-emerald-100 text-emerald-800', label: 'charlie' },
  dave: { icon: '🧑‍🚀', cls: 'bg-amber-100 text-amber-800', label: 'dave' },
  admin: { icon: '🛠️', cls: 'bg-rose-100 text-rose-800', label: 'admin' },
};

// Pastille "rôle" (icône + couleurs par rôle)
const ROLE_BADGE: Record<UserRole, { icon: string; cls: string }> = {
  ADMIN: { icon: '👑', cls: 'bg-red-100 text-red-800' },
  MODERATOR: { icon: '👮', cls: 'bg-green-100 text-green-800' },
  PREMIUM: { icon: '💎', cls: 'bg-purple-100 text-purple-800' },
  USER: { icon: '👤', cls: 'bg-gray-100 text-gray-800' },
};

type ResolvedUser = { id: string; username: string; role: UserRole };

// Helper visuel
const shorten = (id?: string, n = 6) => (id ? `${id.slice(0, n)}…${id.slice(-n)}` : '—');

export default function DevHeaderSwitcher() {
  // username choisi (persisté)
  const [username, setUsername] = useState<DevName>('alice');
  // user résolu depuis la DB
  const [resolved, setResolved] = useState<ResolvedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Charger les valeurs persistées au boot
  useEffect(() => {
    const u = (localStorage.getItem('dev.username') as DevName) || 'alice';
    setUsername(DEV_USERNAMES.includes(u) ? u : 'alice');
  }, []);

  // Résolution de l’ID/role depuis la DB à chaque changement de username
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const resp = await signedFetch(
          `/api/dev/resolve-user?username=${encodeURIComponent(username)}`,
        );
        if (!resp.ok) {
          const t = await resp.text().catch(() => '');
          throw new Error(`resolve-user ${resp.status} ${t}`);
        }
        const data = (await resp.json()) as ResolvedUser;
        if (cancelled) return;

        setResolved(data);
        // Expose pour useDevAuth / hooks
        localStorage.setItem('dev.username', data.username);
        localStorage.setItem('dev.userId', data.id);
        localStorage.setItem('dev.role', data.role);
        document.cookie = `x-dev-username=${encodeURIComponent(
          data.username,
        )}; Path=/; SameSite=Lax`;
        // (optionnel) si tu veux aussi un id
        if (data.id) {
          document.cookie = `x-dev-user-id=${encodeURIComponent(data.id)}; Path=/; SameSite=Lax`;
        }
        // window.location.reload();
      } catch (e: any) {
        if (!cancelled) {
          setResolved(null);
          setErr(e?.message ?? 'resolve failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // const userChip = useMemo(() => USER_CHIPS[username], [username]);
  const userChip = USER_CHIPS[username as keyof typeof USER_CHIPS] ?? {
    cls: '',
    icon: '🙂',
    label: username || 'guest',
  };

  const roleChip = useMemo(
    () => (resolved ? ROLE_BADGE[resolved.role] : ROLE_BADGE.USER),
    [resolved],
  );

  return (
    <div className="flex items-center gap-2">
      {/* Pastille "DEV" */}
      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800">
        DEV
      </span>

      {/* Chip utilisateur (visuel constant, dépend du username choisi) */}
      <span
        className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${userChip.cls}`}
        title={`username: ${userChip.label}`}
      >
        <span>{userChip.icon}</span>
        <span className="font-medium">{userChip.label}</span>
      </span>

      {/* Selecteur username */}
      <select
        className="text-sm border rounded px-2 py-1 bg-white"
        value={username}
        onChange={(e) => setUsername(e.target.value as DevName)}
        aria-label="Sélection utilisateur de dev"
      >
        {DEV_USERNAMES.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>

      {/* Pastille rôle (résolu DB) */}
      {resolved && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${roleChip.cls}`}
          title={`role: ${resolved.role}`}
        >
          <span>{roleChip.icon}</span>
          <span className="font-medium">{resolved.role}</span>
        </span>
      )}

      {/* ID court + état */}
      <span className="hidden md:inline text-xs text-gray-500" title={resolved?.id || undefined}>
        {loading ? '…' : shorten(resolved?.id)}
      </span>

      {/* Bouton reset (vide le localStorage dev + reload) */}
      <button
        className="ml-1 text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2"
        onClick={() => {
          localStorage.removeItem('dev.userId');
          localStorage.removeItem('dev.username');
          localStorage.removeItem('dev.role');
          location.reload();
        }}
        title="Réinitialiser le state dev"
      >
        reset
      </button>

      {/* Erreur (si username non trouvé) */}
      {err && (
        <span className="text-xs text-red-600" title={err}>
          ⚠︎
        </span>
      )}
    </div>
  );
}
