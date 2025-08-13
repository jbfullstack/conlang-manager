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
import { useAuth, useCompositionPermissions } from '@/hooks/usePermissions';
import { useDailyUsage } from '@/hooks/useDailyUsage';

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

  // ✅ brancher useDailyUsage sur l'id réel
  const { incrementComposition, refreshUsage, compositionsCreated, usage, swrKey } =
    useDailyUsage(userId);

  const {
    canUseAISearch,
    canUseAIAnalyze,
    canCreate,
    limits,
    remainingCompositions,
    hasReachedCompositionLimit,
  } = useCompositionPermissions(compositionsCreated);

  // DEBUG CRITIQUE : Vérifier quel utilisateur est affiché
  console.log('🧪 INTERFACE USER DEBUG:', {
    userId,
    userName: user?.name,
    userRole: user?.role,
    compositionsCreated,
    usage,
    maxCompositionsPerDay: limits?.maxCompositionsPerDay,
    swrKey,
  });

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
  const [manualSens, setManualSens] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualExamples, setManualExamples] = useState<string[]>([]);

  const { communityComps, loading: compsLoading, refreshCompositions } = useCompositions();

  const refreshAfterCreation = async () => {
    setSelectedConcepts([]);
    setManualSens('');
    setManualDescription('');
    setManualExamples([]);

    try {
      // ✅ forcer l’uid ici -> pas de no-op si auth vient juste d’arriver
      await incrementComposition(userId!);
      await refreshUsage();
      await refreshCompositions();
    } catch (error) {
      console.error('❌ Error in refreshAfterCreation:', error);
      alert((error as Error).message);
    }
  };

  // Toggle concept dans la composition en cours
  const toggleConceptInManual = (c: Concept) => {
    setSelectedConcepts((prev) => {
      const found = prev.find((p) => p.id === c.id);
      if (found) return prev.filter((p) => p.id !== c.id);
      if (prev.length >= 4) return prev;
      return [...prev, c];
    });
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

  // CORRECTION: Créer Composition Manuelle avec incrementComposition
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
      console.log('📝 Creating manual composition...');
      const resp = await fetch('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        await refreshAfterCreation();
      } else {
        const err = await resp.json().catch(() => ({} as any));
        alert('Erreur création: ' + (err?.error ?? 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors de la création:', error);
      alert('Erreur réseau lors de la création');
    }
  };

  // FONCTION HANDLESAVECOMPOSITION IDENTIQUE :
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
        await refreshAfterCreation();
      } else {
        const err = await resp.json().catch(() => ({} as any));
        alert('Erreur sauvegarde: ' + (err?.error ?? 'Erreur inconnue'));
      }
    } catch {
      alert('Erreur sauvegarde');
    }
  };

  if (authLoading) return <div>Chargement...</div>;
  if (!isAuthenticated || !userId) return <div>Pas connecté</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Bandeau debug */}
      <div className="bg-yellow-100 border border-yellow-300 p-4 m-4 rounded text-sm">
        <strong>🧪 DEBUG INFO:</strong>
        <br />
        User: {user?.name} ({userId})<br />
        Role: {user?.role}
        <br />
        Compositions Created (SWR): {compositionsCreated}
        <br />
        Remaining (SWR+limits): {remainingCompositions}
        <br />
        Max per day: {limits?.maxCompositionsPerDay}
        <br />
        SWR key: {swrKey || 'null'}
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* HEADER avec TABS sécurisés */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <span className="mr-2 text-2xl sm:text-3xl">🧬</span>
              Atelier de Composition
            </h1>
            <div
              className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600"
              title="Nombre de conceptes total"
            >
              <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="mr-1">🧠</span>
                <span className="font-medium">{concepts.length}</span>
                <span className="hidden sm:inline ml-1">concepts</span>
              </div>
              <div
                className="flex items-center bg-purple-50 px-2 sm:px-3 py-1 rounded-full"
                title="Nombre de compositions total"
              >
                <span className="mr-1">📚</span>
                <span className="font-medium">{communityComps.length}</span>
                <span className="hidden sm:inline ml-1">compositions</span>
              </div>

              {/* Affichage des limites utilisateur */}
              {limits && (
                <div
                  className="flex items-center bg-orange-50 px-2 sm:px-3 py-1 rounded-full"
                  title="Nombre de compositions restantes pour aujourd'hui"
                >
                  <span className="mr-1">⚡</span>
                  <span className="font-medium">
                    {remainingCompositions === -1 ? '∞' : String(remainingCompositions)}
                  </span>
                  <span className="hidden sm:inline ml-1">restantes</span>
                </div>
              )}

              {/* Badge du rôle utilisateur */}
              <div
                className={`flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'ADMIN'
                    ? 'bg-red-100 text-red-800'
                    : user?.role === 'MODERATOR'
                    ? 'bg-green-100 text-green-800'
                    : user?.role === 'PREMIUM'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <span className="mr-1">
                  {user?.role === 'ADMIN'
                    ? '👑'
                    : user?.role === 'MODERATOR'
                    ? '👮'
                    : user?.role === 'PREMIUM'
                    ? '💎'
                    : '👤'}
                </span>
                <span className="font-medium">{user?.role || 'USER'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4 mb-4">
            {/* Mode Manuel - toujours accessible */}
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

            {/* Mode Recherche IA - conditionnel selon permissions */}
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
                  className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center sm:justify-start space-x-2 font-medium bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                >
                  <span className="text-lg">🔍</span>
                  <span className="text-sm sm:text-base">Recherche IA</span>
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full ml-2">
                    PRO
                  </span>
                </button>
                {/* Tooltip d'upgrade */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Réservé aux comptes Premium
                </div>
              </div>
            )}

            {/* Mode Analyse IA - conditionnel selon permissions */}
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
                {/* Tooltip d'upgrade */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Réservé aux comptes Premium
                </div>
              </div>
            )}
          </div>

          {/* Message d'information selon les permissions et les limites */}
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

                {/* Affichage des limites restantes */}
                {limits && limits.maxCompositionsPerDay > 0 && (
                  <div className="text-xs sm:text-sm text-gray-500 flex items-center space-x-2">
                    <span>📊</span>
                    <span>
                      {remainingCompositions} composition{remainingCompositions !== 1 ? 's' : ''}{' '}
                      restante{remainingCompositions !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prompt d'upgrade pour les utilisateurs USER */}
          {user?.role === 'USER' && !canUseAISearch && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-orange-800 mb-1">
                    🚀 Débloquez les fonctionnalités IA !
                  </h4>
                  <p className="text-xs text-orange-700">
                    Passez Premium pour accéder à la recherche et l'analyse par IA, plus de
                    compositions par jour, et plus de concepts par composition.
                  </p>
                </div>
                <button className="ml-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LAYOUT PRINCIPAL - inchangé */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* COLONNE 1: Concepts disponibles */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ConceptsAvailable concepts={concepts} onSelect={toggleConceptInManual} pageSize={6} />
          </div>

          {/* COLONNE 2: Panneaux actifs + Résultat IA */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-1 lg:order-2">
            {/* Panneau actif selon le mode ET les permissions */}
            <div>
              {mode === 'manual' && (
                <ManualComposer
                  concepts={concepts}
                  selectedConcepts={selectedConcepts}
                  onToggleConcept={toggleConceptInManual}
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
                  // Passer les infos de permissions au composant
                  disabled={hasReachedCompositionLimit || !userId}
                  canCreate={canCreate && !!userId}
                />
              )}

              {mode === 'ai-search' && canUseAISearch && (
                <AIReversePanel
                  input={aiReverseInput}
                  onInputChange={setAiReverseInput}
                  onSearch={handleAISearch}
                  loading={aiLoading}
                />
              )}

              {mode === 'ai-analyze' && canUseAIAnalyze && (
                <AIAnalyzePanel
                  selectedConcepts={selectedConcepts}
                  compositionChips={compositionChips}
                  onAnalyzeFromSelection={handleAnalyzeFromSelection}
                  loading={aiLoading}
                />
              )}

              {/* Message si mode IA sélectionné mais pas de permissions */}
              {((mode === 'ai-search' && !canUseAISearch) ||
                (mode === 'ai-analyze' && !canUseAIAnalyze)) && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Fonctionnalité Premium
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Les fonctionnalités d'IA sont réservées aux comptes Premium.
                  </p>
                  <button
                    onClick={() => setMode('manual')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mr-3"
                  >
                    Utiliser le mode manuel
                  </button>
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    Passer Premium
                  </button>
                </div>
              )}
            </div>

            {/* Résultat IA - avec vérification de sauvegarde */}
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

        {/* COMPOSITIONS RÉCENTES - inchangé */}
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

        {/* Modal Sauvegarde - seulement si permissions */}
        {showSaveModal && canCreate && (
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
