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

// Version unifiée : menu en haut (Manuel / reverse IA / IA Analyse)
// et affichage conditionnel des 3 panneaux, avec partage de la sélection de concepts
export default function CompositionPage() {
  // Mode actif
  const [mode, setMode] = useState<'manual' | 'ai-search' | 'ai-analyze'>('manual');

  // Concepts et sélection manuelle
  const { concepts, loading: conceptsLoading } = useConcepts();
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);

  // Données IA
  const [aiReverseInput, setAiReverseInput] = useState(''); // pour IA Reverse Recherche
  const [aiAnalyzeInput, setAiAnalyzeInput] = useState(''); // pour IA Analyse
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
  const [manualExamples, setManualExamples] = useState<string>('');

  // UI: affichage des comps communautaires et concepts dispo sous Résultat IA
  // Utilisation du hook utilisé dans ta base
  const { communityComps, loading: compsLoading } = useCompositions();

  // Toggle concept dans la composition en cours (manuel et IA analyse)
  const toggleConceptInManual = (c: Concept) => {
    setSelectedConcepts((prev) => {
      const found = prev.find((p) => p.id === c.id);
      if (found) return prev.filter((p) => p.id !== c.id);
      if (prev.length >= 4) return prev;
      return [...prev, c];
    });
  };

  // Patch: si on clique sur une carte, on l'ajoute pour Manuel et IA Analyse aussi
  // (l'array selectedConcepts est partagé)

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

  // IA Analyse: déclenche via sélection (plus d'input)
  const handleAnalyzeFromSelection = async (composition: string) => {
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
        justification: 'Erreur lors de l’analyse',
        source: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Sauvegarde: ouverture modal et remplissage automatique
  const openSaveModal = () => {
    if (compositionResult || selectedConcepts.length > 0) {
      // préremplir le sens avec le résultat IA si dispo
      setSaveFormData((p) => ({
        ...p,
        sens: compositionResult?.sens ?? p.sens ?? '',
        description: compositionResult?.justification ?? p.description ?? '',
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

  // State utile
  const isSavable = useMemo(() => {
    const hasManual = (saveFormData.sens ?? '').trim().length > 0;
    const hasIA = (compositionResult?.sens ?? '').trim().length > 0;
    return hasManual || hasIA || selectedConcepts.length > 0;
  }, [saveFormData.sens, compositionResult?.sens, selectedConcepts.length]);

  // Créer Composition Manuelle (via l’API)
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
        // Reset manuel
        setSelectedConcepts([]);
        setManualDescription('');
        setManualExamples('');
        // Rafraîchir les listes via hook
        // Si ton hook expose refresh, appelle-le ; sinon laisse le hook faire son fetch initial
        // Ici on ne fait pas de fetch manuel additionnel pour rester cohérent
      } else {
        const err = await resp.json().catch(() => ({} as any));
        alert('Erreur création: ' + (err?.error ?? 'Erreur inconnue'));
      }
    } catch {
      alert('Erreur réseau lors de la création');
    }
  };

  // UI: layout
  const leftConcepts = (
    <ConceptsAvailable concepts={concepts} onSelect={toggleConceptInManual} pageSize={9} />
  );

  // Compositions communautaires récentes affichées en grille via CompositionsRecent
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

  const availableSections = (
    <CompositionsRecent
      comps={communityComps}
      concepts={concepts}
      onUsePattern={handleUsePatternFromComp}
    />
  );

  // UI général
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* TABS: Manuel / reverse IA / IA Analyse */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Atelier de Composition</h1>
          <div className="flex gap-2">
            <button
              className={
                mode === 'manual'
                  ? 'px-4 py-2 bg-blue-600 text-white rounded'
                  : 'px-4 py-2 border rounded'
              }
              onClick={() => setMode('manual')}
            >
              Manuel
            </button>
            <button
              className={
                mode === 'ai-search'
                  ? 'px-4 py-2 bg-blue-400 text-white rounded'
                  : 'px-4 py-2 border rounded'
              }
              onClick={() => setMode('ai-search')}
            >
              reverse IA
            </button>
            <button
              className={
                mode === 'ai-analyze'
                  ? 'px-4 py-2 bg-green-600 text-white rounded'
                  : 'px-4 py-2 border rounded'
              }
              onClick={() => setMode('ai-analyze')}
            >
              IA Analyse
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          {mode === 'manual' &&
            'Sélectionnez des concepts en cliquant pour composer. Définissez la description et créez la composition manuelle.'}
          {mode === 'ai-search' &&
            'Saisissez un concept pour que l’IA retourne une composition (reverse IA).'}
          {mode === 'ai-analyze' &&
            'Cliquez sur les concepts pour construire la composition à analyser.'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche: Concepts disponibles avec pagination intégrée */}
          {leftConcepts}

          {/* Colonne droite: panneaux actifs selon le mode */}
          <div className="space-y-4">
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
                  setManualExamples('');
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
                // Analyse via sélection
                selectedConcepts={selectedConcepts}
                onAnalyzeFromSelection={handleAnalyzeFromSelection}
                loading={aiLoading}
              />
            )}
          </div>
        </div>

        {/* Résultat IA (centré et adaptable via CompositionResultPanel) */}
        {compositionResult && (
          <CompositionResultPanel
            compositionResult={compositionResult}
            onClose={() => setCompositionResult(null)}
            onSave={openSaveModal}
          />
        )}

        {/* Résultats et sections en dessous (Compositions récentes) */}
        {compsLoading ? <div>Chargement des compositions...</div> : availableSections}
      </div>

      {/* Modal Sauvegarde (pré-rempli) */}
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
  );
}
