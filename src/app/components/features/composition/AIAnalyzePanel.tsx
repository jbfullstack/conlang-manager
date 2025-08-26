'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  selectedConcepts?: Concept[];
  compositionChips?: string;
  onAnalyzeFromSelection?: () => void;
  loading?: boolean;

  // NEW: actions optionnelles pour rendre les chips ordonnables
  onMoveLeft?: (index: number) => void;
  onMoveRight?: (index: number) => void;
  onRemoveAt?: (index: number) => void;
};

export default function AIAnalyzePanel({
  selectedConcepts = [],
  compositionChips = '',
  onAnalyzeFromSelection,
  loading = false,

  // NEW
  onMoveLeft,
  onMoveRight,
  onRemoveAt,
}: Props) {
  const hasSelection = selectedConcepts.length > 0;
  const canAnalyze = hasSelection && !loading;

  // NEW: si les 3 handlers existent, on active le rendu interactif
  const interactive = !!(onMoveLeft && onMoveRight && onRemoveAt);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center space-x-2">
          <span className="text-xl sm:text-2xl">🔬</span>
          <span>Analyse de Composition par IA</span>
        </h2>
      </div>

      {/* Zone d'affichage de la composition */}
      <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border border-blue-200 rounded-xl sm:rounded-2xl">
        <h3 className="font-medium text-blue-900 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
          <span className="mr-2 text-lg">⚗️</span>
          Composition à analyser :
        </h3>

        {!hasSelection ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 animate-pulse">🧠</div>
            <p className="text-base sm:text-lg font-medium mb-2">Sélectionnez des concepts</p>
            <p className="text-xs sm:text-sm text-gray-400">
              pour créer une composition à analyser
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Affichage des concepts sélectionnés */}
            {interactive ? (
              <div className="flex flex-wrap gap-2">
                {selectedConcepts.map((c, i) => (
                  <div
                    key={`${c.id}-${i}`}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-sm border border-indigo-200 bg-gradient-to-r from-white to-indigo-50/70 hover:from-indigo-50 hover:to-white transition-colors"
                    title={`Position ${i + 1}`}
                  >
                    <span className="text-[11px] sm:text-xs font-semibold text-indigo-700">
                      {c.mot}
                    </span>
                    {c.definition && (
                      <span className="hidden sm:inline text-[10px] text-indigo-800/70 ml-0.5">
                        ({c.definition.substring(0, 14)}…)
                      </span>
                    )}

                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        className="h-6 w-6 inline-flex items-center justify-center rounded-full border border-indigo-200/70 bg-white/80 hover:bg-indigo-50 text-indigo-700 text-xs disabled:opacity-40"
                        onClick={() => onMoveLeft?.(i)}
                        disabled={i === 0}
                        aria-label="Déplacer à gauche"
                        title="Déplacer à gauche"
                      >
                        ◀
                      </button>
                      <button
                        className="h-6 w-6 inline-flex items-center justify-center rounded-full border border-indigo-200/70 bg-white/80 hover:bg-indigo-50 text-indigo-700 text-xs disabled:opacity-40"
                        onClick={() => onMoveRight?.(i)}
                        disabled={i === selectedConcepts.length - 1}
                        aria-label="Déplacer à droite"
                        title="Déplacer à droite"
                      >
                        ▶
                      </button>
                      <button
                        className="h-6 w-6 inline-flex items-center justify-center rounded-full border border-rose-200 bg-white/80 hover:bg-rose-50 text-rose-600 text-xs"
                        onClick={() => onRemoveAt?.(i)}
                        aria-label="Retirer"
                        title="Retirer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback : rendu “ancien” (aucune régression)
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                {selectedConcepts.map((concept, i) => (
                  <React.Fragment key={concept.id}>
                    <div className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm">
                      <span className="font-medium">{concept.mot}</span>
                      <span className="text-xs opacity-75 hidden sm:inline">
                        ({concept.definition?.substring(0, 20)}...)
                      </span>
                    </div>
                    {i < selectedConcepts.length - 1 && (
                      <span className="text-blue-500 text-lg sm:text-xl animate-pulse">➕</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Pattern résultant */}
            <div className="p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-purple-200 shadow-sm">
              <div className="text-xs sm:text-sm font-medium text-purple-700 mb-1 flex items-center">
                <span className="mr-1">🔗</span>
                Pattern formé :
              </div>
              <div className="text-base sm:text-lg font-mono text-purple-900 font-semibold">
                {compositionChips}
              </div>
            </div>

            {/* Avertissement si trop de concepts */}
            {selectedConcepts.length >= 4 && (
              <div className="p-2 sm:p-3 text-xs sm:text-sm text-orange-600 flex items-center bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <span className="mr-2 text-base">⚠️</span>
                <span>Plus de 3 concepts diminue la précision de l'analyse</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bouton d'analyse */}
      <div className="space-y-3 sm:space-y-4">
        <button
          onClick={onAnalyzeFromSelection}
          disabled={!canAnalyze}
          className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium flex items-center justify-center space-x-2 transition-all transform text-sm sm:text-base ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : canAnalyze
              ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <span className="text-lg">🚀</span>
              <span>Analyser la Composition</span>
            </>
          )}
        </button>

        {/* Message d'aide */}
        <div className="text-xs sm:text-sm text-gray-600 text-center p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200">
          {!hasSelection &&
            '✨ Cliquez sur des concepts dans la liste pour les ajouter à votre composition'}
          {hasSelection && !loading && "🎯 Prêt pour l'analyse IA !"}
        </div>
      </div>

      {/* Informations contextuelles */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg sm:rounded-xl border border-green-200">
        <h4 className="font-medium text-green-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
          <span className="mr-2">💡</span>
          Comment ça fonctionne :
        </h4>
        <ul className="text-xs sm:text-sm text-green-800 space-y-1">
          <li>• L'IA analyse la combinaison de vos concepts sélectionnés</li>
          <li>• Elle propose un sens et une justification détaillée</li>
          <li>• Vous pouvez sauvegarder les résultats intéressants</li>
          <li>• Optimal avec 2-3 concepts pour plus de précision</li>
        </ul>
      </div>
    </div>
  );
}
