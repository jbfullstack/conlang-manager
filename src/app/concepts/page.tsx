'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ConceptCard from '../components/features/concepts/ConceptCard';
import ConceptForm from '../components/features/concepts/ConceptForm';
import ConceptSearchAndFilter from '../components/features/concepts/ConceptSearchAndFilter';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

interface Concept {
  id: string;
  mot: string;
  definition: string;
  type: string;
  proprietes: string[];
  etymologie?: string;
  exemples: string[];
  usageFrequency: number;
  isActive: boolean;
  user?: { username: string };
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);

  // ✅ Utiliser le hook usePagination corrigé
  const pagination = usePagination({
    defaultPageSize: 12,
    defaultPage: 1,
  });

  // Filtres de recherche
  const [searchFilters, setSearchFilters] = useState({
    searchTerm: '',
    typeFilter: 'all',
  });

  // Info de pagination du serveur
  const [serverPagination, setServerPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Types pour les filtres
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // ✅ FIX: Fonction de fetch SANS dépendance sur pagination
  const fetchConcepts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (searchFilters.searchTerm.trim()) {
        params.set('search', searchFilters.searchTerm.trim());
      }
      if (searchFilters.typeFilter !== 'all') {
        params.set('type', searchFilters.typeFilter);
      }

      const url = `/api/concepts?${params.toString()}`;
      console.log('🔄 Fetching concepts from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des concepts');
      }

      const data = await response.json();

      setConcepts(data.concepts || []);
      setServerPagination({
        page: data.pagination.page,
        pageSize: data.pagination.pageSize,
        totalCount: data.pagination.totalCount,
        totalPages: data.pagination.totalPages,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev,
      });
    } catch (err) {
      console.error('❌ Error fetching concepts:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setConcepts([]);
      setServerPagination((prev) => ({ ...prev, totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [searchFilters, pagination.currentPage, pagination.pageSize]);

  // Charger les types disponibles (une seule fois)
  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/concepts/types');
      if (response.ok) {
        const data = await response.json();
        setAvailableTypes(data.types || []);
      }
    } catch (err) {
      console.error('❌ Error fetching types:', err);
    }
  }, []);

  // ✅ FIX: Effet pour les types (UNE SEULE FOIS au montage)
  useEffect(() => {
    fetchTypes();
  }, []);

  // ✅ FIX: Effet pour le fetch des données (SEULEMENT quand nécessaire)
  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  // ✅ FIX: Handler pour la recherche
  const handleSearch = useCallback(
    (searchTerm: string, typeFilter: string) => {
      console.log('🔍 Search triggered:', { searchTerm, typeFilter });

      const newFilters = { searchTerm, typeFilter };
      setSearchFilters(newFilters);
      pagination.resetPagination();
    },
    [pagination],
  );

  // ✅ FIX: Handlers de pagination
  const handlePageChange = useCallback(
    (newPage: number) => {
      console.log('📄 Page change to:', newPage);
      pagination.onPageChange(newPage);
    },
    [pagination],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      console.log('📏 Page size change to:', newPageSize);
      pagination.onPageSizeChange(newPageSize);
    },
    [pagination],
  );

  // Actions des concepts
  const handleCreateConcept = () => {
    setEditingConcept(null);
    setIsFormOpen(true);
  };

  const handleEditConcept = (concept: Concept) => {
    setEditingConcept(concept);
    setIsFormOpen(true);
  };

  const handleDeleteConcept = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce concept ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await fetchConcepts();
    } catch (err) {
      alert(
        'Erreur lors de la suppression: ' +
          (err instanceof Error ? err.message : 'Erreur inconnue'),
      );
    }
  };

  const handleFormSubmit = async (conceptData: any) => {
    try {
      const url = editingConcept ? `/api/concepts/${editingConcept.id}` : '/api/concepts';
      const method = editingConcept ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conceptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      setIsFormOpen(false);
      setEditingConcept(null);
      await fetchConcepts();
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingConcept(null);
  };

  // Loading state
  if (loading && concepts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des concepts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && concepts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchConcepts()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Concepts Primitifs</h1>
              <p className="text-gray-600 mt-2">
                Gérez vos concepts de base • {serverPagination.totalCount} concept
                {serverPagination.totalCount !== 1 ? 's' : ''} au total • Page{' '}
                {pagination.currentPage} sur {serverPagination.totalPages}
              </p>
            </div>
            <button
              onClick={handleCreateConcept}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Nouveau Concept</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <ConceptSearchAndFilter
          onSearch={handleSearch}
          types={availableTypes}
          totalCount={serverPagination.totalCount}
          filteredCount={serverPagination.totalCount}
          loading={loading}
        />

        {/* Concepts Grid */}
        {concepts.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun concept trouvé</h3>
            <p className="text-gray-600">
              {serverPagination.totalCount === 0
                ? 'Créez votre premier concept pour commencer'
                : 'Essayez de modifier vos critères de recherche'}
            </p>
          </div>
        ) : (
          <>
            {/* Loading overlay */}
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {concepts.map((concept) => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    onEdit={() => handleEditConcept(concept)}
                    onDelete={() => handleDeleteConcept(concept.id)}
                  />
                ))}
              </div>
            </div>

            {/* Pagination */}
            {serverPagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={serverPagination.totalPages}
                totalCount={serverPagination.totalCount}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
              />
            )}
          </>
        )}

        {/* Form Modal */}
        {isFormOpen && (
          <ConceptForm
            concept={editingConcept}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </div>
    </div>
  );
}
