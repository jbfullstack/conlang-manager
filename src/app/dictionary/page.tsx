'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { fetch as signedFetch, updateComposition, deleteComposition } from '@/utils/api-client';
import Pagination from '@/app/components/ui/Pagination'; // ⚠️ Remplacer par la version améliorée avec props `compact` et `variant`
import StatusSelect from '@/app/components/features/dictionnary/StatusSelect';

type Scope = 'all' | 'concepts' | 'combinations';
type Lang = 'all' | 'conlang' | 'fr';

type Concept = {
  id: string;
  mot: string;
  definition: string;
  type: string;
  isActive: boolean;
};

type Combination = {
  id: string;
  sens: string;
  description?: string | null;
  statut: string;
  pattern: string[]; // normalisé par l'API
  patternWords?: string[] | null;
  updatedAt: string;
  source?: string | null;
};

export default function DictionaryPage() {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [lang, setLang] = useState<Lang>('all');
  const [status, setStatus] = useState(''); // '' = tous

  // États de pagination séparés
  const [conceptsPage, setConceptsPage] = useState(1);
  const [conceptsPageSize, setConceptsPageSize] = useState(4);
  const [combinationsPage, setCombinationsPage] = useState(1);
  const [combinationsPageSize, setCombinationsPageSize] = useState(4);

  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [counts, setCounts] = useState({ concepts: 0, combinations: 0 });

  // Debounce
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // URL signée pour concepts
  const conceptsQueryUrl = useMemo(() => {
    if (scope === 'combinations') return null;
    const qs = new URLSearchParams();
    qs.set('q', debouncedQ);
    qs.set('scope', 'concepts');
    qs.set('lang', lang);
    qs.set('page', String(conceptsPage));
    qs.set('pageSize', String(conceptsPageSize));
    return `/api/dictionary/search?${qs.toString()}`;
  }, [debouncedQ, lang, conceptsPage, conceptsPageSize, scope]);

  // URL signée pour combinations
  const combinationsQueryUrl = useMemo(() => {
    if (scope === 'concepts') return null;
    const qs = new URLSearchParams();
    qs.set('q', debouncedQ);
    qs.set('scope', 'combinations');
    qs.set('lang', lang);
    if (status) qs.set('status', status);
    qs.set('page', String(combinationsPage));
    qs.set('pageSize', String(combinationsPageSize));
    return `/api/dictionary/search?${qs.toString()}`;
  }, [debouncedQ, lang, status, combinationsPage, combinationsPageSize, scope]);

  const fetchConcepts = useCallback(async () => {
    if (!conceptsQueryUrl) return;
    try {
      const res = await signedFetch(conceptsQueryUrl, 'GET');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setConcepts(data.concepts || []);
      setCounts((prev) => ({ ...prev, concepts: data.counts?.concepts || 0 }));
    } catch (e) {
      console.error('concepts fetch error', e);
      setConcepts([]);
    }
  }, [conceptsQueryUrl]);

  const fetchCombinations = useCallback(async () => {
    if (!combinationsQueryUrl) return;
    try {
      const res = await signedFetch(combinationsQueryUrl, 'GET');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCombinations(data.combinations || []);
      setCounts((prev) => ({ ...prev, combinations: data.counts?.combinations || 0 }));
    } catch (e) {
      console.error('combinations fetch error', e);
      setCombinations([]);
    }
  }, [combinationsQueryUrl]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchConcepts(), fetchCombinations()]);
    } finally {
      setLoading(false);
    }
  }, [fetchConcepts, fetchCombinations]);

  // Reset pagination when filters change
  useEffect(() => {
    setConceptsPage(1);
    setCombinationsPage(1);
  }, [debouncedQ, scope, lang, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions combinations
  const onDeleteCombination = async (id: string) => {
    if (!confirm('Supprimer cette combination ?')) return;
    try {
      await deleteComposition(id); // route existante
      fetchCombinations(); // Refresh seulement les combinations
    } catch (e) {
      console.warn('delete combination failed', e);
    }
  };

  const onChangeStatus = async (id: string, newStatus: string) => {
    try {
      await updateComposition(id, { statut: newStatus });
      fetchCombinations(); // Refresh seulement les combinations
    } catch (e) {
      console.warn('update status failed', e);
    }
  };

  // Modale d'édition
  const [editing, setEditing] = useState<{
    id: string;
    sens: string;
    description?: string | null;
    statut: string;
  } | null>(null);

  const onEditOpen = (cmb: Combination) => {
    setEditing({ id: cmb.id, sens: cmb.sens, description: cmb.description, statut: cmb.statut });
  };
  const onEditSave = async (values: {
    sens: string;
    description?: string | null;
    statut: string;
  }) => {
    if (!editing) return;
    await updateComposition(editing.id, values);
    setEditing(null);
    fetchCombinations(); // Refresh seulement les combinations
  };

  // Calculs de pagination
  const conceptsTotalPages = Math.ceil(counts.concepts / conceptsPageSize);
  const combinationsTotalPages = Math.ceil(counts.combinations / combinationsPageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* ====== HEADER ====== */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <span className="mr-2 text-2xl sm:text-3xl">📚</span>
              Dictionnaire
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="mr-1">🔤</span>
                <span className="font-medium">{counts.concepts}</span>
                <span className="hidden sm:inline ml-1">concepts</span>
              </div>
              <div className="flex items-center bg-purple-50 px-2 sm:px-3 py-1 rounded-full">
                <span className="mr-1">🧩</span>
                <span className="font-medium">{counts.combinations}</span>
                <span className="hidden sm:inline ml-1">compositions</span>
              </div>
              {loading && (
                <div className="flex items-center bg-gray-50 px-2 sm:px-3 py-1 rounded-full">
                  <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-xs">Chargement...</span>
                </div>
              )}
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Barre de recherche */}
              <div className="sm:col-span-2">
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent 
                           transition-all placeholder-gray-500"
                  placeholder="🔍 Rechercher concepts ou compositions..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              {/* Filtre scope */}
              <div>
                <Segmented
                  value={scope}
                  onChange={(v: Scope) => setScope(v)}
                  options={[
                    { value: 'all', label: `Tous (${counts.concepts + counts.combinations})` },
                    { value: 'concepts', label: `Concepts (${counts.concepts})` },
                    { value: 'combinations', label: `Compos (${counts.combinations})` },
                  ]}
                />
              </div>

              {/* Filtre langue */}
              <div>
                <Segmented
                  value={lang}
                  onChange={(v: Lang) => setLang(v)}
                  options={[
                    { value: 'all', label: '🌐 Toutes' },
                    { value: 'conlang', label: '🪄 Conlang' },
                    { value: 'fr', label: '🇫🇷 Français' },
                  ]}
                />
              </div>
            </div>

            {scope === 'combinations' && (
              <div className="mt-3">
                <StatusSelect value={status} onChange={setStatus} />
              </div>
            )}
          </div>
        </div>

        {/* ====== RÉSULTATS ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {(scope === 'all' || scope === 'concepts') && (
            <ResultSection
              title="Concepts"
              emoji="🔤"
              count={counts.concepts}
              loading={loading}
              emptyLabel="Aucun concept trouvé"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mb-6">
                {concepts.map((c) => (
                  <ConceptItem key={c.id} item={c} />
                ))}
              </div>

              {counts.concepts > 0 && (
                <Pagination
                  currentPage={conceptsPage}
                  totalPages={conceptsTotalPages}
                  totalCount={counts.concepts}
                  pageSize={conceptsPageSize}
                  onPageChange={setConceptsPage}
                  onPageSizeChange={(newSize) => {
                    setConceptsPageSize(newSize);
                    setConceptsPage(1); // Reset to page 1 when page size changes
                  }}
                  loading={loading}
                  compact={true}
                  variant="glassmorphic"
                />
              )}
            </ResultSection>
          )}

          {(scope === 'all' || scope === 'combinations') && (
            <ResultSection
              title="Compositions"
              emoji="🧩"
              count={counts.combinations}
              loading={loading}
              emptyLabel="Aucune composition trouvée"
            >
              <div className="space-y-3 mb-6">
                {combinations.map((cmb) => (
                  <CombinationItem
                    key={cmb.id}
                    item={cmb}
                    onDelete={() => onDeleteCombination(cmb.id)}
                    onStatus={(s) => onChangeStatus(cmb.id, s)}
                    onEdit={() => onEditOpen(cmb)}
                  />
                ))}
              </div>

              {counts.combinations > 0 && (
                <Pagination
                  currentPage={combinationsPage}
                  totalPages={combinationsTotalPages}
                  totalCount={counts.combinations}
                  pageSize={combinationsPageSize}
                  onPageChange={setCombinationsPage}
                  onPageSizeChange={(newSize) => {
                    setCombinationsPageSize(newSize);
                    setCombinationsPage(1); // Reset to page 1 when page size changes
                  }}
                  loading={loading}
                  compact={true}
                  variant="glassmorphic"
                />
              )}
            </ResultSection>
          )}
        </div>

        {/* Modale d'édition */}
        <EditCombinationModal
          open={!!editing}
          onClose={() => setEditing(null)}
          initial={{
            sens: editing?.sens || '',
            description: editing?.description || '',
            statut: editing?.statut || 'draft',
          }}
          onSave={onEditSave}
        />
      </div>
    </div>
  );
}

/* ======================= Sous-composants UI alignés ======================= */

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: any) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="w-full">
      <div className="inline-flex w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-1 shadow-sm overflow-hidden">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={clsx(
              'flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all transform text-center',
              value === o.value
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:shadow-sm',
            )}
          >
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  emoji,
  count,
  loading,
  emptyLabel,
  children,
}: {
  title: string;
  emoji?: string;
  count: number;
  loading: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 
                    transition-all hover:shadow-2xl animate-slideInUp"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold flex items-center">
          {emoji && <span className="mr-2 text-xl sm:text-2xl">{emoji}</span>}
          <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
            {title} <span className="text-sm font-normal text-gray-400">({count})</span>
          </span>
        </h2>
        {loading && (
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        )}
      </div>

      <div className="min-h-[200px]">
        {count === 0 && !loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 animate-float">📭</div>
            <div className="text-sm text-gray-500">{emptyLabel}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ConceptItem({ item }: { item: Concept }) {
  return (
    <div
      className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-3 sm:p-4 
                    hover:shadow-lg hover:scale-[1.02] transition-all transform animate-slideInUp"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate mb-1">{item.mot}</div>
          <div className="text-sm text-gray-600 mb-2">{item.definition}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {item.type}
            </span>
            <span
              className={clsx(
                'text-xs px-2 py-1 rounded-full',
                item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600',
              )}
            >
              {item.isActive ? '🟢 Actif' : '⚪ Inactif'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts: Array<{ v: string; label: string; cls: string }> = [
    { v: 'draft', label: '📝', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { v: 'in_progress', label: '🚧', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    { v: 'done', label: '✅', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ];

  return (
    <div className="inline-flex bg-gray-50 rounded-xl p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={clsx(
            'px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all transform',
            value === o.v
              ? clsx('shadow-sm scale-105 border', o.cls)
              : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-sm',
          )}
          title={o.v === 'draft' ? 'Brouillon' : o.v === 'in_progress' ? 'En cours' : 'Terminé'}
        >
          <span className="sm:hidden">{o.label}</span>
          <span className="hidden sm:inline">
            {o.v === 'draft'
              ? '📝 Brouillon'
              : o.v === 'in_progress'
              ? '🚧 En cours'
              : '✅ Terminé'}
          </span>
        </button>
      ))}
    </div>
  );
}

function CombinationItem({
  item,
  onDelete,
  onStatus,
  onEdit,
}: {
  item: Combination;
  onDelete: () => void;
  onStatus: (s: string) => void;
  onEdit: () => void;
}) {
  const Chips = ({
    values,
    title0,
    titleRest,
  }: {
    values: string[];
    title0: string;
    titleRest: string;
  }) => (
    <div className="mt-3 flex flex-wrap gap-1">
      {values.map((v, i) => (
        <span
          key={v + i}
          className={
            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ' +
            (i === 0
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 border border-gray-200')
          }
          title={i === 0 ? title0 : titleRest}
        >
          {v}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-3 sm:p-4 
                    hover:shadow-lg hover:scale-[1.02] transition-all transform animate-slideInUp"
    >
      <div className="flex flex-col gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate mb-1">{item.sens}</div>
          {item.description && <div className="text-sm text-gray-600 mb-2">{item.description}</div>}

          {item.patternWords?.length ? (
            <Chips values={item.patternWords} title0="élément dominant" titleRest="élément" />
          ) : item.pattern?.length ? (
            <Chips values={item.pattern} title0="ID dominant" titleRest="ID" />
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <StatusPill value={item.statut} onChange={onStatus} />
          <div className="flex space-x-2 justify-end">
            <button
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white 
                         hover:from-amber-500 hover:to-orange-500 transition-all transform hover:scale-105 
                         text-xs font-medium shadow-sm"
              onClick={onEdit}
              title="Éditer"
            >
              ✏️
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-rose-400 to-red-400 text-white 
                         hover:from-rose-500 hover:to-red-500 transition-all transform hover:scale-105 
                         text-xs font-medium shadow-sm"
              onClick={onDelete}
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditCombinationModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: { sens: string; description?: string | null; statut: string };
  onSave: (values: { sens: string; description?: string | null; statut: string }) => Promise<void>;
}) {
  const [sens, setSens] = useState(initial.sens);
  const [desc, setDesc] = useState(initial.description || '');
  const [statut, setStatut] = useState(initial.statut);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSens(initial.sens);
      setDesc(initial.description || '');
      setStatut(initial.statut);
    }
  }, [open, initial]);

  if (!open) return null;

  const onSubmit = async () => {
    setSaving(true);
    try {
      await onSave({ sens, description: desc, statut });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ✏️ Éditer la composition
          </h3>
          <button
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sens (français)</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 sm:px-4 py-2 sm:py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              value={sens}
              onChange={(e) => setSens(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 sm:px-4 py-2 sm:py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <StatusSelect value={statut} onChange={setStatut} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-100">
          <button
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-medium order-2 sm:order-1"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white 
                       hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 
                       disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg order-1 sm:order-2"
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>
                Enregistrement...
              </span>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
