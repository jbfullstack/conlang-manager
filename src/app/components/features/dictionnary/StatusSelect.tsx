'use client';
import React from 'react';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function StatusSelect({ value, onChange }: Props) {
  const options = ['', 'draft', 'in_progress', 'done'];
  return (
    <select
      className="w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-xs sm:text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">🏷️ Tous les statuts</option>
      <option value="draft">📝 Brouillon</option>
      <option value="in_progress">🚧 En cours</option>
      <option value="done">✅ Terminé</option>
    </select>
  );
}
