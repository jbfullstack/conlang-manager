'use client';
import React, { useState } from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Comp = {
  id: string;
  sens?: string;
  pattern?: any;
  description?: string;
  statut?: string;
  confidenceScore?: number;
  createdAt?: string;
};

type Props = {
  comps: Comp[];
  concepts: Concept[];
  onUsePattern?: (ids: string[]) => void;
};

export default function CompositionsRecent({ comps, concepts, onUsePattern }: Props) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Map concepts by id for quick lookup
  const mapById = React.useMemo(() => {
    const m = new Map<string, Concept>();
    concepts.forEach((c) => m.set(c.id, c));
    return m;
  }, [concepts]);

  const handleUse = (ids?: string[]) => {
    if (!ids?.length || !onUsePattern) return;
    onUsePattern(ids);
  };

  const toggleExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusColor = (statut?: string) => {
    switch (statut?.toLowerCase()) {
      case 'adopte':
        return 'from-green-400 to-green-600 text-white';
      case 'en_cours':
        return 'from-yellow-400 to-yellow-600 text-white';
      case 'proposition':
        return 'from-blue-400 to-blue-600 text-white';
      default:
        return 'from-gray-400 to-gray-600 text-white';
    }
  };

  const getStatusIcon = (statut?: string) => {
    switch (statut?.toLowerCase()) {
      case 'adopte':
        return '✅';
      case 'en_cours':
        return '⏳';
      case 'proposition':
        return '📝';
      default:
        return '❓';
    }
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Pagination
  const totalPages = Math.ceil(comps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleComps = comps.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
          <span className="mr-2">📚</span>
          Compositions communautaires
        </h3>
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-2 sm:px-3 py-1 rounded-full border border-purple-200">
            <span className="text-purple-700 font-medium">{comps.length} compositions</span>
          </div>
          {totalPages > 1 && (
            <div className="bg-gray-50 px-2 sm:px-3 py-1 rounded-full border border-gray-200">
              <span className="text-gray-700 font-medium">
                Page {currentPage}/{totalPages}
              </span>
            </div>
          )}
        </div>
      </div>

      {comps.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-dashed border-purple-200">
          <div className="text-4xl sm:text-6xl mb-4">🔍</div>
          <p className="text-sm sm:text-base text-gray-600 mb-2">Aucune composition récente</p>
          <p className="text-xs sm:text-sm text-gray-500">
            Les compositions créées apparaîtront ici
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {visibleComps.map((comp) => {
              // Normaliser pattern en tableau de chaînes
              let patternArray: string[] = [];

              if (Array.isArray(comp.pattern)) {
                patternArray = comp.pattern;
              } else if (typeof comp.pattern === 'string' && comp.pattern.trim()) {
                try {
                  const parsed = JSON.parse(comp.pattern);
                  patternArray = Array.isArray(parsed) ? parsed : [];
                } catch {
                  patternArray = [comp.pattern];
                }
              }

              const conceptNames = patternArray.map((id) => mapById.get(id)?.mot || id);
              const label = comp.sens || conceptNames.join(' + ') || 'Composition sans nom';
              const isExpanded = expandedCards.has(comp.id);

              return (
                <div
                  key={comp.id}
                  className="group bg-white rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                          {label}
                        </h4>
                        {comp.statut && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(
                                comp.statut,
                              )} shadow-sm`}
                            >
                              {getStatusIcon(comp.statut)} {comp.statut}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpanded(comp.id)}
                        className="text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        <span
                          className={`transform transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          ↓
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    {patternArray.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Concepts :</div>
                        <div className="flex flex-wrap gap-1">
                          {conceptNames.slice(0, isExpanded ? undefined : 3).map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs rounded-full border border-blue-200"
                            >
                              {name}
                            </span>
                          ))}
                          {!isExpanded && conceptNames.length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{conceptNames.length - 3} autres...
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="space-y-2 text-xs sm:text-sm">
                        {comp.description && (
                          <div>
                            <span className="text-gray-500">Description :</span>
                            <p className="text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                              {comp.description}
                            </p>
                          </div>
                        )}
                        {comp.confidenceScore !== undefined && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Confiance :</span>
                            <span
                              className={`font-medium ${getConfidenceColor(comp.confidenceScore)}`}
                            >
                              {Math.round(comp.confidenceScore * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <button
                      onClick={() => handleUse(patternArray)}
                      className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center space-x-1"
                    >
                      <span>✨</span>
                      <span>Utiliser cette composition</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-purple-100">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
                  currentPage > 1
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="mr-1">←</span>
                <span className="hidden sm:inline">Précédent</span>
              </button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                      pageNum === currentPage
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
                  currentPage < totalPages
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">Suivant</span>
                <span className="ml-1">→</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
