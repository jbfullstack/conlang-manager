'use client';
import React from 'react';

type Props = {
  input: string;
  onInputChange: (v: string) => void;
  onSearch: () => void;
  loading?: boolean;
};

export default function AIReversePanel({
  input = '',
  onInputChange,
  onSearch,
  loading = false,
}: Props) {
  const canSearch = input.trim().length > 0 && !loading;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center space-x-2">
          <span className="text-xl sm:text-2xl">🔍</span>
          <span>IA Reverse Recherche</span>
        </h2>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-1 rounded-full border border-purple-200">
          <span className="text-xs sm:text-sm text-purple-700 font-medium">
            Français → Composition
          </span>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Zone d'input avec design amélioré */}
        <div className="relative">
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 flex items-center">
            <span className="mr-2 text-lg">💭</span>
            Concept ou expression en français à rechercher :
          </label>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder='Exemples: "lever de soleil", "torrent de montagne", "murmure du vent"...'
              className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-300 rounded-lg sm:rounded-xl resize-none h-20 sm:h-24 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base bg-white/90 backdrop-blur-sm"
              disabled={loading}
            />
            {input && (
              <button
                onClick={() => onInputChange('')}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg sm:text-xl bg-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shadow-sm"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Bouton de recherche */}
        <button
          onClick={onSearch}
          disabled={!canSearch}
          className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium flex items-center justify-center space-x-2 transition-all transform text-sm sm:text-base ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : canSearch
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Recherche en cours...</span>
            </>
          ) : (
            <>
              <span className="text-lg">🚀</span>
              <span>Rechercher la Composition</span>
            </>
          )}
        </button>

        {/* Message d'aide */}
        <div className="text-xs sm:text-sm text-gray-600 text-center p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200">
          {!input &&
            "✨ Décrivez un concept en français pour que l'IA trouve la composition correspondante"}
          {input && !loading && '🎯 Prêt pour la recherche !'}
        </div>
      </div>

      {/* Exemples et conseils */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg sm:rounded-xl border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-2 flex items-center text-sm sm:text-base">
          <span className="mr-2">💡</span>
          Conseils pour de meilleurs résultats :
        </h4>
        <ul className="text-xs sm:text-sm text-purple-800 space-y-1">
          <li>• Soyez précis dans vos descriptions</li>
          <li>• Utilisez des concepts concrets et imagés</li>
          <li>• Essayez différentes formulations si nécessaire</li>
          <li>• L'IA recherche dans la base de compositions existantes</li>
        </ul>
      </div>

      {/* Exemples rapides */}
      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200">
        <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
          <span className="mr-2">📝</span>
          Exemples populaires :
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
          {[
            'lever de soleil',
            'torrent de montagne',
            'murmure du vent',
            'éclat de rire',
            'silence profond',
          ].map((exemple) => (
            <button
              key={exemple}
              onClick={() => onInputChange(exemple)}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-white border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all transform hover:scale-105 text-left"
              disabled={loading}
            >
              {exemple}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
