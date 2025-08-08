'use client';
import React, { useEffect, useState } from 'react';
import { Concept } from '@/interfaces/concept.interface';

type CompositionResultLike = {
  sens: string;
  confidence?: number;
  justification?: string;
  source?: string;
  examples?: string[];
  pattern?: string[];
  patternWords?: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedConcepts: Concept[];
  compositionResult?: CompositionResultLike | null;
  saveFormData: {
    sens: string;
    description: string;
    statut: 'PROPOSITION' | 'EN_COURS' | 'ADOPTE';
  };
  setSaveFormData: React.Dispatch<
    React.SetStateAction<{
      sens: string;
      description: string;
      statut: 'PROPOSITION' | 'EN_COURS' | 'ADOPTE';
    }>
  >;
};

function modalPrefillFromResult(
  comp: CompositionResultLike | undefined | null,
  saveFormData: any,
  setSaveFormData: any,
) {
  if (!comp) return null;
  return (
    <>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Sens</label>
        <input
          className="w-full border border-gray-300 rounded px-2 py-1"
          value={saveFormData.sens}
          onChange={(e) => setSaveFormData((p: any) => ({ ...p, sens: e.target.value }))}
        />
      </div>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="w-full border border-gray-300 rounded px-2 py-1"
          value={saveFormData.description}
          onChange={(e) => setSaveFormData((p: any) => ({ ...p, description: e.target.value }))}
        />
      </div>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Statut</label>
        <select
          className="w-full border border-gray-300 rounded px-2 py-1"
          value={saveFormData.statut}
          onChange={(e) => setSaveFormData((p: any) => ({ ...p, statut: e.target.value as any }))}
        >
          <option value="PROPOSITION">Proposition</option>
          <option value="EN_COURS">En cours</option>
          <option value="ADOPTE">Adopté</option>
        </select>
      </div>
    </>
  );
}

export default function SaveModal({
  isOpen,
  onClose,
  onSave,
  selectedConcepts,
  compositionResult,
  saveFormData,
  setSaveFormData,
}: Props) {
  if (!isOpen) return null;

  // Bouton Sauvegarder déclè en dehors via onSave; ici on affiche la modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-3">Sauvegarder la Composition</h3>

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

          {compositionResult &&
            modalPrefillFromResult(compositionResult as any, saveFormData, setSaveFormData)}

          <div>
            <label className="block text-sm font-medium mb-1">Sens</label>
            <input
              className="w-full border border-gray-300 rounded px-2 py-1"
              value={saveFormData.sens}
              onChange={(e) => setSaveFormData((p) => ({ ...p, sens: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-2 py-1"
              value={saveFormData.description}
              onChange={(e) => setSaveFormData((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1"
              value={saveFormData.statut}
              onChange={(e) => setSaveFormData((p) => ({ ...p, statut: e.target.value as any }))}
            >
              <option value="PROPOSITION">Proposition</option>
              <option value="EN_COURS">En cours</option>
              <option value="ADOPTE">Adopté</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={onClose}>
            Annuler
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={onSave}
            // Le disablement est géré par le parent avec isSavable si nécessaire
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
