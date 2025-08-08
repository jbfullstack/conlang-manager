'use client';
import React from 'react';
type Result = {
  sens: string;
  confidence: number;
  justification: string;
  source: string;
  examples?: string[];
  patternWords?: string[];
};

type Props = {
  compositionResult: Result;
  onClose?: () => void;
  onSave?: () => void;
};

export default function CompositionResultPanel({ compositionResult, onClose, onSave }: Props) {
  const { sens, confidence, justification, examples, patternWords, source } = compositionResult;

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span>Résultat IA</span>
        </div>
        <span className="text-sm font-semibold">
          {confidence ? Math.round(confidence * 100) + '%' : ''}
        </span>
      </div>

      <div className="mb-2">
        <strong>Sens proposé:</strong> {sens}
      </div>
      <div className="text-sm text-gray-700 italic">{justification}</div>

      {examples?.length ? (
        <div className="mt-2">
          <strong>Exemples :</strong>
          <ul className="list-disc pl-5">
            {examples.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {patternWords?.length ? (
        <div className="mt-2">
          <strong>Primitives concernées:</strong> {patternWords.join(' • ')}
        </div>
      ) : null}

      <div className="mt-2 flex gap-3">
        {onSave && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onSave}>
            Sauvegarder
          </button>
        )}
        {onClose && (
          <button className="px-4 py-2 border rounded" onClick={onClose}>
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}
