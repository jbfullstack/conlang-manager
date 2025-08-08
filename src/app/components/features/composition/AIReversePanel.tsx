'use client';
import React from 'react';

type Props = {
  input: string;
  onInputChange: (v: string) => void;
  onSearch: () => void;
  loading?: boolean;
};

export default function AIReversePanel({ input, onInputChange, onSearch, loading = false }: Props) {
  return (
    <div className="border rounded p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <strong>IA Reverse Recherche</strong>
        <span className="text-xs text-gray-500">Concept ou mot à rechercher</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Concept ou mot à rechercher
        </label>
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="ex: lever de soleil"
          className="w-full border border-gray-300 rounded px-2 py-1"
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={onSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            disabled={!input.trim()}
          >
            Rechercher
          </button>
          <button onClick={() => onInputChange('')} className="px-4 py-2 border rounded-md">
            Effacer
          </button>
        </div>
      </div>
    </div>
  );
}
