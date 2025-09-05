// src/app/components/ui/SpaceSwitcher.tsx
'use client';

import { useSpace } from '@/app/components/providers/SpaceProvider';

export default function SpaceSwitcher() {
  const { spaces, current, setCurrent, role } = useSpace();

  // Si pas encore de liste (init), on évite de casser la nav.
  if (!spaces) return null;

  // Aucun espace disponible : afficher un CTA léger (charte soft)
  if (spaces.length === 0) {
    return (
      <a
        href="/spaces"
        className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs
                   bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700
                   border border-gray-200 hover:border-blue-300 hover:bg-white/80
                   transition"
        title="Créer ou demander un espace"
      >
        <span>➕</span>
        <span>Créer un espace</span>
      </a>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="text-xs text-gray-500">Espace</label>
      <select
        className="text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
        value={current?.id || ''}
        onChange={(e) => setCurrent(e.target.value)}
      >
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} {s.status !== 'ACTIVE' ? `(${s.status.toLowerCase()})` : ''}
          </option>
        ))}
      </select>

      {role === 'MADROLE' && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white animate-pulse">
          ✨ MAD
        </span>
      )}
    </div>
  );
}
