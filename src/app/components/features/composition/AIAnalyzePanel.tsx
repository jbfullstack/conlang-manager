'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  selectedConcepts?: Concept[];
  compositionChips?: string;
  onAnalyzeFromSelection?: () => void;
  loading?: boolean;
};

export default function AIAnalyzePanel({
  selectedConcepts = [],
  compositionChips = '',
  onAnalyzeFromSelection,
  loading = false,
}: Props) {
  const hasSelection = selectedConcepts.length > 0;
  const canAnalyze = hasSelection && !loading;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
          <span>🔬</span>
          <span>Analyse de Composition par IA</span>
        </h2>
      </div>

      {/* Zone d'affichage de la composition */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
          <span className="mr-2">⚗️</span>
          Composition à analyser :
        </h3>

        {!hasSelection ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">🧠</div>
            <p className="text-lg">Sélectionnez des concepts</p>
            <p className="text-sm">pour créer une composition à analyser</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Affichage des concepts sélectionnés */}
            <div className="flex items-center space-x-2 flex-wrap">
              {selectedConcepts.map((concept, i) => (
                <React.Fragment key={concept.id}>
                  <div className="inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm">
                    <span className="font-medium">{concept.mot}</span>
                    <span className="text-xs opacity-75">({concept.definition})</span>
                  </div>
                  {i < selectedConcepts.length - 1 && (
                    <span className="text-blue-500 text-xl">➕</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Pattern résultant */}
            <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
              <div className="text-sm font-medium text-purple-700 mb-1">Pattern formé :</div>
              <div className="text-lg font-mono text-purple-900">{compositionChips}</div>
            </div>

            {/* Avertissement si trop de concepts */}
            {selectedConcepts.length >= 4 && (
              <div className="mt-2 text-sm text-orange-600 flex items-center bg-orange-50 p-2 rounded">
                <span className="mr-2">⚠️</span>
                Plus de 3 concepts diminue la précision de l'analyse
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bouton d'analyse */}
      <div className="space-y-4">
        <button
          onClick={onAnalyzeFromSelection}
          disabled={!canAnalyze}
          className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : canAnalyze
              ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg transform hover:scale-105'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Analyser la Composition</span>
            </>
          )}
        </button>

        {/* Message d'aide */}
        <div className="text-sm text-gray-600 text-center">
          {!hasSelection &&
            'Cliquez sur des concepts dans la liste pour les ajouter à votre composition'}
          {hasSelection && !loading && "Prêt pour l'analyse IA !"}
        </div>
      </div>

      {/* Informations contextuelles */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Comment ça fonctionne :
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• L'IA analyse la combinaison de vos concepts sélectionnés</li>
          <li>• Elle propose un sens et une justification</li>
          <li>• Vous pouvez sauvegarder les résultats intéressants</li>
          <li>• Optimal avec 2-3 concepts pour plus de précision</li>
        </ul>
      </div>
    </div>
  );
}
