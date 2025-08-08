'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ConceptCard from '@/app/components/features/concepts/ConceptCard';
import { Concept } from '@/interfaces/concept.interface';
// import { Pagination } from '@/components/ui/Pagination'; // si tu as un export default, ajuste l'import

type CompositionResult = {
  sens: string;
  confidence: number;
  justification: string;
  source: string;
  examples?: string[];
  alternatives?: Array<{ sens: string; confidence: number }>;
  pattern?: string[];
  patternWords?: string[];
};

// UI-level: interface minimaliste pour les concepts affichés
export default function CompositionPage() {
  const [mode, setMode] = useState<'manual' | 'ai-search' | 'ai-analyze'>('manual');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);
  const [communityComps, setCommunityComps] = useState<any[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    sens: '',
    description: '',
    statut: 'PROPOSITION' as 'PROPOSITION' | 'EN_COURS' | 'ADOPTE',
  });
  const [aiLoading, setAiLoading] = useState(false);

  // Load concepts
  useEffect(() => {
    fetch('/api/concepts')
      .then((res) => res.json())
      .then((data: any) => {
        const list = data?.concepts ?? data ?? [];
        // Transform minimal for UI
        const mapped = list.map((c: any) => ({
          id: c.id,
          mot: c.mot,
          concept: c.definition ?? '',
          type: c.type,
          proprietes: c.conceptProperties?.map((cp: any) => cp.property?.name) ?? [],
          couleur: '#64748b',
        }));
        setConcepts(mapped as any);
      })
      .catch(() => setConcepts([]));
  }, []);

  // Load community compositions
  useEffect(() => {
    fetch('/api/compositions')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCommunityComps(data);
        else if (Array.isArray(data?.compositions)) setCommunityComps(data.compositions);
      })
      .catch(() => setCommunityComps([]));
  }, []);

  // Add composition pattern to selection
  const addCompositionToSelectionByPattern = useCallback(
    (pattern: string[]) => {
      const mapById = new Map<string, any>();
      concepts.forEach((c) => mapById.set(c.id, c));
      const toAdd = pattern.map((id) => mapById.get(id)).filter(Boolean);
      setSelectedConcepts((prev) => {
        const merged = [...prev];
        toAdd.forEach((c) => {
          if (!merged.find((x) => x.id === c.id) && merged.length < 4) merged.push(c);
        });
        return merged;
      });
    },
    [concepts],
  );

  // Analyse manual
  const handleManualAnalysis = async () => {
    if (selectedConcepts.length < 2) return;
    const ids = selectedConcepts.map((c) => c.id);
    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptIds: ids }),
      });
      const result = await res.json();
      setCompositionResult(result);
    } catch {
      setCompositionResult({
        sens: `Composition de ${ids.length} concepts`,
        confidence: 0,
        justification: 'Erreur',
        source: 'algorithmic',
      });
    }
  };

  // IA: recherche inverse
  const handleAISearch = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/search-reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frenchInput: aiInput }),
      });
      const data = await res.json();
      // Mapper le format autant que possible sur CompositionResult
      const result: CompositionResult = {
        sens: data?.sens ?? '',
        confidence: data?.confidence ?? 0,
        justification: data?.justification ?? '',
        source: data?.source ?? 'llm',
        examples: data?.examples ?? [],
        pattern: data?.pattern ?? [],
        patternWords: data?.patternWords ?? [],
      };
      setCompositionResult(result);
      // Optionnel: ajouter au history si nécessaire
    } catch {
      setCompositionResult({
        sens: 'Résultat IA indisponible',
        confidence: 0,
        justification: 'Erreur pendant la recherche IA',
        source: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // IA: analyse composition
  const handleAIAnalyze = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/analyze-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ composition: aiInput }),
      });
      const data = await res.json();
      setCompositionResult(data);
    } catch {
      setCompositionResult({
        sens: 'Composition IA',
        confidence: 0,
        justification: 'Erreur lors de l’analyse IA',
        source: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Sauvegarde
  const openSaveModal = () => {
    if (compositionResult) {
      setSaveFormData((p) => ({ ...p, sens: compositionResult.sens ?? p.sens ?? '' }));
      setShowSaveModal(true);
    }
  };

  const handleSaveComposition = async () => {
    if (!compositionResult && selectedConcepts.length === 0) return;
    const pattern = selectedConcepts.map((c) => c.id);
    try {
      const payload = {
        pattern,
        sens: saveFormData.sens || compositionResult?.sens,
        description: saveFormData.description,
        statut: saveFormData.statut,
        source: compositionResult?.source === 'llm' ? 'LLM_SUGGESTED' : 'MANUAL',
        confidenceScore: compositionResult?.confidence ?? 0,
      };
      const resp = await fetch('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        alert('Composition sauvegardée');
        setShowSaveModal(false);
        setSelectedConcepts([]);
        setCompositionResult(null);
      } else {
        alert('Erreur sauvegarde');
      }
    } catch {
      alert('Erreur sauvegarde');
    }
  };

  // UI helpers
  const isSavable = useMemo(() => {
    const hasManual = (saveFormData.sens ?? '').trim().length > 0;
    const hasIA = (compositionResult?.sens ?? '').trim().length > 0;
    return hasManual || hasIA;
  }, [saveFormData.sens, compositionResult?.sens]);

  // Render rapide
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Atelier de Composition</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('manual')}
              className={
                mode === 'manual'
                  ? 'px-4 py-2 bg-blue-600 text-white rounded'
                  : 'px-4 py-2 border rounded'
              }
            >
              Manuel
            </button>
            <button
              onClick={() => setMode('ai-search')}
              className={
                mode === 'ai-search'
                  ? 'px-4 py-2 bg-violet-600 text-white rounded'
                  : 'px-4 py-2 border rounded'
              }
            >
              IA Recherche
            </button>
            <button
              onClick={() => setMode('ai-analyze')}
              className={
                mode === 'ai-analyze'
                  ? 'px-4 py-2 bg-green-600 text-white rounded'
                  : 'px-4 py-2 border rounded'
              }
            >
              IA Analyse
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {mode === 'manual' && 'Sélectionnez des concepts pour créer une composition.'}
          {mode === 'ai-search' &&
            'Décrivez une composition en français pour trouver une composition.'}
          {mode === 'ai-analyze' &&
            'Entrez une composition ou sélectionnez des concepts pour l’analyser.'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Concept grid */}
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Concepts disponibles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {concepts.map((c) => (
                <ConceptCard
                  key={c.id}
                  concept={c}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onSelect={(concept: Concept) => {
                    if (
                      !selectedConcepts.find((s) => s.id === concept.id) &&
                      selectedConcepts.length < 4
                    ) {
                      setSelectedConcepts((prev) => [...prev, concept]);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Composition en cours (chips) */}
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Composition en cours</h3>
            <div className="flex flex-wrap gap-2">
              {selectedConcepts.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                >
                  {c.mot}
                </span>
              ))}
              {selectedConcepts.length === 0 && (
                <span className="text-sm text-gray-500">Aucun concept sélectionné</span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleManualAnalysis}
              >
                Analyser
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setSelectedConcepts([])}
              >
                Effacer
              </button>
            </div>
          </div>
        </div>

        {compositionResult && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span>Résultat IA</span>
              </div>
              <span className={`text-sm font-semibold`}>
                {compositionResult.confidence
                  ? Math.round(compositionResult.confidence * 100) + '%'
                  : ''}
              </span>
            </div>
            <div className="mb-2">
              <strong>Sens proposé:</strong> {compositionResult.sens}
            </div>
            <div className="text-sm text-gray-700 italic">{compositionResult.justification}</div>
            {compositionResult.examples?.length ? (
              <div className="mt-2">
                <strong>Exemples :</strong>
                <ul className="list-disc pl-5">
                  {compositionResult.examples.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {compositionResult.patternWords?.length ? (
              <div className="mt-2">
                <strong>Primitives concernées:</strong> {compositionResult.patternWords.join(' • ')}
              </div>
            ) : null}
            <div className="mt-2 flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={openSaveModal}>
                Sauvegarder
              </button>
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setCompositionResult(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* UI IA - TEST: panneau IA Recherche et IA Analyse (visible selon le mode) */}
        {mode === 'ai-search' && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">IA Recherche</h3>
            <div className="grid grid-cols-1 gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concept Français à décrire
              </label>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder='Ex: "lever de soleil"'
                className="w-full h-28 border border-gray-300 rounded-md p-2"
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAISearch}
                  disabled={!aiInput.trim() || aiLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {aiLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent border-l-transparent rounded-full animate-spin" />
                  ) : (
                    'Rechercher'
                  )}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md"
                  onClick={() => setAiInput('')}
                >
                  Effacer
                </button>
              </div>
            </div>
          </div>
        )}
        {mode === 'ai-analyze' && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">IA Analyse</h3>
            <div className="grid grid-cols-1 gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Composition à analyser
              </label>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder='Ex: "go tomu"'
                className="w-full h-28 border border-gray-300 rounded-md p-2"
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAIAnalyze}
                  disabled={!aiInput.trim() || aiLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {aiLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent border-l-transparent rounded-full animate-spin" />
                  ) : (
                    'Analyser'
                  )}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md"
                  onClick={() => setAiInput('')}
                >
                  Effacer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compositions Communautaires (atelier search) */}
      {communityComps.length > 0 && (
        <div className="mt-6 p-4 border rounded-lg bg-white">
          <h3 className="font-medium mb-2">Compositions Communautaires</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {communityComps.map((cb) => {
              // Safe display du pattern
              let patternDisplay = '';
              if (Array.isArray(cb.pattern)) {
                patternDisplay = cb.pattern.join(' + ');
              } else if (typeof cb.pattern === 'string') {
                // Si c'est une string, tenter de parser JSON
                try {
                  const parsed = JSON.parse(cb.pattern);
                  if (Array.isArray(parsed)) patternDisplay = parsed.join(' + ');
                  else patternDisplay = cb.pattern;
                } catch {
                  patternDisplay = cb.pattern;
                }
              }

              return (
                <div key={cb.id} className="border rounded p-3 bg-white">
                  <div className="font-semibold mb-1">{cb.sens ?? patternDisplay ?? ''}</div>
                  <div className="text-sm text-gray-600 mt-1">Pattern: {patternDisplay}</div>
                  <button
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                    onClick={() => {
                      // Construire un tableau de IDs à partir du pattern
                      let patternArr: string[] = [];
                      if (Array.isArray(cb.pattern)) {
                        patternArr = cb.pattern;
                      } else if (typeof cb.pattern === 'string') {
                        try {
                          const parsed = JSON.parse(cb.pattern);
                          if (Array.isArray(parsed)) patternArr = parsed;
                        } catch {
                          patternArr = [];
                        }
                      }
                      addCompositionToSelectionByPattern(patternArr);
                    }}
                  >
                    Utiliser
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Sauvegarde (basique) */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Sauvegarder la Composition</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Concepts :</label>
                <div className="flex flex-wrap gap-2">
                  {selectedConcepts.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs"
                    >
                      {c.mot}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sens *</label>
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  value={saveFormData.sens}
                  onChange={(e) => setSaveFormData((s) => ({ ...s, sens: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  value={saveFormData.description}
                  onChange={(e) => setSaveFormData((s) => ({ ...s, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  value={saveFormData.statut}
                  onChange={(e) =>
                    setSaveFormData((s) => ({ ...s, statut: e.target.value as any }))
                  }
                >
                  <option value="PROPOSITION">Proposition</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="ADOPTE">Adopté</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded"
                onClick={() => setShowSaveModal(false)}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleSaveComposition}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
