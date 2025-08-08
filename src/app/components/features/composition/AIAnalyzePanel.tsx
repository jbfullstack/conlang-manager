'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  // Compatibilité ancienne (input non utilisé dans ce flux)
  input?: string;
  onInputChange?: (v: string) => void;
  onAnalyze?: (composition: string) => void;
  loading?: boolean;
  // Nouveau flux: analyses déclenchées par la sélection de concepts
  selectedConcepts?: Concept[];
  onAnalyzeFromSelection?: (composition: string) => void;
};

export default function AIAnalyzePanel({
  input,
  onInputChange,
  onAnalyze,
  loading,
  selectedConcepts,
  onAnalyzeFromSelection,
}: Props) {
  // Composition construite à partir de la sélection, si dispo
  const compositionFromSelection = useMemo(
    () => (selectedConcepts ?? []).map((c) => c.mot).join(' + '),
    [selectedConcepts],
  );

  // Déclenchement automatique si une API est fournie
  const [hasTriggered, setHasTriggered] = useState(false);
  useEffect(() => {
    if (
      onAnalyzeFromSelection &&
      selectedConcepts &&
      selectedConcepts.length > 0 &&
      !hasTriggered
    ) {
      onAnalyzeFromSelection(compositionFromSelection);
      setHasTriggered(true);
    }
  }, [selectedConcepts, compositionFromSelection, onAnalyzeFromSelection, hasTriggered]);

  // UI: instructionnelle, sans input
  return (
    <div className="border rounded p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <strong>IA Analyse</strong>
        <span className="text-xs text-gray-500">
          Cliquez sur les concepts pour construire la composition à analyser
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="text-sm text-gray-600">
          Composition créée par sélection: {compositionFromSelection || '(aucune)'}
        </div>
        {loading && <div className="text-sm text-gray-500">Analyse en cours...</div>}
      </div>
    </div>
  );
}
