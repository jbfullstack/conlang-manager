'use client';
import React, { useMemo, useRef, useState } from 'react';
import { Concept } from '@/interfaces/concept.interface';
import { getConceptTypeIcon } from '@/lib/concept-types-utils';

type Props = {
  concepts: Concept[];
  onSelect?: (c: Concept) => void;
  pageSize?: number;
};

export default function ConceptsAvailable({ concepts, onSelect, pageSize = 6 }: Props) {
  const [page, setPage] = useState(1);

  // Remplace l'ancien "selectedConcepts" (toggle persistant) par une sélection TRANSITOIRE
  const [transientSelectedIds, setTransientSelectedIds] = useState<Set<string>>(new Set());

  // Petit halo de clic (anneau) pour bien marquer l'action
  const [clickFlashIds, setClickFlashIds] = useState<Set<string>>(new Set());

  // Timers par carte pour nettoyer proprement les états transitoires
  const timersRef = useRef<Map<string, number>>(new Map());

  const totalPages = Math.max(1, Math.ceil(concepts.length / pageSize));

  const pagedConcepts = useMemo(
    () => concepts.slice((page - 1) * pageSize, page * pageSize),
    [concepts, page, pageSize],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const ACK_MS = 250; // durée de l'ack visuel “sélection”

  const startTransientSelect = (id: string) => {
    setTransientSelectedIds((prev) => {
      const ns = new Set(prev);
      ns.add(id);
      return ns;
    });

    // Clear d'un ancien timer si multi-clic
    const old = timersRef.current.get(id);
    if (old) {
      window.clearTimeout(old);
    }

    const t = window.setTimeout(() => {
      setTransientSelectedIds((prev) => {
        const ns = new Set(prev);
        ns.delete(id);
        return ns;
      });
      timersRef.current.delete(id);
    }, ACK_MS);

    timersRef.current.set(id, t as unknown as number);
  };

  const flashClick = (id: string) => {
    setClickFlashIds((prev) => {
      const ns = new Set(prev);
      ns.add(id);
      return ns;
    });
    window.setTimeout(() => {
      setClickFlashIds((prev) => {
        const ns = new Set(prev);
        ns.delete(id);
        return ns;
      });
    }, ACK_MS + 70);
  };

  const handleSelect = (concept: Concept) => {
    // Sélection brève -> retour auto
    startTransientSelect(concept.id);
    // Halo court (anneau/ping)
    flashClick(concept.id);

    // On notifie le parent (inchangé)
    onSelect?.(concept);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      element: 'from-blue-400 to-blue-600',
      action: 'from-red-400 to-red-600',
      qualite: 'from-green-400 to-green-600',
      relation: 'from-purple-400 to-purple-600',
      abstrait: 'from-yellow-400 to-yellow-600',
    };
    return colors[type as keyof typeof colors] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
          <span className="mr-2">🧠</span>
          <span className="hidden sm:inline">Concepts</span>
          <span className="sm:hidden">Concepts</span>
        </h3>
        <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 px-2 sm:px-3 py-1 rounded-full border border-blue-200">
          <span className="text-xs sm:text-sm text-blue-700 font-medium">
            {transientSelectedIds.size} sélectionné{transientSelectedIds.size !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grille des concepts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 mb-4">
        {pagedConcepts.map((concept) => {
          const isSelectedTransient = transientSelectedIds.has(concept.id);
          const isFlashing = clickFlashIds.has(concept.id);

          return (
            <button
              key={concept.id}
              onClick={() => handleSelect(concept)}
              className={`group relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                isSelectedTransient
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50'
              } ${isFlashing ? 'ring-2 ring-blue-400/60' : ''}`}
            >
              {/* Badge de type */}
              <div
                className={`absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r ${getTypeColor(
                  concept.type,
                )} rounded-full flex items-center justify-center shadow-sm`}
              >
                <span className="text-xs sm:text-sm">{getConceptTypeIcon(concept.type)}</span>
              </div>

              {/* Contenu principal */}
              <div className="pr-4">
                <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                  <span className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                    {concept.mot}
                  </span>
                  {isSelectedTransient && (
                    <span className="text-blue-500 text-lg animate-pulse">✓</span>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                  {concept.definition}
                </div>

                {/* Type et propriétés */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTypeColor(
                      concept.type,
                    )} text-white shadow-sm`}
                  >
                    {concept.type}
                  </span>
                  {concept.exemples && concept.exemples.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {concept.exemples.length} ex.
                    </span>
                  )}
                </div>
              </div>

              {/* Effet de sélection bref */}
              {isSelectedTransient && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-lg sm:rounded-xl animate-pulse"></div>
              )}

              {/* Ping court au clic (même si l'état transitoire est déjà terminé) */}
              {isFlashing && (
                <span className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl animate-ping opacity-40 bg-blue-300/20"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {concepts.length > pageSize && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
              canPrev
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
          >
            <span className="mr-1">←</span>
            <span className="hidden sm:inline">Précédent</span>
          </button>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 rounded-full">
              {page} / {totalPages}
            </span>
          </div>

          <button
            className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
              canNext
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!canNext}
          >
            <span className="hidden sm:inline">Suivant</span>
            <span className="ml-1">→</span>
          </button>
        </div>
      )}

      {/* Info responsive */}
      <div className="mt-4 text-xs text-gray-500 text-center bg-gray-50 p-2 rounded-lg">
        💡 Cliquez sur les concepts pour les ajouter à votre composition
      </div>
    </div>
  );
}
