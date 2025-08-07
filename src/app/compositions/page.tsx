'use client';

import React, { useState, useEffect, useMemo } from 'react';

// Types basés sur votre documentation
interface Concept {
  id: string;
  mot: string;
  concept: string;
  type: 'element' | 'action' | 'qualite' | 'relation' | 'abstrait';
  proprietes: string[];
  couleur?: string;
  usage_count?: number;
  creation_date?: string;
}

interface CompositionResult {
  sens: string;
  confidence: number;
  justification: string;
  source: 'cache' | 'algorithmic' | 'llm' | 'community';
  examples?: string[];
  alternatives?: Array<{ sens: string; confidence: number }>;
}

interface ExistingComposition {
  id: string;
  pattern: string[];
  sens: string;
  status: 'proposition' | 'en_cours' | 'adopte' | 'refuse' | 'desuet';
  creation_date: string;
  votes: number;
  usage_examples?: string[];
}

// Données de test - remplacer par vos vraies données
const mockConcepts: Concept[] = [
  {
    id: '1',
    mot: 'go',
    concept: 'eau',
    type: 'element',
    proprietes: ['liquide', 'fluide', 'vital'],
    couleur: 'bg-blue-500',
  },
  {
    id: '2',
    mot: 'tomu',
    concept: 'mouvement rapide',
    type: 'action',
    proprietes: ['rapide', 'dynamique', 'intense'],
    couleur: 'bg-red-500',
  },
  {
    id: '3',
    mot: 'solu',
    concept: 'lumière',
    type: 'element',
    proprietes: ['brillant', 'chaud', 'visible'],
    couleur: 'bg-yellow-500',
  },
  {
    id: '4',
    mot: 'vastè',
    concept: 'immensité',
    type: 'qualite',
    proprietes: ['grand', 'infini', 'ouvert'],
    couleur: 'bg-purple-500',
  },
  {
    id: '5',
    mot: 'minu',
    concept: 'finesse/petitesse',
    type: 'qualite',
    proprietes: ['petit', 'délicat', 'précis'],
    couleur: 'bg-green-500',
  },
  {
    id: '6',
    mot: 'kalu',
    concept: 'froid',
    type: 'qualite',
    proprietes: ['froid', 'rigide', 'dur'],
    couleur: 'bg-cyan-500',
  },
];

const mockCompositions: ExistingComposition[] = [
  {
    id: '1',
    pattern: ['go', 'tomu'],
    sens: 'torrent/cascade',
    status: 'adopte',
    creation_date: '2024-01-15',
    votes: 8,
  },
  {
    id: '2',
    pattern: ['solu', 'vastè'],
    sens: 'horizon lumineux',
    status: 'en_cours',
    creation_date: '2024-01-20',
    votes: 3,
  },
];

const CompositionPage = () => {
  const [mode, setMode] = useState<'manual' | 'ai-search' | 'ai-analyze'>('manual');
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    minConfidence: 0.3,
    preferredSource: 'any',
  });
  const [history, setHistory] = useState<CompositionResult[]>([]);

  // API CALLS - À REMPLACER PAR VOS VRAIS APPELS
  const analyzeManualComposition = async (concepts: Concept[]): Promise<CompositionResult> => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptIds: concepts.map((c) => c.id) }),
      });
      const result = await response.json();

      setIsAnalyzing(false);
      return result;
    } catch (error) {
      setIsAnalyzing(false);
      // Fallback en cas d'erreur
      return {
        sens: `Combinaison de ${concepts.map((c) => c.concept).join(', ')}`,
        confidence: 0.4,
        justification: "Erreur lors de l'analyse - résultat par défaut",
        source: 'algorithmic',
      };
    }
  };

  const performReverseSearch = async (frenchConcept: string): Promise<CompositionResult> => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/search-reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frenchInput: frenchConcept }),
      });
      const result = await response.json();

      setIsAnalyzing(false);
      return result;
    } catch (error) {
      setIsAnalyzing(false);
      return {
        sens: `Recherche pour "${frenchConcept}"`,
        confidence: 0.3,
        justification: 'Erreur lors de la recherche',
        source: 'llm',
      };
    }
  };

  const analyzeCompositionMeaning = async (
    compositionString: string,
  ): Promise<CompositionResult> => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ composition: compositionString }),
      });
      const result = await response.json();

      setIsAnalyzing(false);
      return result;
    } catch (error) {
      setIsAnalyzing(false);
      return {
        sens: `Analyse de "${compositionString}"`,
        confidence: 0.3,
        justification: "Erreur lors de l'analyse",
        source: 'llm',
      };
    }
  };

  const handleManualAnalysis = async () => {
    if (selectedConcepts.length < 2) return;

    const result = await analyzeManualComposition(selectedConcepts);
    setCompositionResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 10));
  };

  const handleAISearch = async () => {
    if (!aiInput.trim()) return;

    const result = await performReverseSearch(aiInput);
    setCompositionResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 10));
  };

  const handleAIAnalyze = async () => {
    if (!aiInput.trim()) return;

    const result = await analyzeCompositionMeaning(aiInput);
    setCompositionResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 10));
  };

  const filteredConcepts = useMemo(() => {
    return mockConcepts.filter((concept) => {
      const matchesSearch =
        concept.mot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concept.concept.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filters.type === 'all' || concept.type === filters.type;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, filters]);

  const conceptsByType = useMemo(() => {
    const groups: Record<string, Concept[]> = {};
    filteredConcepts.forEach((concept) => {
      if (!groups[concept.type]) groups[concept.type] = [];
      groups[concept.type].push(concept);
    });
    return groups;
  }, [filteredConcepts]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'cache':
        return '✅';
      case 'algorithmic':
        return '⚡';
      case 'llm':
        return '🧠';
      default:
        return 'ℹ️';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            ✨ Atelier de Composition
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">🧠 {mockConcepts.length} concepts</div>
            <div className="flex items-center">✅ {mockCompositions.length} compositions</div>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              mode === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span>➕</span>
            <span>Composition Manuelle</span>
          </button>
          <button
            onClick={() => setMode('ai-search')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              mode === 'ai-search' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span>🔍</span>
            <span>Recherche IA</span>
          </button>
          <button
            onClick={() => setMode('ai-analyze')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              mode === 'ai-analyze' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span>🪄</span>
            <span>Analyse IA</span>
          </button>
        </div>

        <p className="text-gray-600">
          {mode === 'manual' && 'Sélectionnez des concepts pour créer une composition'}
          {mode === 'ai-search' && 'Décrivez un concept en français pour trouver sa composition'}
          {mode === 'ai-analyze' && 'Entrez une composition pour en analyser le sens'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECTION PRINCIPALE */}
        <div className="lg:col-span-2">
          {mode === 'manual' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Concepts Disponibles ({filteredConcepts.length})
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-sm bg-gray-100 px-3 py-1 rounded-lg"
                >
                  <span>🔧</span>
                  <span>Filtres</span>
                  <span>{showFilters ? '🔼' : '🔽'}</span>
                </button>
              </div>

              {/* FILTRES */}
              {showFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={filters.type}
                        onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">Tous les types</option>
                        <option value="element">Éléments</option>
                        <option value="action">Actions</option>
                        <option value="qualite">Qualités</option>
                        <option value="relation">Relations</option>
                        <option value="abstrait">Abstraits</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* RECHERCHE */}
              <input
                type="text"
                placeholder="Rechercher un concept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500"
              />

              {/* CONCEPTS SÉLECTIONNÉS */}
              {selectedConcepts.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Composition en cours :</h3>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {selectedConcepts.map((concept, i) => (
                      <React.Fragment key={concept.id}>
                        <div
                          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm text-white ${
                            concept.couleur || 'bg-gray-500'
                          }`}
                        >
                          <span className="font-medium">{concept.mot}</span>
                          <span className="text-xs opacity-75">({concept.concept})</span>
                          <button
                            onClick={() =>
                              setSelectedConcepts((prev) => prev.filter((c) => c.id !== concept.id))
                            }
                            className="ml-1 text-white hover:text-gray-200"
                          >
                            ×
                          </button>
                        </div>
                        {i < selectedConcepts.length - 1 && (
                          <span className="text-blue-500">➡️</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {selectedConcepts.length >= 4 && (
                    <div className="mt-2 text-sm text-orange-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      Plus de 3 concepts diminue la précision de l'analyse
                    </div>
                  )}
                </div>
              )}

              {/* GRILLE DES CONCEPTS PAR TYPE */}
              <div className="space-y-6">
                {Object.entries(conceptsByType).map(([type, concepts]) => (
                  <div key={type} className="space-y-3">
                    <h3 className="font-medium text-gray-700 capitalize border-b pb-2">
                      {type}s ({concepts.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {concepts.map((concept) => {
                        const isSelected = selectedConcepts.find((c) => c.id === concept.id);
                        return (
                          <button
                            key={concept.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedConcepts((prev) =>
                                  prev.filter((c) => c.id !== concept.id),
                                );
                              } else if (selectedConcepts.length < 4) {
                                setSelectedConcepts((prev) => [...prev, concept]);
                              }
                            }}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  concept.couleur || 'bg-gray-400'
                                }`}
                              ></div>
                              <span className="font-medium text-gray-900">{concept.mot}</span>
                            </div>
                            <div className="text-sm text-gray-600">{concept.concept}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {concept.proprietes.join(', ')}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(mode === 'ai-search' || mode === 'ai-analyze') && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {mode === 'ai-search'
                  ? '🔍 Recherche Inverse par IA'
                  : '🪄 Analyse de Composition par IA'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === 'ai-search'
                      ? 'Concept français à rechercher :'
                      : 'Composition à analyser :'}
                  </label>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={
                      mode === 'ai-search'
                        ? 'Ex: "lever de soleil", "torrent de montagne", "murmure du vent"...'
                        : 'Ex: "go tomu", "solu vastè minu", "kalu + go"...'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={mode === 'ai-search' ? handleAISearch : handleAIAnalyze}
                  disabled={!aiInput.trim() || isAnalyzing}
                  className="w-full py-3 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🧠</span>
                      {mode === 'ai-search' ? 'Rechercher' : 'Analyser'}
                    </>
                  )}
                </button>
              </div>

              {/* CONCEPTS EXISTANTS POUR CONTEXTE */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Concepts disponibles :</h3>
                <div className="flex flex-wrap gap-2">
                  {mockConcepts.slice(0, 6).map((concept) => (
                    <div
                      key={concept.id}
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs text-white ${
                        concept.couleur || 'bg-gray-500'
                      }`}
                    >
                      <span>{concept.mot}</span>
                    </div>
                  ))}
                  {mockConcepts.length > 6 && (
                    <span className="text-xs text-gray-500">
                      +{mockConcepts.length - 6} autres...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANNEAU D'ANALYSE ET RÉSULTATS */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {mode === 'manual' ? '⚙️ Analyseur' : '📊 Résultats IA'}
            </h3>

            {/* ZONE DE TRAVAIL MANUEL */}
            {mode === 'manual' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-32">
                  {selectedConcepts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-6xl mb-4">🧠</div>
                      <p>Sélectionnez 2-3 concepts</p>
                      <p className="text-sm">pour commencer l'analyse</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">
                        Concepts sélectionnés ({selectedConcepts.length}) :
                      </div>
                      {selectedConcepts.map((concept, i) => (
                        <div key={concept.id} className="flex items-center space-x-2">
                          <span className="text-lg">{i + 1}.</span>
                          <div
                            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm text-white ${
                              concept.couleur || 'bg-gray-500'
                            }`}
                          >
                            <span className="font-medium">{concept.mot}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleManualAnalysis}
                  disabled={selectedConcepts.length < 2 || isAnalyzing}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Analyse...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🧠</span>
                      Analyser
                    </>
                  )}
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const shuffled = [...selectedConcepts].sort(() => Math.random() - 0.5);
                      setSelectedConcepts(shuffled);
                    }}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center text-sm"
                  >
                    <span className="mr-1">🔀</span>
                    Mélanger
                  </button>
                  <button
                    onClick={() => {
                      setSelectedConcepts([]);
                      setCompositionResult(null);
                    }}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Effacer
                  </button>
                </div>
              </div>
            )}

            {/* RÉSULTAT DE L'ANALYSE */}
            {compositionResult && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  compositionResult.confidence >= 0.7
                    ? 'border-green-200 bg-green-50'
                    : compositionResult.confidence >= 0.5
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                {/* EN-TÊTE DU RÉSULTAT */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span>{getSourceIcon(compositionResult.source)}</span>
                    <span className="font-medium text-gray-900">
                      {compositionResult.source === 'cache'
                        ? 'Déjà connu'
                        : compositionResult.source === 'algorithmic'
                        ? 'Règle linguistique'
                        : 'Analyse IA'}
                    </span>
                  </div>
                  <div className={`font-bold ${getConfidenceColor(compositionResult.confidence)}`}>
                    {(compositionResult.confidence * 100).toFixed(0)}%
                  </div>
                </div>

                {/* SENS PROPOSÉ */}
                <div className="mb-3">
                  <h4 className="font-bold text-lg text-gray-900 mb-1">
                    "{compositionResult.sens}"
                  </h4>
                  <p className="text-sm text-gray-600 italic">{compositionResult.justification}</p>
                </div>

                {/* EXEMPLES D'USAGE */}
                {compositionResult.examples && compositionResult.examples.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-700 mb-1">Exemples :</h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {compositionResult.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ALTERNATIVES */}
                {compositionResult.alternatives && compositionResult.alternatives.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Sens alternatifs :</h5>
                    <div className="space-y-1">
                      {compositionResult.alternatives.map((alt, i) => (
                        <div key={i} className="text-sm flex items-center justify-between">
                          <span className="text-gray-600">• {alt.sens}</span>
                          <span className={`font-medium ${getConfidenceColor(alt.confidence)}`}>
                            {(alt.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex space-x-2 pt-3 border-t border-gray-200">
                  <button
                    className="flex-1 py-2 px-3 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    onClick={() => {
                      alert('Composition validée et sauvegardée !');
                    }}
                  >
                    ✓ Valider
                  </button>
                  <button
                    className="flex-1 py-2 px-3 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                    onClick={() => {
                      const newSens = prompt('Modifier le sens:', compositionResult.sens);
                      if (newSens) {
                        setCompositionResult((prev) => (prev ? { ...prev, sens: newSens } : null));
                      }
                    }}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    className="flex-1 py-2 px-3 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    onClick={() => {
                      setCompositionResult(null);
                    }}
                  >
                    ✗ Rejeter
                  </button>
                </div>
              </div>
            )}

            {/* HISTORIQUE */}
            {history.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">📝 Historique récent</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.slice(0, 5).map((item, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{item.sens}</div>
                      <div className={`text-xs ${getConfidenceColor(item.confidence)}`}>
                        {(item.confidence * 100).toFixed(0)}% • {item.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COMPOSITIONS EXISTANTES */}
      {mockCompositions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">👥</span>
            Compositions Communautaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockCompositions.map((comp) => (
              <div key={comp.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{comp.pattern.join(' + ')}</div>
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      comp.status === 'adopte'
                        ? 'bg-green-100 text-green-700'
                        : comp.status === 'en_cours'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {comp.status}
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900 mb-2">"{comp.sens}"</div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{comp.creation_date}</span>
                  <div className="flex items-center">
                    <span className="mr-1">💬</span>
                    {comp.votes} votes
                  </div>
                </div>
                <button
                  onClick={() => {
                    const concepts = comp.pattern
                      .map((p) => mockConcepts.find((c) => c.mot === p))
                      .filter(Boolean) as Concept[];
                    setSelectedConcepts(concepts);
                    setMode('manual');
                  }}
                  className="mt-2 text-blue-500 text-sm hover:underline"
                >
                  Réutiliser cette composition
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompositionPage;
