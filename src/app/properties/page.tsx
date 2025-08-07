'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import PropertyCard from '../components/features/properties/PropertyCard';
import PropertyForm from '../components/features/properties/PropertyForm';
import PropertySearchAndFilter from '../components/features/properties/PropertySearchAndFilter';
import Pagination from '../components/ui/Pagination';
import { Property } from '@/interfaces/property.interface';
import { usePagination } from '@/hooks/usePagination';

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // ✅ Utiliser le hook usePagination corrigé
  const pagination = usePagination({
    defaultPageSize: 12,
    defaultPage: 1,
  });

  // Filtres de recherche
  const [searchFilters, setSearchFilters] = useState({
    searchTerm: '',
    categoryFilter: 'all',
    activeFilter: 'all',
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

  // Catégories pour les filtres
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // ✅ FIX: Fonction de fetch SANS dépendance sur pagination
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        pageSize: pagination.pageSize.toString(),
        include: 'concepts',
        active: 'false',
      });

      if (searchFilters.searchTerm.trim()) {
        params.set('search', searchFilters.searchTerm.trim());
      }
      if (searchFilters.categoryFilter !== 'all') {
        params.set('category', searchFilters.categoryFilter);
      }
      if (searchFilters.activeFilter !== 'all') {
        params.set('status', searchFilters.activeFilter);
      }

      const url = `/api/properties?${params.toString()}`;
      console.log('🔄 Fetching properties from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des propriétés');
      }

      const data = await response.json();

      setProperties(data.properties || []);
      setServerPagination({
        page: data.pagination.page,
        pageSize: data.pagination.pageSize,
        totalCount: data.pagination.totalCount,
        totalPages: data.pagination.totalPages,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev,
      });
    } catch (err) {
      console.error('❌ Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProperties([]);
      setServerPagination((prev) => ({ ...prev, totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [searchFilters, pagination.currentPage, pagination.pageSize]);

  // Charger les catégories disponibles (une seule fois)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/properties/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories || []);
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
    }
  }, []);

  // ✅ FIX: Effet pour les catégories (UNE SEULE FOIS au montage)
  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ FIX: Effet pour le fetch des données (SEULEMENT quand nécessaire)
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ✅ FIX: Handler pour la recherche
  const handleSearch = useCallback(
    (searchTerm: string, categoryFilter: string, activeFilter: string) => {
      console.log('🔍 Search triggered:', { searchTerm, categoryFilter, activeFilter });

      const newFilters = { searchTerm, categoryFilter, activeFilter };
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

  // Actions des propriétés
  const handleCreateProperty = () => {
    setEditingProperty(null);
    setIsFormOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsFormOpen(true);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      await fetchProperties();
    } catch (err) {
      alert(
        'Erreur lors de la suppression: ' +
          (err instanceof Error ? err.message : 'Erreur inconnue'),
      );
    }
  };

  const handleFormSubmit = async (propertyData: any) => {
    try {
      const url = editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      setIsFormOpen(false);
      setEditingProperty(null);

      await fetchProperties();
      await fetchCategories();
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProperty(null);
  };

  // Loading state
  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des propriétés...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchProperties()}
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
              <h1 className="text-3xl font-bold text-gray-900">Propriétés Linguistiques</h1>
              <p className="text-gray-600 mt-2">
                Gérez vos propriétés et catégories • {serverPagination.totalCount} propriété
                {serverPagination.totalCount !== 1 ? 's' : ''} au total • Page{' '}
                {pagination.currentPage} sur {serverPagination.totalPages}
              </p>
            </div>
            <button
              onClick={handleCreateProperty}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Nouvelle Propriété</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <PropertySearchAndFilter
          onSearch={handleSearch}
          categories={availableCategories}
          totalCount={serverPagination.totalCount}
          filteredCount={serverPagination.totalCount}
          loading={loading}
        />

        {/* Properties Grid */}
        {properties.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏷️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune propriété trouvée</h3>
            <p className="text-gray-600">
              {serverPagination.totalCount === 0
                ? 'Créez votre première propriété pour commencer'
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
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onEdit={() => handleEditProperty(property)}
                    onDelete={() => handleDeleteProperty(property.id)}
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
          <PropertyForm
            property={editingProperty}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </div>
    </div>
  );
}
