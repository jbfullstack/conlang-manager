'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  concepts: Concept[];
  selectedConcepts: Concept[];
  onToggleConcept: (c: Concept) => void;
  compositionChips: string;
  manualDescription: string;
  setManualDescription: (v: string) => void;
  manualExamples: string;
  setManualExamples: (v: string) => void;
  onCreateManual: () => void;
  onReset: () => void;
};

export default function ManualComposer({
  concepts,
  selectedConcepts,
  onToggleConcept,
  compositionChips,
  manualDescription,
  setManualDescription,
  manualExamples,
  setManualExamples,
  onCreateManual,
  onReset,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Composition en cours - manuel */}
      <div className="border rounded p-4 bg-white">
        <h3 className="font-medium mb-2">Composition en cours</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedConcepts.length === 0 ? (
            <span className="text-sm text-gray-500">Aucun concept sélectionné</span>
          ) : (
            selectedConcepts.map((c) => (
              <span
                key={'mv-' + c.id}
                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs"
              >
                {c.mot}
              </span>
            ))
          )}
        </div>

        <div className="mt-2 grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Description de la composition (manuel)
            </label>
            <textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Description de la composition..."
              className="w-full border border-gray-300 rounded-md px-2 py-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Exemples (optionnel, séparés par |)
            </label>
            <input
              type="text"
              value={manualExamples}
              onChange={(e) => setManualExamples(e.target.value)}
              placeholder="ex: exemple1 | exemple2"
              className="w-full border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onCreateManual}>
            Créer Composition Manuelle
          </button>
          <button className="px-4 py-2 border rounded" onClick={onReset}>
            Réinitialiser
          </button>
        </div>

        <div className="mt-2 text-sm text-gray-500">Pattern: {compositionChips}</div>
      </div>

      {/* Concepts disponibles - grille cliquable pour sélectionner */}
      {/* <div className="border rounded p-4 bg-white">
        <h3 className="font-medium mb-2">Concepts disponibles</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {concepts.map((c) => {
            const isSelected = selectedConcepts.some((s) => s.id === c.id);
            return (
              <button
                key={c.id}
                onClick={() => onToggleConcept(c)}
                className={`rounded-md border p-2 text-left ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="font-semibold text-sm">{c.mot}</div>
                <div className="text-xs text-gray-600">{c.definition}</div>
                <div className="text-xs text-gray-600">
                  {c.exemples?.length ? c.exemples.join(', ') : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div> */}
    </div>
  );
}
