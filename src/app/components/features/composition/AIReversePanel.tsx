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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
          <span>🔍</span>
          <span>IA Reverse Recherche</span>
        </h2>
        <div className="text-sm text-gray-500 bg-purple-50 px-3 py-1 rounded-full">
          Français → Composition
        </div>
      </div>

      <div className="space-y-4">
        {/* Zone d'input avec design amélioré */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="mr-2">💭</span>
            Concept ou expression en français à rechercher :
          </label>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder='Exemples: "lever de soleil", "torrent de montagne", "murmure du vent"...'
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            {input && (
              <button
                onClick={() => onInputChange('')}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <span className="text-lg">×</span>
              </button>
            )}
          </div>
        </div>

        {/* Bouton de recherche */}
        <button
          onClick={onSearch}
          disabled={!canSearch}
          className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : canSearch
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg transform hover:scale-105'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Recherche en cours...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Rechercher la Composition</span>
            </>
          )}
        </button>

        {/* Message d'aide */}
        <div className="text-sm text-gray-600 text-center">
          {!input &&
            "Décrivez un concept en français pour que l'IA trouve la composition correspondante"}
          {input && !loading && 'Prêt pour la recherche !'}
        </div>
      </div>

      {/* Exemples et conseils */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Conseils pour de meilleurs résultats :
        </h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Soyez précis dans vos descriptions</li>
          <li>• Utilisez des concepts concrets et imagés</li>
          <li>• Essayez différentes formulations si nécessaire</li>
          <li>• L'IA recherche dans la base de compositions existantes</li>
        </ul>
      </div>

      {/* Exemples rapides */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
          <span className="mr-2">📝</span>
          Exemples populaires :
        </h4>
        <div className="flex flex-wrap gap-2">
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
              className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-colors"
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
