'use client';
import React, { useEffect, useState } from 'react';
import Pagination from '@/app/components/ui/Pagination';
import { fetch as signedFetch } from '@/utils/api-client';

type ConceptItem = { id: string; type: string; label: string; description?: string };
type CombinationItem = {
  id: string;
  type: string;
  label: string;
  description?: string;
  pattern?: string[];
};

type DictResponse = {
  concepts?: {
    items: ConceptItem[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  combinations?: {
    items: CombinationItem[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
};

export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [combinations, setCombinations] = useState<CombinationItem[]>([]);
  const [pageC, setPageC] = useState(1);
  const [pageSizeC, setPageSizeC] = useState(6);
  const [pageCo, setPageCo] = useState(1);
  const [pageSizeCo, setPageSizeCo] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDict = async () => {
      setLoading(true);
      try {
        const url = `/api/dictionary?conceptPage=${pageC}&conceptPageSize=${pageSizeC}&comboPage=${pageCo}&comboPageSize=${pageSizeCo}&q=${encodeURIComponent(
          query,
        )}`;
        const res = await fetch(url);
        const data: DictResponse = await res.json();
        setConcepts(data?.concepts?.items ?? []);
        setCombinations(data?.combinations?.items ?? []);
      } catch (e) {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchDict();
  }, [query, pageC, pageSizeC, pageCo, pageSizeCo]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dictionnaire</h1>
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPageC(1);
            setPageCo(1);
          }}
          placeholder="Rechercher mot, définition, propriété..."
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Concepts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {concepts.map((c) => (
            <div key={c.id} className="border rounded p-3 bg-white">
              <div className="font-semibold">{c.label}</div>
              {c.description && <div className="text-sm text-gray-600">{c.description}</div>}
              <div className="text-xs text-gray-500 mt-1">Type: {c.type}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Pagination
            currentPage={pageC}
            totalPages={Math.ceil(concepts.length / pageSizeC) || 1}
            totalCount={concepts.length}
            pageSize={pageSizeC}
            onPageChange={setPageC}
            onPageSizeChange={setPageSizeC}
            loading={loading}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Compositions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinations.map((cb) => (
            <div key={cb.id} className="border rounded p-3 bg-white">
              <div className="font-semibold">{cb.label ?? cb.pattern?.join(' + ') ?? ''}</div>
              {cb.description && <div className="text-sm text-gray-600">{cb.description}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Pattern: {cb.pattern?.join(' + ') ?? ''}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Pagination
            currentPage={pageCo}
            totalPages={Math.ceil(combinations.length / pageSizeCo) || 1}
            totalCount={combinations.length}
            pageSize={pageSizeCo}
            onPageChange={setPageCo}
            onPageSizeChange={setPageSizeCo}
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}
