// components/features/composition/CompositionResultPanel.tsx - Version corrigée
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
  // Nouvelles props ajoutées
  disabled?: boolean;
  disabledMessage?: string;
};

export default function CompositionResultPanel({
  compositionResult,
  onClose,
  onSave,
  disabled = false,
  disabledMessage = 'Action non disponible',
}: Props) {
  const { sens, confidence, justification, examples, patternWords, source } = compositionResult;

  // Fonction pour obtenir l'icône selon la source
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'cache':
        return '💾';
      case 'algorithmic':
        return '⚙️';
      case 'llm':
        return '🧠';
      case 'error':
        return '⚠️';
      default:
        return '❓';
    }
  };

  // Fonction pour obtenir la couleur selon la confidence
  const getConfidenceColor = (confidence: number, source?: string) => {
    if (source === 'error') return 'text-red-600 bg-red-50 border-red-200';
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Très fiable';
    if (confidence >= 0.6) return 'Fiable';
    if (confidence >= 0.4) return 'Modéré';
    return 'Peu fiable';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6 border-l-4 border-l-blue-500 animate-fadeIn">
      {/* Message d'avertissement si désactivé */}
      {disabled && (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
          <div className="flex items-center text-orange-800 text-xs sm:text-sm">
            <span className="mr-2 text-base">⚠️</span>
            <span>{disabledMessage}</span>
          </div>
        </div>
      )}

      {/* Header avec source et confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <span className="text-2xl sm:text-3xl">{getSourceIcon(source)}</span>
          <div>
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <span className="mr-2">🎯</span>
              Résultat IA
            </h3>
            <div className="text-xs sm:text-sm text-gray-500">
              Source: {source} • Analysé par IA
            </div>
          </div>
        </div>

        {/* Badge de confidence */}
        <div
          className={`px-3 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold ${getConfidenceColor(
            confidence,
            source,
          )} shadow-sm`}
        >
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span>{confidence ? Math.round(confidence * 100) + '%' : 'N/A'}</span>
            <span>•</span>
            <span>{getConfidenceText(confidence)}</span>
          </div>
        </div>
      </div>

      {/* Sens principal */}
      <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-blue-200">
        <div className="flex items-start space-x-3">
          <span className="text-xl sm:text-2xl mt-1 flex-shrink-0">💡</span>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              Sens proposé :
            </h4>
            <div className="text-base sm:text-lg text-blue-900 font-medium leading-relaxed break-words">
              {sens}
            </div>
          </div>
        </div>
      </div>

      {/* Justification */}
      <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gray-50/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200">
        <div className="flex items-start space-x-3">
          <span className="text-lg sm:text-xl mt-1 flex-shrink-0">📝</span>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              Justification :
            </h4>
            <div className="text-gray-700 italic leading-relaxed text-sm sm:text-base break-words">
              {justification}
            </div>
          </div>
        </div>
      </div>

      {/* Exemples */}
      {examples?.length ? (
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-lg sm:text-xl mt-1 flex-shrink-0">📚</span>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-green-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Exemples d'usage :
              </h4>
              <ul className="space-y-1 sm:space-y-2">
                {examples.map((example, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1 flex-shrink-0">•</span>
                    <span className="text-green-800 text-sm sm:text-base break-words">
                      {example}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pattern Words */}
      {patternWords?.length ? (
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg sm:rounded-xl border border-purple-200">
          <div className="flex items-start space-x-3">
            <span className="text-lg sm:text-xl mt-1 flex-shrink-0">🔗</span>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-purple-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Primitives concernées :
              </h4>
              <div className="flex flex-wrap gap-2">
                {patternWords.map((word, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-xs sm:text-sm font-medium border border-purple-200"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Barre de progression de la confidence */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
          <span>Niveau de confiance</span>
          <span className="font-medium">
            {confidence ? Math.round(confidence * 100) + '%' : '0%'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              confidence >= 0.8
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : confidence >= 0.6
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                : 'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ width: `${(confidence || 0) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        {onSave && (
          <div className="flex-1 relative">
            <button
              className={`w-full px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl font-medium flex items-center justify-center space-x-2 transition-all transform text-sm sm:text-base ${
                disabled
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-105'
              }`}
              onClick={disabled ? undefined : onSave}
              disabled={disabled}
            >
              <span>💾</span>
              <span>Sauvegarder</span>
            </button>

            {/* Tooltip pour bouton désactivé */}
            {disabled && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {disabledMessage}
              </div>
            )}
          </div>
        )}
        {onClose && (
          <button
            className="px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            onClick={onClose}
          >
            <span>✕</span>
            <span>Fermer</span>
          </button>
        )}
      </div>

      {/* Style pour l'animation fadeIn */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
