'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Concept } from '@/interfaces/concept.interface';
import ManualComposer from '@/app/components/features/composition/ManualComposer';
import AIReversePanel from '@/app/components/features/composition/AIReversePanel';
import AIAnalyzePanel from '@/app/components/features/composition/AIAnalyzePanel';
import ConceptsAvailable from '@/app/components/features/composition/ConceptsAvailable';
import CompositionsRecent from '@/app/components/features/composition/CompositionsRecent';
import CompositionResultPanel from '@/app/components/features/composition/CompositionResultPanel';
import { useConcepts } from '@/hooks/useConcepts';
import { useCompositions } from '@/hooks/useCompositions';
import SaveModal from '../components/features/composition/SaveModal';

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

export default function CompositionPage() {
  // Mode actif
  const [mode, setMode] = useState<'manual' | 'ai-search' | 'ai-analyze'>('manual');

  // Concepts et sélection manuelle
  const { concepts, loading: conceptsLoading } = useConcepts();
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);

  // Données IA
  const [aiReverseInput, setAiReverseInput] = useState('');
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Sauvegarde IA
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    sens: '',
    description: '',
    statut: 'PROPOSITION' as 'PROPOSITION' | 'EN_COURS' | 'ADOPTE',
  });

  // Manuelle: champs descriptifs uniquement visibles en Manuel
  const [manualDescription, setManualDescription] = useState('');
  const [manualExamples, setManualExamples] = useState<string[]>([]);

  const { communityComps, loading: compsLoading } = useCompositions();

  // Toggle concept dans la composition en cours
  const toggleConceptInManual = (c: Concept) => {
    setSelectedConcepts((prev) => {
      const found = prev.find((p) => p.id === c.id);
      if (found) return prev.filter((p) => p.id !== c.id);
      if (prev.length >= 4) return prev;
      return [...prev, c];
    });
  };

  // Composition en cours (affichage)
  const compositionChips = useMemo(
    () => selectedConcepts.map((c) => c.mot).join(' + '),
    [selectedConcepts],
  );

  // IA Reverse: saisie et recherche
  const handleAISearch = async () => {
    if (!aiReverseInput.trim()) return;
    setAiLoading(true);
    try {
      const resp = await fetch('/api/search-reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frenchInput: aiReverseInput }),
      });
      const data = await resp.json();
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
    } catch {
      setCompositionResult({
        sens: 'Résultat IA indisponible',
        confidence: 0,
        justification: 'Erreur pendant la reverse IA',
        source: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // IA Analyse: déclenche manuellement
  const handleAnalyzeFromSelection = async () => {
    const composition = compositionChips;
    if (!composition?.trim()) return;

    setAiLoading(true);
    try {
      const resp = await fetch('/api/analyze-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ composition }),
      });
      const data = await resp.json();
      setCompositionResult(data);
    } catch {
      setCompositionResult({
        sens: 'Composition IA',
        confidence: 0,
        justification: `Erreur lors de l'analyse`,
        source: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Sauvegarde: ouverture modal et remplissage automatique
  const openSaveModal = () => {
    if (compositionResult || selectedConcepts.length > 0) {
      setSaveFormData((p) => ({
        ...p,
        sens: compositionResult?.sens ?? '',
        description: compositionResult?.justification ?? '',
      }));
      setShowSaveModal(true);
    }
  };

  // Sauvegarder composition
  const handleSaveComposition = async () => {
    const pattern = selectedConcepts.map((c) => c.id);
    const payload = {
      pattern,
      sens: saveFormData.sens,
      description: saveFormData.description,
      statut: saveFormData.statut,
      source: compositionResult?.source === 'llm' ? 'LLM_SUGGESTED' : 'MANUAL',
      confidenceScore: compositionResult?.confidence ?? 0,
    };
    try {
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
        const err = await resp.json().catch(() => ({} as any));
        alert('Erreur sauvegarde: ' + (err?.error ?? 'Erreur inconnue'));
      }
    } catch {
      alert('Erreur sauvegarde');
    }
  };

  // Créer Composition Manuelle
  const createManualComposition = async () => {
    if (selectedConcepts.length < 2) {
      alert('Sélectionnez au moins 2 concepts pour une composition manuelle.');
      return;
    }
    const pattern = selectedConcepts.map((c) => c.id);
    const payload = {
      pattern,
      sens: `composition manuelle: ${compositionChips}`,
      description: manualDescription,
      examples: manualExamples, // Envoi du tableau d'exemples
      statut: 'PROPOSITION',
      source: 'MANUAL',
      confidenceScore: 0,
    };
    try {
      const resp = await fetch('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        alert('Composition Manuelle créée');
        setSelectedConcepts([]);
        setManualDescription('');
        setManualExamples([]);
      } else {
        const err = await resp.json().catch(() => ({} as any));
        alert('Erreur création: ' + (err?.error ?? 'Erreur inconnue'));
      }
    } catch {
      alert('Erreur réseau lors de la création');
    }
  };

  const handleUsePatternFromComp = useCallback(
    (ids: string[]) => {
      const mapById = new Map<string, Concept>();
      concepts.forEach((cc) => mapById.set(cc.id, cc));
      const toAdd = ids.map((id) => mapById.get(id)).filter(Boolean) as Concept[];
      setSelectedConcepts((prev) => {
        const merged = [...prev];
        toAdd.forEach((cc) => {
          if (!merged.find((x) => x.id === cc.id) && merged.length < 4) merged.push(cc);
        });
        return merged;
      });
    },
    [concepts],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* HEADER avec TABS */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <span className="mr-2 text-2xl sm:text-3xl">🧬</span>
              Atelier de Composition
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="mr-1">🧠</span>
                <span className="font-medium">{concepts.length}</span>
                <span className="hidden sm:inline ml-1">concepts</span>
              </div>
              <div className="flex items-center bg-purple-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="mr-1">📚</span>
                <span className="font-medium">{communityComps.length}</span>
                <span className="hidden sm:inline ml-1">compositions</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4 mb-4">
            <button
              onClick={() => setMode('manual')}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center sm:justify-start space-x-2 font-medium transition-all transform hover:scale-105 ${
                mode === 'manual'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className="text-lg">✋</span>
              <span className="text-sm sm:text-base">Manuel</span>
            </button>
            <button
              onClick={() => setMode('ai-search')}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center sm:justify-start space-x-2 font-medium transition-all transform hover:scale-105 ${
                mode === 'ai-search'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <span className="text-lg">🔍</span>
              <span className="text-sm sm:text-base">Recherche IA</span>
            </button>
            <button
              onClick={() => setMode('ai-analyze')}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center sm:justify-start space-x-2 font-medium transition-all transform hover:scale-105 ${
                mode === 'ai-analyze'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <span className="text-lg">🔬</span>
              <span className="text-sm sm:text-base">Analyse IA</span>
            </button>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl border border-gray-200">
            <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
              {mode === 'manual' &&
                '✨ Sélectionnez des concepts pour créer une composition personnalisée'}
              {mode === 'ai-search' &&
                '🚀 Décrivez un concept en français pour trouver sa composition'}
              {mode === 'ai-analyze' &&
                '🔬 Sélectionnez des concepts puis analysez leur composition'}
            </p>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* COLONNE 1: Concepts disponibles */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ConceptsAvailable concepts={concepts} onSelect={toggleConceptInManual} pageSize={6} />
          </div>

          {/* COLONNE 2: Panneaux actifs + Résultat IA */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-1 lg:order-2">
            {/* Panneau actif selon le mode */}
            <div>
              {mode === 'manual' && (
                <ManualComposer
                  concepts={concepts}
                  selectedConcepts={selectedConcepts}
                  onToggleConcept={toggleConceptInManual}
                  compositionChips={compositionChips}
                  manualDescription={manualDescription}
                  setManualDescription={setManualDescription}
                  manualExamples={manualExamples}
                  setManualExamples={setManualExamples}
                  onCreateManual={createManualComposition}
                  onReset={() => {
                    setSelectedConcepts([]);
                    setManualDescription('');
                    setManualExamples([]);
                  }}
                />
              )}
              {mode === 'ai-search' && (
                <AIReversePanel
                  input={aiReverseInput}
                  onInputChange={setAiReverseInput}
                  onSearch={handleAISearch}
                  loading={aiLoading}
                />
              )}
              {mode === 'ai-analyze' && (
                <AIAnalyzePanel
                  selectedConcepts={selectedConcepts}
                  compositionChips={compositionChips}
                  onAnalyzeFromSelection={handleAnalyzeFromSelection}
                  loading={aiLoading}
                />
              )}
            </div>

            {/* Résultat IA - maintenant dans la même colonne */}
            {compositionResult && (
              <CompositionResultPanel
                compositionResult={compositionResult}
                onClose={() => setCompositionResult(null)}
                onSave={openSaveModal}
              />
            )}
          </div>
        </div>

        {/* COMPOSITIONS RÉCENTES - en bas */}
        <div className="order-3">
          {compsLoading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center">
              <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des compositions...</p>
            </div>
          ) : (
            <CompositionsRecent
              comps={communityComps}
              concepts={concepts}
              onUsePattern={handleUsePatternFromComp}
            />
          )}
        </div>

        {/* Modal Sauvegarde */}
        {showSaveModal && (
          <SaveModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            onSave={handleSaveComposition}
            selectedConcepts={selectedConcepts}
            compositionResult={compositionResult}
            saveFormData={saveFormData}
            setSaveFormData={setSaveFormData}
          />
        )}
      </div>
    </div>
  );
}
