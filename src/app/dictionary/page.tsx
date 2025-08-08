'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Pagination from '../components/ui/Pagination';

type ConceptDictItem = {
  id: string;
  type: 'concept';
  label: string;
  description?: string;
  extra?: any;
};

type CombinationDictItem = {
  id: string;
  type: 'combination';
  label: string;
  description?: string;
  pattern?: string[];
  extra?: any;
};

type DictResponseConcepts = {
  items: ConceptDictItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type DictResponseCombs = {
  items: CombinationDictItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type DictionaryResponse = {
  concepts?: DictResponseConcepts;
  combinations?: DictResponseCombs;
};

export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [conceptPage, setConceptPage] = useState(1);
  const [conceptPageSize, setConceptPageSize] = useState(6);
  const [combPage, setCombPage] = useState(1);
  const [combPageSize, setCombPageSize] = useState(6);

  const [data, setData] = useState<DictionaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dictionary (concepts + combinaisons)
  const fetchDictionary = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        `/api/dictionary?` +
        ` q=${encodeURIComponent(query)}` +
        `&conceptPage=${conceptPage}&conceptPageSize=${conceptPageSize}` +
        `&comboPage=${combPage}&comboPageSize=${combPageSize}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erreur réseau');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDictionary();
  }, [query, conceptPage, conceptPageSize, combPage, combPageSize]);

  const concepts = data?.concepts?.items ?? [];
  const combs = data?.combinations?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dictionnaire</h1>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // reset pages pour la nouvelle recherche
            setConceptPage(1);
            setCombPage(1);
          }}
          placeholder="Rechercher: mot, définition, propriété..."
          className="w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      {error && <div className="mb-4 text-red-700">{error}</div>}

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Concepts</h2>
        {concepts.length === 0 && (
          <div className="text-sm text-gray-600">Aucun concept correspondant.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {concepts.map((c) => (
            <div key={c.id} className="border rounded p-3 bg-white">
              <div className="font-semibold text-gray-800">{c.label}</div>
              {c.description && <div className="text-sm text-gray-600">{c.description}</div>}
              <div className="text-xs text-gray-500 mt-1">Type: {c.type}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between items-center">
          <Pagination
            currentPage={conceptPage}
            totalPages={data?.concepts?.pagination.totalPages ?? 1}
            totalCount={data?.concepts?.pagination.totalCount ?? 0}
            pageSize={conceptPageSize}
            onPageChange={setConceptPage}
            onPageSizeChange={setConceptPageSize}
            loading={loading}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Combinaisons</h2>
        {combs.length === 0 && (
          <div className="text-sm text-gray-600">Aucune combinaison correspondante.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combs.map((cb) => (
            <div key={cb.id} className="border rounded p-3 bg-white">
              <div className="font-semibold text-gray-800">
                {cb.label || cb.pattern?.join(' + ')}
              </div>
              {cb.description && <div className="text-sm text-gray-600">{cb.description}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Pattern: {cb.pattern?.join(' + ') ?? ''}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between items-center">
          <Pagination
            currentPage={combPage}
            totalPages={data?.combinations?.pagination.totalPages ?? 1}
            totalCount={data?.combinations?.pagination.totalCount ?? 0}
            pageSize={combPageSize}
            onPageChange={setCombPage}
            onPageSizeChange={setCombPageSize}
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}
