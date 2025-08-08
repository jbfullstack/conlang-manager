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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROPOSITION':
        return '📝';
      case 'EN_COURS':
        return '⏳';
      case 'ADOPTE':
        return '✅';
      default:
        return '📄';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg mx-auto transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <span>💾</span>
              <span>Sauvegarder la Composition</span>
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl sm:text-3xl transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Concepts sélectionnés */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200">
            <label className="block text-sm font-medium text-blue-900 mb-2 sm:mb-3 flex items-center">
              <span className="mr-2">🧩</span>
              Concepts sélectionnés ({selectedConcepts.length}) :
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedConcepts.length === 0 ? (
                <span className="text-sm text-gray-500 italic">Aucun concept sélectionné</span>
              ) : (
                selectedConcepts.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-medium shadow-sm"
                  >
                    {c.mot}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Résultat IA (si disponible) */}
          {compositionResult && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-green-900 flex items-center">
                  <span className="mr-2">🧠</span>
                  Résultat IA
                </div>
                {compositionResult.confidence && (
                  <div
                    className={`text-xs sm:text-sm font-semibold ${getConfidenceColor(
                      compositionResult.confidence,
                    )}`}
                  >
                    {Math.round(compositionResult.confidence * 100)}% confiance
                  </div>
                )}
              </div>
              <div className="bg-white p-2 sm:p-3 rounded border text-sm text-gray-700">
                <div className="font-medium text-green-800 mb-1">"{compositionResult.sens}"</div>
                {compositionResult.justification && (
                  <div className="text-xs text-gray-600 italic">
                    {compositionResult.justification}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formulaire */}
          <div className="space-y-4">
            {/* Sens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                Sens de la composition
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                value={saveFormData.sens}
                onChange={(e) => setSaveFormData((p) => ({ ...p, sens: e.target.value }))}
                placeholder="Définissez le sens de cette composition..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">📝</span>
                Description détaillée
              </label>
              <textarea
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base resize-none"
                rows={3}
                value={saveFormData.description}
                onChange={(e) => setSaveFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ajoutez des détails, contexte d'utilisation..."
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="mr-2">🏷️</span>
                Statut de la composition
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base appearance-none bg-white"
                  value={saveFormData.statut}
                  onChange={(e) =>
                    setSaveFormData((p) => ({ ...p, statut: e.target.value as any }))
                  }
                >
                  <option value="PROPOSITION">{getStatusIcon('PROPOSITION')} Proposition</option>
                  <option value="EN_COURS">
                    {getStatusIcon('EN_COURS')} En cours de validation
                  </option>
                  <option value="ADOPTE">{getStatusIcon('ADOPTE')} Adopté/Validé</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">↓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info utilisateur */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600 text-lg">💡</span>
              <div className="text-xs sm:text-sm text-yellow-800">
                <div className="font-medium mb-1">Conseil :</div>
                <p>
                  Soyez précis dans la définition du sens pour aider la communauté à comprendre et
                  utiliser votre composition correctement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-b-xl sm:rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-gray-800 border-2 border-gray-300 rounded-lg sm:rounded-xl font-medium hover:bg-gray-100 transition-all text-sm sm:text-base"
              onClick={onClose}
            >
              <span className="mr-2">✕</span>
              Annuler
            </button>
            <button
              className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base flex items-center justify-center space-x-2 ${
                saveFormData.sens.trim()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={onSave}
              disabled={!saveFormData.sens.trim()}
            >
              <span>💾</span>
              <span>Sauvegarder</span>
            </button>
          </div>

          {!saveFormData.sens.trim() && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Le sens est obligatoire pour sauvegarder
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
