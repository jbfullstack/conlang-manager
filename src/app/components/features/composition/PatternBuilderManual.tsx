'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  // pattern (ordre exact, doublons autorisés)
  selectedPattern: Concept[];

  // actions sur le pattern
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onRemoveAt: (index: number) => void;

  // champs descriptifs
  sens: string;
  setSens: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  examples: string[]; // stockés en array dans le state parent
  setExamples: (v: string[]) => void;

  // actions globales
  onCreate: () => void;
  onReset: () => void;

  // états d’UI
  disabled?: boolean; // ex: limite atteinte
  canCreate?: boolean; // ex: permission
};

export default function PatternBuilderManual({
  selectedPattern,
  onMoveLeft,
  onMoveRight,
  onRemoveAt,
  sens,
  setSens,
  description,
  setDescription,
  examples,
  setExamples,
  onCreate,
  onReset,
  disabled = false,
  canCreate = true,
}: Props) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-2">Pattern (ordre & répétitions)</h3>

      {/* Chips réordonnables */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedPattern.map((c, i) => (
          <div
            key={`${c.id}-${i}`}
            className="flex items-center gap-1 bg-white border rounded-xl px-2 py-1 shadow-sm"
            title={`Position ${i + 1}`}
          >
            <span className="text-sm">{c.mot}</span>
            <div className="flex items-center gap-1 ml-1">
              <button
                className="px-2 py-1 text-xs border rounded"
                onClick={() => onMoveLeft(i)}
                disabled={i === 0}
              >
                ◀
              </button>
              <button
                className="px-2 py-1 text-xs border rounded"
                onClick={() => onMoveRight(i)}
                disabled={i === selectedPattern.length - 1}
              >
                ▶
              </button>
              <button
                className="px-2 py-1 text-xs border rounded text-red-600"
                onClick={() => onRemoveAt(i)}
                aria-label="Supprimer cet élément du pattern"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {selectedPattern.length === 0 && (
          <div className="text-gray-500 text-sm">
            Ajoutez des concepts depuis la colonne de gauche
          </div>
        )}
      </div>

      {/* Champs manuels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Sens</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={sens}
            onChange={(e) => setSens(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Exemples (1 par ligne)</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={examples.join('\n')}
            rows={3}
            onChange={(e) =>
              setExamples(
                e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onCreate}
          disabled={disabled || !canCreate || selectedPattern.length < 2}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Créer la composition
        </button>
        <button onClick={onReset} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
