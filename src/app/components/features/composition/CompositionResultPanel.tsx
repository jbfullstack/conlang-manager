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
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 animate-fadeIn">
      {/* Header avec source et confidence */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getSourceIcon(source)}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">🎯 Résultat IA</h3>
            <div className="text-sm text-gray-500">Source: {source} • Analysé par IA</div>
          </div>
        </div>

        {/* Badge de confidence */}
        <div
          className={`px-4 py-2 rounded-full border text-sm font-semibold ${getConfidenceColor(
            confidence,
            source,
          )}`}
        >
          <div className="flex items-center space-x-2">
            <span>{confidence ? Math.round(confidence * 100) + '%' : 'N/A'}</span>
            <span>•</span>
            <span>{getConfidenceText(confidence)}</span>
          </div>
        </div>
      </div>

      {/* Sens principal */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <span className="text-2xl mt-1">💡</span>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Sens proposé :</h4>
            <div className="text-lg text-blue-900 font-medium">{sens}</div>
          </div>
        </div>
      </div>

      {/* Justification */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-start space-x-3">
          <span className="text-xl mt-1">📝</span>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Justification :</h4>
            <div className="text-gray-700 italic leading-relaxed">{justification}</div>
          </div>
        </div>
      </div>

      {/* Exemples */}
      {examples?.length ? (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-xl mt-1">📚</span>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Exemples d'usage :</h4>
              <ul className="space-y-1">
                {examples.map((example, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-green-800">{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pattern Words */}
      {patternWords?.length ? (
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start space-x-3">
            <span className="text-xl mt-1">🔗</span>
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">Primitives concernées :</h4>
              <div className="flex flex-wrap gap-2">
                {patternWords.map((word, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium"
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
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Niveau de confiance</span>
          <span>{confidence ? Math.round(confidence * 100) + '%' : '0%'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${
              confidence >= 0.8
                ? 'bg-green-500'
                : confidence >= 0.6
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${(confidence || 0) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {onSave && (
          <button
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            onClick={onSave}
          >
            <span>💾</span>
            <span>Sauvegarder</span>
          </button>
        )}
        {onClose && (
          <button
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center space-x-2"
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
