// src/app/compositions/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
// import { Concept } from '@/interfaces/concept.interface';
import { fetch as signedFetch } from '@/utils/api-client';

import ConceptsAvailable from '@/app/components/features/composition/ConceptsAvailable';
import CompositionsRecent from '@/app/components/features/composition/CompositionsRecent';

import ManualComposer from '@/app/components/features/composition/ManualComposer';
import AIReversePanel from '@/app/components/features/composition/AIReversePanel';
import AIAnalyzePanel from '@/app/components/features/composition/AIAnalyzePanel';
import CompositionResultPanel from '@/app/components/features/composition/CompositionResultPanel';
import SaveModal from '@/app/components/features/composition/SaveModal';

import DuplicateModal from '@/app/components/features/composition/DuplicateModal';
import EditCompositionModal from '@/app/components/features/composition/EditCompositionModal';

import { useConcepts } from '@/hooks/useConcepts';
import { useCompositions } from '@/hooks/useCompositions';
import { useCompositionPermissions } from '@/hooks/usePermissions';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import { useAuth } from '@/hooks/useDevAuth';
import {
  fetchPostAnalyzeComposition,
  fetchPostCompositions,
  fetchPostSearchReverse,
} from '@/utils/api-client';
import { Concept } from '@/interfaces/concept.interface';

function hasDevCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('x-dev-username=');
}

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
  // --- Auth & permissions
  const { user, isAuthenticated } = useAuth();
  const { incrementComposition, refreshUsage, swrKey } = useDailyUsage();
  const { compositionsCreated, isLoading } = useDailyUsage(user?.id);
  const {
    canUseAISearch,
    canUseAIAnalyze,
    canCreate,
    limits,
    remainingCompositions,
    hasReachedCompositionLimit,
  } = useCompositionPermissions();

  // --- Data
  const { concepts } = useConcepts();
  const {
    compositions,
    loading: isCompositionLoading,
    reload: refreshCompositions,
  } = useCompositions();

  // --- Onglets
  const [mode, setMode] = useState<'manual' | 'ai-search' | 'ai-analyze'>('manual');

  const nbConceptMaxForOneSingleComposition = 12;

  // --- Pattern (ordre & répétitions)
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);
  const addConceptToPattern = (c: Concept) =>
    setSelectedConcepts((prev) =>
      prev.length >= nbConceptMaxForOneSingleComposition ? prev : [...prev, c],
    );
  const moveLeft = (i: number) =>
    setSelectedConcepts((prev) => {
      if (i <= 0) return prev;
      const n = [...prev];
      [n[i - 1], n[i]] = [n[i], n[i - 1]];
      return n;
    });
  const moveRight = (i: number) =>
    setSelectedConcepts((prev) => {
      if (i >= prev.length - 1) return prev;
      const n = [...prev];
      [n[i + 1], n[i]] = [n[i], n[i + 1]];
      return n;
    });
  const removeAt = (i: number) => setSelectedConcepts((prev) => prev.filter((_, k) => k !== i));

  const handleUsePatternFromComp = useCallback(
    (ids: string[]) => {
      const mapById = new Map<string, Concept>();
      concepts.forEach((cc) => mapById.set(cc.id, cc));
      const toAdd = ids.map((id) => mapById.get(id)).filter(Boolean) as Concept[];
      setSelectedConcepts(toAdd);
    },
    [concepts],
  );

  const compositionChips = useMemo(
    () => selectedConcepts.map((c) => c.mot).join(' + '),
    [selectedConcepts],
  );

  // --- Champs manuels
  const [manualSens, setManualSens] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualExamples, setManualExamples] = useState<string[]>([]);

  // --- IA
  const [aiReverseInput, setAiReverseInput] = useState('');
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // --- Save modal (IA)
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    sens: '',
    description: '',
    statut: 'PROPOSITION' as 'PROPOSITION' | 'EN_COURS' | 'ADOPTE',
  });

  // --- Doublon / Edition modales
  const [duplicateInfo, setDuplicateInfo] = useState<{ open: boolean; existing?: any }>({
    open: false,
  });
  const [editInfo, setEditInfo] = useState<{ open: boolean; existing?: any }>({ open: false });

  // --- Actions IA
  const handleAISearch = async () => {
    if (!aiReverseInput.trim()) return;
    setAiLoading(true);
    try {
      const resp = await fetchPostSearchReverse({ frenchInput: aiReverseInput });
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

  const handleAnalyzeFromSelection = async () => {
    const composition = compositionChips;
    if (!composition?.trim()) return;

    setAiLoading(true);
    try {
      const resp = await fetchPostAnalyzeComposition({ composition });
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

  const openSaveModal = () => {
    if (compositionResult || selectedConcepts.length > 0) {
      setSaveFormData((p) => ({
        ...p,
        sens: aiReverseInput?.trim() || compositionResult?.sens || '',
        description: compositionResult?.justification ?? '',
      }));
      setShowSaveModal(true);
    }
  };

  const refreshAfterCreation = async () => {
    try {
      if (!user?.id) {
        console.warn(
          'refreshAfterCreation: userId indisponible (dev auth), on rafraîchit juste la liste.',
        );
        await refreshCompositions();
        return;
      }
      await incrementComposition(user.id);
      await refreshUsage();
      await refreshCompositions();
    } catch (e) {
      console.error(e);
    }
  };

  const createManualComposition = async () => {
    if (selectedConcepts.length < 2) {
      alert('Sélectionnez au moins 2 concepts pour une composition manuelle.');
      return;
    }
    const pattern = selectedConcepts.map((c) => c.id);
    const payload = {
      pattern,
      sens: manualSens,
      description: manualDescription,
      examples: manualExamples,
      statut: 'PROPOSITION',
      source: 'MANUAL',
      confidenceScore: 0,
    };

    try {
      const resp = await fetchPostCompositions(payload);
      if (resp.status === 409) {
        const body = await resp.json();
        const existing = body.existing || body;
        const normalized = {
          ...existing,
          pattern: Array.isArray(existing.pattern)
            ? existing.pattern
            : JSON.parse(existing.pattern || '[]'),
          examples: !existing.examples
            ? []
            : Array.isArray(existing.examples)
              ? existing.examples
              : JSON.parse(existing.examples || '[]'),
        };
        setDuplicateInfo({ open: true, existing: normalized });
        return;
      }

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}) as any);
        alert('Erreur création: ' + (err?.error ?? 'Erreur inconnue'));
        return;
      }

      setSelectedConcepts([]);
      setManualSens('');
      setManualDescription('');
      setManualExamples([]);
      await refreshAfterCreation();
    } catch (error) {
      console.error('❌ Erreur réseau lors de la création:', error);
      alert('Erreur réseau lors de la création');
    }
  };

  const selectedConceptsForModal = useMemo(() => {
    if (compositionResult?.pattern?.length) {
      const byId = new Map(concepts.map((c) => [c.id, c]));
      return compositionResult.pattern.map((id) => byId.get(id)).filter(Boolean) as Concept[];
    }
    if (compositionResult?.patternWords?.length) {
      const byMot = new Map(concepts.map((c) => [c.mot.toLowerCase(), c]));
      const mapped = compositionResult.patternWords
        .map((w) => byMot.get((w || '').toLowerCase()))
        .filter(Boolean) as Concept[];
      if (mapped.length >= 2) return mapped;
    }
    return selectedConcepts;
  }, [compositionResult, concepts, selectedConcepts]);

  const handleSaveComposition = async () => {
    let finalPattern: string[] | undefined =
      compositionResult?.pattern && compositionResult.pattern.length > 0
        ? compositionResult.pattern
        : undefined;

    if (!finalPattern && compositionResult?.patternWords?.length) {
      const idByMot = new Map(concepts.map((c) => [c.mot.toLowerCase(), c.id]));
      const mapped = compositionResult.patternWords
        .map((w) => idByMot.get((w || '').toLowerCase()))
        .filter(Boolean) as string[];
      if (mapped.length >= 2) finalPattern = mapped;
    }
    if (!finalPattern) finalPattern = selectedConcepts.map((c) => c.id);

    const payload = {
      pattern: finalPattern,
      sens: saveFormData.sens,
      description: saveFormData.description,
      statut: saveFormData.statut,
      source: compositionResult?.source === 'llm' ? 'LLM_SUGGESTED' : 'MANUAL',
      confidenceScore: compositionResult?.confidence ?? 0,
    };
    try {
      const resp = await signedFetch('/api/compositions', 'POST', payload);
      if (resp.status === 409) {
        const body = await resp.json();
        const existing = body.existing || body;
        const normalized = {
          ...existing,
          pattern: Array.isArray(existing.pattern)
            ? existing.pattern
            : JSON.parse(existing.pattern || '[]'),
          examples: !existing.examples
            ? []
            : Array.isArray(existing.examples)
              ? existing.examples
              : JSON.parse(existing.examples || '[]'),
        };
        setDuplicateInfo({ open: true, existing: normalized });
        return;
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}) as any);
        alert('Erreur sauvegarde: ' + (err?.error ?? 'Erreur inconnue'));
        return;
      }
      await refreshAfterCreation();
      setShowSaveModal(false);
    } catch {
      alert('Erreur sauvegarde');
    }
  };

  if (isLoading) return <div>Chargement...</div>;
  const isAuthDevAware = useMemo(() => isAuthenticated || hasDevCookie(), [isAuthenticated]);

  if (isLoading) return <div>Chargement…</div>;

  // ⬇️ remplace ton ancien guard par celui-ci
  if (!isAuthDevAware) {
    return <div>Pas connecté (dev)</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* DEBUG */}
      <div className="bg-yellow-100 border border-yellow-300 p-4 m-4 rounded text-sm">
        <strong>🧪 DEBUG INFO:</strong>
        <br />
        User: {user?.name} ({user?.id})<br />
        Role: {user?.role}
        <br />
        Compositions Created (SWR): {compositionsCreated ?? 0}
        <br />
        Remaining (SWR + limits): {remainingCompositions ?? '-'}
        <br />
        Max per day: {limits?.maxCompositionsPerDay ?? '-'}
        <br />
        SWR key: {swrKey || '-'}
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* ====== HEADER ====== */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <span className="mr-2 text-2xl sm:text-3xl">🧬</span>
              Atelier de Composition
            </h1>

            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="mr-1">🧠</span>
                <span className="font-medium">{concepts?.length ?? 0}</span>
                <span className="hidden sm:inline ml-1">concepts</span>
              </div>
              <div className="flex items-center bg-purple-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="mr-1">📚</span>
                <span className="font-medium">{compositions?.length ?? 0}</span>
                <span className="hidden sm:inline ml-1">compositions</span>
              </div>
              {isLoading ? (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-gray-100 text-gray-500">
                  chargement…
                </span>
              ) : (
                limits && (
                  <div className="flex items-center bg-orange-50 px-2 sm:px-3 py-1 rounded-full">
                    <span className="mr-1">⚡</span>
                    <span className="font-medium">
                      {remainingCompositions === -1 ? '∞' : String(remainingCompositions)}
                    </span>
                    <span className="hidden sm:inline ml-1">restantes</span>
                  </div>
                )
              )}
              <div className="flex items-center bg-purple-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="font-medium">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Onglets */}
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

            {canUseAISearch ? (
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
            ) : (
              <div className="relative group">
                <button
                  disabled
                  className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-XL flex items-center justify-center sm:justify-start space-x-2 font-medium bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                >
                  <span className="text-lg">🔍</span>
                  <span className="text-sm sm:text-base">Recherche IA</span>
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full ml-2">
                    PRO
                  </span>
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none">
                  Réservé aux comptes Premium
                </div>
              </div>
            )}

            {canUseAIAnalyze ? (
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
            ) : (
              <div className="relative group">
                <button
                  disabled
                  className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center sm:justify-start space-x-2 font-medium bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                >
                  <span className="text-lg">🔬</span>
                  <span className="text-sm sm:text-base">Analyse IA</span>
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full ml-2">
                    PRO
                  </span>
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none">
                  Réservé aux comptes Premium
                </div>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl border border-gray-200">
            {hasReachedCompositionLimit ? (
              <div className="text-center">
                <p className="text-orange-600 text-sm sm:text-base font-medium mb-2">
                  🚨 Limite quotidienne atteinte !
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Vous avez créé le maximum de compositions autorisées aujourd'hui.
                  {user?.role === 'USER' && ' Passez Premium pour débloquer plus de créations !'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-0">
                  {mode === 'manual' &&
                    '✨ Sélectionnez des concepts pour créer une composition personnalisée'}
                  {mode === 'ai-search' &&
                    '🚀 Décrivez un concept en français pour trouver sa composition'}
                  {mode === 'ai-analyze' &&
                    '🔬 Sélectionnez des concepts puis analysez leur composition'}
                </p>
                {limits && limits.maxCompositionsPerDay > 0 && (
                  <div className="text-xs sm:text-sm text-gray-500 flex items-center space-x-2">
                    <span>📊</span>
                    <span>
                      {String(remainingCompositions)} composition
                      {remainingCompositions !== 1 ? 's' : ''} restante
                      {remainingCompositions !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ConceptsAvailable concepts={concepts} onSelect={addConceptToPattern} pageSize={6} />
          </div>

          <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-1 lg:order-2">
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
                  setManualSens('');
                  setManualDescription('');
                  setManualExamples([]);
                }}
                disabled={hasReachedCompositionLimit}
                canCreate={canCreate}
              />
            )}

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
                  <p className="text-gray-600 mb-4">
                    Les fonctionnalités d'IA sont réservées aux comptes Premium.
                  </p>
                </div>
              ))}

            {mode === 'ai-analyze' &&
              (canUseAIAnalyze ? (
                <AIAnalyzePanel
                  selectedConcepts={selectedConcepts}
                  compositionChips={compositionChips}
                  onAnalyzeFromSelection={handleAnalyzeFromSelection}
                  loading={aiLoading}
                  onMoveLeft={moveLeft}
                  onMoveRight={moveRight}
                  onRemoveAt={removeAt}
                />
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Fonctionnalité Premium
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Les fonctionnalités d'IA sont réservées aux comptes Premium.
                  </p>
                </div>
              ))}

            {compositionResult && (
              <CompositionResultPanel
                compositionResult={compositionResult}
                onClose={() => setCompositionResult(null)}
                onSave={canCreate && !hasReachedCompositionLimit ? openSaveModal : undefined}
                disabled={!canCreate || hasReachedCompositionLimit}
                disabledMessage={
                  hasReachedCompositionLimit
                    ? 'Limite quotidienne atteinte'
                    : 'Permission insuffisante'
                }
              />
            )}
          </div>
        </div>

        <div className="order-3">
          {isCompositionLoading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center">
              <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des compositions...</p>
            </div>
          ) : (
            <CompositionsRecent
              comps={compositions}
              concepts={concepts}
              onUsePattern={handleUsePatternFromComp}
            />
          )}
        </div>

        {showSaveModal && canCreate && (
          <SaveModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            onSave={handleSaveComposition}
            selectedConcepts={selectedConceptsForModal}
            compositionResult={compositionResult}
            saveFormData={saveFormData}
            setSaveFormData={setSaveFormData}
          />
        )}

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
