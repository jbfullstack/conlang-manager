'use client';
import React, { useState, KeyboardEvent } from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  concepts: Concept[];
  selectedConcepts: Concept[];
  onToggleConcept: (c: Concept) => void;
  compositionChips: string;
  manualDescription: string;
  setManualDescription: (v: string) => void;
  manualExamples: string[]; // Changé de string à string[]
  setManualExamples: (v: string[]) => void; // Changé de string à string[]
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
  const [currentExample, setCurrentExample] = useState('');

  // Ajouter un exemple
  const addExample = () => {
    const trimmedExample = currentExample.trim();
    if (trimmedExample && !manualExamples.includes(trimmedExample)) {
      setManualExamples([...manualExamples, trimmedExample]);
      setCurrentExample('');
    }
  };

  // Supprimer un exemple
  const removeExample = (index: number) => {
    setManualExamples(manualExamples.filter((_, i) => i !== index));
  };

  // Gérer la touche Entrée
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExample();
    }
  };

  return (
    <div className="space-y-4">
      {/* Composition en cours - manuel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center space-x-2">
            <span className="text-xl sm:text-2xl">✋</span>
            <span>Composition Manuelle</span>
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1 rounded-full border border-blue-200">
            <span className="text-xs sm:text-sm text-blue-700 font-medium">
              {selectedConcepts.length} concept{selectedConcepts.length !== 1 ? 's' : ''}{' '}
              sélectionné{selectedConcepts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Concepts sélectionnés */}
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-xl sm:rounded-2xl">
          <h4 className="font-medium text-blue-900 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
            <span className="mr-2 text-lg">🧩</span>
            Composition en cours :
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedConcepts.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500 w-full">
                <div className="text-3xl sm:text-4xl mb-2 animate-pulse">🎯</div>
                <span className="text-xs sm:text-sm">Cliquez sur des concepts pour commencer</span>
              </div>
            ) : (
              selectedConcepts.map((c, i) => (
                <React.Fragment key={'mv-' + c.id}>
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-medium shadow-sm">
                    {c.mot}
                    <span className="ml-1 text-xs opacity-75 hidden sm:inline">
                      ({c.definition?.substring(0, 15)}...)
                    </span>
                  </span>
                  {i < selectedConcepts.length - 1 && (
                    <span className="text-blue-500 text-lg sm:text-xl self-center animate-pulse">
                      ➕
                    </span>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
          <div className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-lg border text-center">
            <span className="text-xs sm:text-sm text-purple-700 font-medium">Pattern: </span>
            <span className="font-mono text-purple-900 text-xs sm:text-sm font-semibold">
              {compositionChips || '(aucun)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Description */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 flex items-center">
              <span className="mr-2 text-lg">📝</span>
              Description de la composition
            </label>
            <textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Décrivez le sens et l'usage de cette composition..."
              className="w-full border-2 border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base bg-white/90 backdrop-blur-sm"
              rows={3}
            />
          </div>

          {/* Exemples - Interface améliorée */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 flex items-center">
              <span className="mr-2 text-lg">📚</span>
              Exemples d'usage
              <span className="ml-2 text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-2 py-1 rounded-full border border-green-300">
                {manualExamples.length} exemple{manualExamples.length !== 1 ? 's' : ''}
              </span>
            </label>

            {/* Input pour nouvel exemple */}
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={currentExample}
                onChange={(e) => setCurrentExample(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Saisissez un exemple d'usage..."
                className="flex-1 border-2 border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base bg-white/90"
              />
              <button
                onClick={addExample}
                disabled={!currentExample.trim()}
                className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium flex items-center space-x-1 transition-all transform text-sm sm:text-base ${
                  currentExample.trim()
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>➕</span>
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            </div>

            <div className="text-xs sm:text-sm text-gray-500 mb-3 flex items-center p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <span className="mr-1">💡</span>
              Astuce : Appuyez sur Entrée ou cliquez sur "Ajouter" pour ajouter l'exemple
            </div>

            {/* Liste des exemples */}
            {manualExamples.length > 0 && (
              <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-200">
                <div className="text-sm font-medium text-green-800 flex items-center">
                  <span className="mr-2">📋</span>
                  Exemples ajoutés :
                </div>
                {manualExamples.map((exemple, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg border group hover:shadow-sm transition-all"
                  >
                    <span className="text-xs sm:text-sm text-gray-700 flex-1 break-words">
                      {exemple}
                    </span>
                    <button
                      onClick={() => removeExample(index)}
                      className="text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-base sm:text-lg flex-shrink-0"
                      title="Supprimer cet exemple"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium flex items-center justify-center space-x-2 transition-all transform text-sm sm:text-base ${
              selectedConcepts.length >= 2
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onCreateManual}
            disabled={selectedConcepts.length < 2}
          >
            <span className="text-lg">🚀</span>
            <span className="hidden sm:inline">Créer Composition Manuelle</span>
            <span className="sm:hidden">Créer</span>
          </button>
          <button
            className="px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            onClick={onReset}
          >
            <span className="text-lg">🔄</span>
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* Info */}
        {selectedConcepts.length < 2 && (
          <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg sm:rounded-xl">
            <div className="flex items-center text-yellow-800 text-xs sm:text-sm">
              <span className="mr-2 text-base">⚠️</span>
              <span>Sélectionnez au moins 2 concepts pour créer une composition</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
