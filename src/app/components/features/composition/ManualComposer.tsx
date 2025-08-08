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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <span>✋</span>
            <span>Composition Manuelle</span>
          </h3>
          <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
            {selectedConcepts.length} concept{selectedConcepts.length !== 1 ? 's' : ''} sélectionné
            {selectedConcepts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Concepts sélectionnés */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <span className="mr-2">🧩</span>
            Composition en cours :
          </h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedConcepts.length === 0 ? (
              <div className="text-center py-4 text-gray-500 w-full">
                <div className="text-4xl mb-2">🎯</div>
                <span className="text-sm">Cliquez sur des concepts pour commencer</span>
              </div>
            ) : (
              selectedConcepts.map((c, i) => (
                <React.Fragment key={'mv-' + c.id}>
                  <span className="inline-flex items-center px-3 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium shadow-sm">
                    {c.mot}
                    <span className="ml-1 text-xs opacity-75">({c.definition})</span>
                  </span>
                  {i < selectedConcepts.length - 1 && (
                    <span className="text-blue-500 text-xl self-center">➕</span>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
          <div className="mt-3 p-2 bg-white rounded border text-center">
            <span className="text-sm text-purple-700 font-medium">Pattern: </span>
            <span className="font-mono text-purple-900">{compositionChips || '(aucun)'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📝</span>
              Description de la composition
            </label>
            <textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Décrivez le sens et l'usage de cette composition..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={3}
            />
          </div>

          {/* Exemples - Interface améliorée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📚</span>
              Exemples d'usage
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
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
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <button
                onClick={addExample}
                disabled={!currentExample.trim()}
                className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-1 transition-all ${
                  currentExample.trim()
                    ? 'bg-green-500 text-white hover:bg-green-600 transform hover:scale-105'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>➕</span>
                <span>Ajouter</span>
              </button>
            </div>

            <div className="text-xs text-gray-500 mb-3 flex items-center">
              <span className="mr-1">💡</span>
              Astuce : Appuyez sur Entrée ou cliquez sur "Ajouter" pour ajouter l'exemple
            </div>

            {/* Liste des exemples */}
            {manualExamples.length > 0 && (
              <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-800 flex items-center">
                  <span className="mr-2">📋</span>
                  Exemples ajoutés :
                </div>
                {manualExamples.map((exemple, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-2 rounded border group hover:shadow-sm transition-all"
                  >
                    <span className="text-sm text-gray-700 flex-1">{exemple}</span>
                    <button
                      onClick={() => removeExample(index)}
                      className="text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer cet exemple"
                    >
                      <span className="text-lg">×</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center space-x-3">
          <button
            className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
              selectedConcepts.length >= 2
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg transform hover:scale-105'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onCreateManual}
            disabled={selectedConcepts.length < 2}
          >
            <span>🚀</span>
            <span>Créer Composition Manuelle</span>
          </button>
          <button
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center space-x-2"
            onClick={onReset}
          >
            <span>🔄</span>
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* Info */}
        {selectedConcepts.length < 2 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-800 text-sm">
              <span className="mr-2">⚠️</span>
              Sélectionnez au moins 2 concepts pour créer une composition
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
