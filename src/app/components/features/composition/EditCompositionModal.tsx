'use client';
import React, { useMemo, useState } from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  isOpen: boolean;
  existing: {
    id: string;
    pattern: string[];
    sens?: string | null;
    description?: string | null;
    statut?: 'PROPOSITION' | 'EN_COURS' | 'ADOPTE' | 'REFUSE' | 'DESUET' | null;
    examples?: string[] | null;
  };
  concepts: Concept[];
  onClose: () => void;
  onSaved?: (updated: any) => void;
};

export default function EditCompositionModal({
  isOpen,
  existing,
  concepts,
  onClose,
  onSaved,
}: Props) {
  const [sens, setSens] = useState(existing.sens ?? '');
  const [description, setDescription] = useState(existing.description ?? '');
  const [statut, setStatut] = useState(existing.statut ?? 'PROPOSITION');
  const [examplesText, setExamplesText] = useState((existing.examples ?? []).join('\n'));
  const [saving, setSaving] = useState(false);

  const byId = useMemo(() => {
    const m = new Map<string, Concept>();
    concepts.forEach((c) => m.set(c.id, c));
    return m;
  }, [concepts]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        sens,
        description,
        statut,
        examples: examplesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const resp = await fetch(`/api/compositions/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.status === 409) {
        alert('Conflit: une autre composition porte déjà ce pattern.');
        setSaving(false);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const updated = await resp.json();
      onSaved?.(updated);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="p-5 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Éditer la composition</h3>
          <p className="text-sm text-gray-600 mt-1">Pattern (ordre exact) :</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {existing.pattern.map((id, i) => {
              const c = byId.get(id);
              return (
                <span
                  key={`${id}-${i}`}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm"
                  title={c ? `${c.mot} (${id})` : id}
                >
                  {c ? c.mot : id}
                </span>
              );
            })}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500">Sens</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={sens}
              onChange={(e) => setSens(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Description</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              value={description}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Statut</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={statut ?? 'PROPOSITION'}
                onChange={(e) => setStatut(e.target.value as any)}
              >
                <option value="PROPOSITION">PROPOSITION</option>
                <option value="EN_COURS">EN_COURS</option>
                <option value="ADOPTE">ADOPTE</option>
                <option value="REFUSE">REFUSE</option>
                <option value="DESUET">DESUET</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Exemples (1 par ligne)</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                value={examplesText}
                rows={4}
                onChange={(e) => setExamplesText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 sm:p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
