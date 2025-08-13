'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Concept } from '@/interfaces/concept.interface';
import AIReversePanel from '@/app/components/features/composition/AIReversePanel';
import AIAnalyzePanel from '@/app/components/features/composition/AIAnalyzePanel';
import ConceptsAvailable from '@/app/components/features/composition/ConceptsAvailable';
import CompositionsRecent from '@/app/components/features/composition/CompositionsRecent';
import EditCompositionModal from '@/app/components/features/composition/EditCompositionModal';
import DuplicateModal from '@/app/components/features/composition/DuplicateModal';
import { useConcepts } from '@/hooks/useConcepts';
import { useCompositions } from '@/hooks/useCompositions';
import { useAuth, useCompositionPermissions } from '@/hooks/usePermissions';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import ManualComposer from '../components/features/composition/ManualComposer';

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
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id;

  // Usage (SWR) — DOIT dépendre de userId
  const { incrementComposition, refreshUsage, compositionsCreated, swrKey } = useDailyUsage(userId);

  // Permissions -> calcule remaining/limits à partir de compositionsCreated
  const {
    canUseAISearch,
    canUseAIAnalyze,
    canCreate,
    limits,
    remainingCompositions,
    hasReachedCompositionLimit,
  } = useCompositionPermissions(compositionsCreated);

  // Concepts & compositions
  const { concepts, loading: conceptsLoading } = useConcepts();
  const { communityComps, loading: compsLoading, refreshCompositions } = useCompositions();

  // Pattern builder (ordre + répétitions)
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);
  const addConceptToPattern = (c: Concept) => {
    // ➜ autorise les répétitions
    setSelectedConcepts((prev) => (prev.length >= 6 ? prev : [...prev, c]));
  };
  const moveLeft = (index: number) => {
    setSelectedConcepts((prev) => {
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };
  const moveRight = (index: number) => {
    setSelectedConcepts((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  };
  const removeAt = (index: number) => {
    setSelectedConcepts((prev) => prev.filter((_, i) => i !== index));
  };

  const [mode, setMode] = useState<'manual' | 'ai-search' | 'ai-analyze'>('manual');

  // Champs manuels
  const [manualSens, setManualSens] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualExamples, setManualExamples] = useState<string[]>([]);

  // IA
  const [aiReverseInput, setAiReverseInput] = useState('');
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Duplicate + Edit modals
  const [duplicateInfo, setDuplicateInfo] = useState<{ open: boolean; existing?: any }>({
    open: false,
  });
  const [editInfo, setEditInfo] = useState<{ open: boolean; existing?: any }>({ open: false });

  // DEBUG
  console.log('🧪 INTERFACE USER DEBUG:', {
    userId,
    userName: user?.name,
    userRole: user?.role,
    compositionsCreated,
    remainingCompositions,
    maxCompositionsPerDay: limits?.maxCompositionsPerDay,
    swrKey,
  });

  // Helpers
  const compositionChips = useMemo(
    () => selectedConcepts.map((c) => c.mot).join(' + '),
    [selectedConcepts],
  );

  const refreshAfterCreation = async () => {
    setSelectedConcepts([]);
    setManualSens('');
    setManualDescription('');
    setManualExamples([]);

    try {
      await incrementComposition(userId!); // force uid ici
      await refreshUsage();
      await refreshCompositions();
    } catch (error) {
      console.error('❌ Error in refreshAfterCreation:', error);
      alert((error as Error).message);
    }
  };

  // IA reverse
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

  // IA analyse
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

  // Création manuelle — prend le pattern en ordre exact (avec doublons)
  const createManualComposition = async () => {
    if (!userId) return alert('Pas connecté');
    if (selectedConcepts.length < 2) {
      alert('Sélectionnez au moins 2 concepts.');
      return;
    }

    const pattern = selectedConcepts.map((c) => c.id);
    const payload = {
      pattern,
      sens: manualSens,
      description: manualDescription,
      examples: manualExamples,
      statut: 'PROPOSITION' as const,
      source: 'MANUAL' as const,
      confidenceScore: 0,
    };

    try {
      const resp = await fetch('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.status === 409) {
        const body = await resp.json();
        // body.existing.pattern est côté DB -> JSON string ? on sécurise
        const existing = {
          ...body.existing,
          pattern: Array.isArray(body.existing.pattern)
            ? body.existing.pattern
            : JSON.parse(body.existing.pattern),
          examples: body.existing.examples
            ? Array.isArray(body.existing.examples)
              ? body.existing.examples
              : JSON.parse(body.existing.examples)
            : [],
        };
        setDuplicateInfo({ open: true, existing });
        return;
      }

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({} as any));
        alert('Erreur création: ' + (err?.error ?? 'Erreur inconnue'));
        return;
      }

      await refreshAfterCreation();
    } catch (e) {
      console.error('❌ Erreur réseau lors de la création:', e);
      alert('Erreur réseau lors de la création');
    }
  };

  // UI guards auth
  if (authLoading) return <div>Chargement...</div>;
  if (!isAuthenticated || !userId) return <div>Pas connecté</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* DEBUG */}
      <div className="bg-yellow-100 border border-yellow-300 p-4 m-4 rounded text-sm">
        <strong>🧪 DEBUG INFO:</strong>
        <br />
        User: {user?.name} ({userId})<br />
        Role: {user?.role}
        <br />
        Compositions Created (SWR): {compositionsCreated}
        <br />
        Remaining: {remainingCompositions === -1 ? '∞' : String(remainingCompositions)}
        <br />
        Max per day: {limits?.maxCompositionsPerDay}
        <br />
        SWR key: {swrKey || 'null'}
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 sm:p-6 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMode('manual')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'
              }`}
            >
              ✋ Manuel
            </button>

            <button
              onClick={() => setMode('ai-search')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mode === 'ai-search'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              🔍 Recherche IA
            </button>

            <button
              onClick={() => setMode('ai-analyze')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mode === 'ai-analyze'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              🔬 Analyse IA
            </button>
          </div>
        </div>

        {/* LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* COL 1: Concepts disponibles */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ConceptsAvailable concepts={concepts} onSelect={addConceptToPattern} pageSize={6} />
          </div>

          {/* COL 2: Builder + IA */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-1 lg:order-2">
            {/* MODE MANUEL : Pattern Builder + champs */}
            {mode === 'manual' && (
              <ManualComposer
                concepts={concepts}
                selectedConcepts={selectedConcepts}
                onMoveLeft={moveLeft}
                onMoveRight={moveRight}
                onRemoveAt={removeAt}
                compositionChips={compositionChips}
                manualSens={manualSens}
                setManualSens={setManualSens}
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
                disabled={hasReachedCompositionLimit}
                canCreate={canCreate}
              />
            )}

            {/* MODE IA RECHERCHE */}
            {mode === 'ai-search' &&
              (canUseAISearch ? (
                <AIReversePanel
                  input={aiReverseInput}
                  onInputChange={setAiReverseInput}
                  onSearch={handleAISearch}
                  loading={aiLoading}
                />
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Fonctionnalité Premium
                  </h3>
                  <p className="text-gray-600">
                    Les fonctionnalités d'IA sont réservées aux comptes Premium.
                  </p>
                </div>
              ))}

            {/* MODE IA ANALYSE */}
            {mode === 'ai-analyze' &&
              (canUseAIAnalyze ? (
                <AIAnalyzePanel
                  selectedConcepts={selectedConcepts}
                  compositionChips={selectedConcepts.map((c) => c.mot).join(' + ')}
                  onAnalyzeFromSelection={handleAnalyzeFromSelection}
                  loading={aiLoading}
                />
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Fonctionnalité Premium
                  </h3>
                  <p className="text-gray-600">
                    Les fonctionnalités d'IA sont réservées aux comptes Premium.
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* COMPOSITIONS RÉCENTES */}
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
              onUsePattern={(ids: string[]) => {
                // charger ce pattern dans le builder
                const mapById = new Map<string, Concept>();
                concepts.forEach((cc) => mapById.set(cc.id, cc));
                const next = ids.map((id) => mapById.get(id)).filter(Boolean) as Concept[];
                setSelectedConcepts(next);
              }}
            />
          )}
        </div>

        {/* Modals */}
        {duplicateInfo.open && duplicateInfo.existing && (
          <DuplicateModal
            isOpen={duplicateInfo.open}
            existing={duplicateInfo.existing}
            concepts={concepts}
            onClose={() => setDuplicateInfo({ open: false })}
            onEdit={(ex) => {
              setDuplicateInfo({ open: false });
              setEditInfo({ open: true, existing: ex });
            }}
            onUseExisting={(id) => {
              setDuplicateInfo({ open: false });
              // ici tu peux naviguer vers la fiche, ou juste fermer
              // router.push(`/compositions/${id}`) si tu as la page
            }}
          />
        )}

        {editInfo.open && editInfo.existing && (
          <EditCompositionModal
            isOpen={editInfo.open}
            existing={editInfo.existing}
            concepts={concepts}
            onClose={() => setEditInfo({ open: false })}
            onSaved={() => {
              setEditInfo({ open: false });
              refreshCompositions();
            }}
          />
        )}
      </div>
    </div>
  );
}
