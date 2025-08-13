'use client';
import React, { useMemo } from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  isOpen: boolean;
  existing: {
    id: string;
    pattern: string[]; // tableau d'IDs
    sens?: string | null;
    description?: string | null;
    statut?: 'PROPOSITION' | 'EN_COURS' | 'ADOPTE' | 'REFUSE' | 'DESUET' | null;
    examples?: string[] | null; // déjà parsé
  };
  concepts: Concept[]; // pour afficher les libellés des IDs
  onClose: () => void;
  onEdit?: (existing: Props['existing']) => void;
  onUseExisting?: (id: string) => void; // si tu veux “utiliser tel quel”
};

export default function DuplicateModal({
  isOpen,
  existing,
  concepts,
  onClose,
  onEdit,
  onUseExisting,
}: Props) {
  if (!isOpen) return null;

  const byId = useMemo(() => {
    const m = new Map<string, Concept>();
    concepts.forEach((c) => m.set(c.id, c));
    return m;
  }, [concepts]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="p-5 sm:p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Cette composition existe déjà
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Le pattern que vous essayez de créer correspond à un enregistrement existant.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Pattern (ordre exact)</div>
            <div className="flex flex-wrap gap-2">
              {existing.pattern.map((id, i) => {
                const c = byId.get(id);
                return (
                  <span
                    key={`${id}-${i}`}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm"
                    title={c ? `${c.mot} (${id})` : id}
                  >
                    {c ? c.mot : id}
                  </span>
                );
              })}
            </div>
          </div>

          {existing.sens && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Sens</div>
              <div className="rounded-lg border bg-gray-50 px-3 py-2">{existing.sens}</div>
            </div>
          )}

          {existing.description && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Description</div>
              <div className="rounded-lg border bg-gray-50 px-3 py-2 whitespace-pre-wrap">
                {existing.description}
              </div>
            </div>
          )}

          {!!(existing.examples && existing.examples.length) && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Exemples</div>
              <ul className="list-disc list-inside text-sm text-gray-800">
                {existing.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 sm:p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
            Fermer
          </button>
          {onUseExisting && (
            <button
              onClick={() => onUseExisting(existing.id)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              Utiliser tel quel
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(existing)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Voir / Éditer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
