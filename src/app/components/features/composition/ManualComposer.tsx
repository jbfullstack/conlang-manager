'use client';
import React, { useState, KeyboardEvent } from 'react';
import { Concept } from '@/interfaces/concept.interface';

/**
 * ManualComposer – Version alignée sur l’ancien design “joli”
 * - Conserve les fonctionnalités du nouveau composant (cartes/chips ordonnables + remove)
 * - Réintègre l’esthétique de l’ancien (gradients doux, badges, messages, états disabled)
 * - Améliore l’UI des cartes pour mieux matcher le style existant
 */

type Props = {
  concepts: Concept[];
  selectedConcepts: Concept[];
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onRemoveAt: (index: number) => void;

  compositionChips: string;

  manualSens: string;
  setManualSens: (v: string) => void;
  manualDescription: string;
  setManualDescription: (v: string) => void;
  manualExamples: string[];
  setManualExamples: (v: string[]) => void;

  onCreateManual: () => void;
  onReset: () => void;

  disabled?: boolean;
  canCreate?: boolean;
};

export default function ManualComposer({
  concepts, // pas utilisé directement mais gardé pour compat
  selectedConcepts,
  onMoveLeft,
  onMoveRight,
  onRemoveAt,
  compositionChips,
  manualSens,
  setManualSens,
  manualDescription,
  setManualDescription,
  manualExamples,
  setManualExamples,
  onCreateManual,
  onReset,
  disabled = false,
  canCreate = true,
}: Props) {
  const [currentExample, setCurrentExample] = useState('');

  // --- Exemples (UX comme l’ancienne version) ---
  const addExample = () => {
    const trimmed = currentExample.trim();
    if (trimmed && !manualExamples.includes(trimmed)) {
      setManualExamples([...manualExamples, trimmed]);
      setCurrentExample('');
    }
  };

  const removeExample = (index: number) => {
    setManualExamples(manualExamples.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExample();
    }
  };

  const isCreateDisabled = disabled || !canCreate || selectedConcepts.length < 2;

  return (
    <div className="space-y-4">
      {/* Carte principale */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl sm:text-2xl">◩</span>
            <span>Composition Manuelle</span>
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1 rounded-full border border-blue-200">
            <span className="text-xs sm:text-sm text-blue-700 font-medium">
              {selectedConcepts.length} concept{selectedConcepts.length !== 1 ? 's' : ''}{' '}
              sélectionné{selectedConcepts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Message d’avertissement si désactivé */}
        {disabled && (
          <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-800 text-xs sm:text-sm gap-2">
              <span className="text-base">⚠︎</span>
              <span>
                {!canCreate
                  ? 'Vous n’avez pas la permission de créer des compositions'
                  : 'Limite quotidienne de compositions atteinte'}
              </span>
            </div>
          </div>
        )}

        {/* Bandeau composition en cours */}
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-xl sm:rounded-2xl">
          <h4 className="font-medium text-blue-900 mb-3 sm:mb-4 flex items-center text-sm sm:text-base gap-2">
            <span className="text-lg">⌘</span>Composition en cours :
          </h4>

          {/* Chips ordonnables – UI harmonisée */}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedConcepts.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500 w-full">
                <div className="text-3xl sm:text-4xl mb-2 animate-pulse">☯</div>
                <span className="text-xs sm:text-sm">Cliquez sur des concepts pour commencer</span>
              </div>
            ) : (
              selectedConcepts.map((c, i) => (
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

                  {/* Actions (left/right/remove) intégrées et discrètes */}
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      className="h-6 w-6 inline-flex items-center justify-center rounded-full border border-indigo-200/70 bg-white/80 hover:bg-indigo-50 text-indigo-700 text-xs disabled:opacity-40"
                      onClick={() => onMoveLeft(i)}
                      disabled={i === 0 || disabled}
                      aria-label="Déplacer à gauche"
                      title="Déplacer à gauche"
                    >
                      ◀
                    </button>
                    <button
                      className="h-6 w-6 inline-flex items-center justify-center rounded-full border border-indigo-200/70 bg-white/80 hover:bg-indigo-50 text-indigo-700 text-xs disabled:opacity-40"
                      onClick={() => onMoveRight(i)}
                      disabled={i === selectedConcepts.length - 1 || disabled}
                      aria-label="Déplacer à droite"
                      title="Déplacer à droite"
                    >
                      ▶
                    </button>
                    <button
                      className="h-6 w-6 inline-flex items-center justify-center rounded-full border border-rose-200 bg-white/80 hover:bg-rose-50 text-rose-600 text-xs"
                      onClick={() => onRemoveAt(i)}
                      aria-label="Retirer"
                      title="Retirer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pattern chips */}
          <div className="p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-lg border text-center">
            <span className="text-xs sm:text-sm text-purple-700 font-medium">Pattern: </span>
            <span className="font-mono text-purple-900 text-xs sm:text-sm font-semibold">
              {compositionChips || '(aucun)'}
            </span>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Sens et Description sur la même ligne sur desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Sens - plus étroit */}
            <div className="md:col-span-1">
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">✹</span> Sens de la composition
              </label>
              <textarea
                value={manualSens}
                onChange={(e) => setManualSens(e.target.value)}
                placeholder="Décrivez le sens de cette composition…"
                className="w-full border-2 border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base bg-white/90 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                rows={3}
                disabled={disabled}
              />
            </div>

            {/* Description - plus large */}
            <div className="md:col-span-2">
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">✎</span> Description de la composition
              </label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Décrivez l'usage de cette composition…"
                className="w-full border-2 border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base bg-white/90 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                rows={3}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Exemples */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">✦</span> Exemples d'usage
              <span className="ml-2 text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-2 py-1 rounded-full border border-green-300">
                {manualExamples.length} exemple{manualExamples.length !== 1 ? 's' : ''}
              </span>
            </label>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={currentExample}
                onChange={(e) => setCurrentExample(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Saisissez un exemple d’usage…"
                className="flex-1 border-2 border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
              />
              <button
                onClick={addExample}
                disabled={!currentExample.trim() || disabled}
                className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-medium flex items-center gap-1 transition-all transform text-sm sm:text-base ${
                  currentExample.trim() && !disabled
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>＋</span>
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            </div>

            <div className="text-xs sm:text-sm text-gray-500 mb-3 flex items-center p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <span className="mr-1">⟲</span>
              Astuce : Appuyez sur Entrée ou cliquez sur « Ajouter » pour ajouter l’exemple
            </div>

            {manualExamples.length > 0 && (
              <div className="space-y-2 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-200">
                <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <span>✓</span> Exemples ajoutés :
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
                      disabled={disabled}
                      className="text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-base sm:text-lg flex-shrink-0 disabled:opacity-25"
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
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 transition-all transform text-sm sm:text-base ${
              !isCreateDisabled
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onCreateManual}
            disabled={isCreateDisabled}
          >
            <span className="text-lg">✳︎</span>
            <span className="hidden sm:inline">Créer Composition Manuelle</span>
            <span className="sm:hidden">Créer</span>
          </button>
          <button
            className="px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onReset}
            disabled={disabled}
          >
            <span className="text-lg">↺</span>
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* Message d’info si pas assez de concepts */}
        {selectedConcepts.length < 2 && !disabled && (
          <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg sm:rounded-xl">
            <div className="flex items-center text-yellow-800 text-xs sm:text-sm gap-2">
              <span className="text-base">ⓘ</span>
              <span>Sélectionnez au moins 2 concepts pour créer une composition</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
