'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  concepts: Concept[]; // inchangé (non utilisé ici mais conservé)
  // ⬇️ on ne "toggle" plus : on reçoit le pattern déjà construit par la page
  selectedConcepts: Concept[];

  // nouveau: actions pour gérer ordre & suppressions
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onRemoveAt: (index: number) => void;

  compositionChips: string;

  manualSens: string;
  setManualSens: (v: string) => void;
  manualDescription: string;
  setManualDescription: (v: string) => void;
  manualExamples: string[];
  setManualExamples: (v: string[]) => void;

  onCreateManual: () => void;
  onReset: () => void;

  disabled: boolean;
  canCreate: boolean;
};

export default function ManualComposer({
  selectedConcepts,
  onMoveLeft,
  onMoveRight,
  onRemoveAt,
  compositionChips,
  manualSens,
  setManualSens,
  manualDescription,
  setManualDescription,
  manualExamples,
  setManualExamples,
  onCreateManual,
  onReset,
  disabled,
  canCreate,
}: Props) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-indigo-700 mb-3">
        Composition manuelle
      </h3>

      {/* Bandeau "composition en cours" (conserve ton style) */}
      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="text-sm text-gray-700 mb-2">Composition en cours :</div>
        <div className="text-gray-900 font-medium">
          {compositionChips || (
            <span className="text-gray-400">Cliquez sur des concepts pour commencer</span>
          )}
        </div>

        {/* Chips réordonnables, style sobre qui s'intègre à ta charte */}
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedConcepts.map((c, i) => (
            <div
              key={`${c.id}-${i}`}
              className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm"
              title={`Position ${i + 1}`}
            >
              <span className="text-sm">{c.mot}</span>
              <button
                className="px-1.5 py-0.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                onClick={() => onMoveLeft(i)}
                disabled={i === 0}
                aria-label="Déplacer à gauche"
              >
                ◀
              </button>
              <button
                className="px-1.5 py-0.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                onClick={() => onMoveRight(i)}
                disabled={i === selectedConcepts.length - 1}
                aria-label="Déplacer à droite"
              >
                ▶
              </button>
              <button
                className="px-1.5 py-0.5 text-xs border rounded text-red-600 hover:bg-red-50"
                onClick={() => onRemoveAt(i)}
                aria-label="Retirer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tes champs "Sens / Exemples / Description" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Sens</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={manualSens}
            onChange={(e) => setManualSens(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Exemples (1 par ligne)</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={manualExamples.join('\n')}
            rows={3}
            onChange={(e) =>
              setManualExamples(
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
            value={manualDescription}
            rows={3}
            onChange={(e) => setManualDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onCreateManual}
          disabled={disabled || !canCreate || selectedConcepts.length < 2}
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
