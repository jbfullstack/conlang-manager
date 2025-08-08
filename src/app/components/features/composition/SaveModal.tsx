'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type CompositionResultLike = {
  sens: string;
  confidence?: number;
  justification?: string;
  source?: string;
  examples?: string[];
  pattern?: string[];
  patternWords?: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedConcepts: Concept[];
  compositionResult?: CompositionResultLike | null;
  saveFormData: {
    sens: string;
    description: string;
    statut: 'PROPOSITION' | 'EN_COURS' | 'ADOPTE';
  };
  setSaveFormData: React.Dispatch<
    React.SetStateAction<{
      sens: string;
      description: string;
      statut: 'PROPOSITION' | 'EN_COURS' | 'ADOPTE';
    }>
  >;
};

export default function SaveModal({
  isOpen,
  onClose,
  onSave,
  selectedConcepts,
  compositionResult,
  saveFormData,
  setSaveFormData,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <span>💾</span>
            <span>Sauvegarder la Composition</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Concepts sélectionnés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concepts sélectionnés :
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedConcepts.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
                >
                  {c.mot}
                </span>
              ))}
            </div>
          </div>

          {/* Résultat IA (si disponible) */}
          {compositionResult && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-1">Résultat IA :</div>
              <div className="text-sm text-gray-600">"{compositionResult.sens}"</div>
              <div className="text-xs text-gray-500 mt-1">
                Confidence:{' '}
                {compositionResult.confidence ? Math.round(compositionResult.confidence * 100) : 0}%
              </div>
            </div>
          )}

          {/* Champs du formulaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sens</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={saveFormData.sens}
              onChange={(e) => setSaveFormData((p) => ({ ...p, sens: e.target.value }))}
              placeholder="Définissez le sens de cette composition..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              value={saveFormData.description}
              onChange={(e) => setSaveFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Ajoutez des détails ou contexte..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={saveFormData.statut}
              onChange={(e) => setSaveFormData((p) => ({ ...p, statut: e.target.value as any }))}
            >
              <option value="PROPOSITION">📝 Proposition</option>
              <option value="EN_COURS">⏳ En cours</option>
              <option value="ADOPTE">✅ Adopté</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            onClick={onSave}
          >
            <span>💾</span>
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
