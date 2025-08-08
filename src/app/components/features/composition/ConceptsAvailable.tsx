'use client';
import React, { useMemo, useState } from 'react';
import ConceptCard from '@/app/components/features/concepts/ConceptCard';
import { Concept } from '@/interfaces/concept.interface';

type Props = {
  concepts: Concept[];
  onSelect?: (c: Concept) => void;
  pageSize?: number;
};

export default function ConceptsAvailable({ concepts, onSelect, pageSize = 6 }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(concepts.length / pageSize));

  const pagedConcepts = useMemo(
    () => concepts.slice((page - 1) * pageSize, page * pageSize),
    [concepts, page, pageSize],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="border rounded p-4 bg-white">
      <h3 className="font-medium mb-2">Concepts disponibles</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pagedConcepts.map((c) => (
          <ConceptCard
            key={c.id}
            concept={c}
            onEdit={() => {}}
            onDelete={() => {}}
            onSelect={onSelect ? () => onSelect(c) : undefined}
          />
        ))}
      </div>

      {concepts.length > pageSize && (
        <div className="mt-3 flex items-center justify-between">
          <button
            className="px-3 py-1 border rounded"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
          >
            Précédent
          </button>

          <span className="text-sm text-gray-600">
            Page {page} sur {totalPages}
          </span>

          <button
            className="px-3 py-1 border rounded"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!canNext}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
