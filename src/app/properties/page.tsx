'use client';

import { useState, useEffect, useCallback } from 'react';
import PropertyCard from '../components/features/properties/PropertyCard';
import PropertyForm from '../components/features/properties/PropertyForm';
import PropertySearchAndFilter from '../components/features/properties/PropertySearchAndFilter';
import Pagination from '../components/ui/Pagination';

interface Property {
  id: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
  isActive: boolean;
  conceptProperties?: {
    concept: {
      id: string;
      mot: string;
      type: string;
    };
  }[];
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

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Pagination et filtres - état centralisé
  const [searchFilters, setSearchFilters] = useState({
    searchTerm: '',
    categoryFilter: 'all',
    activeFilter: 'all',
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Catégories pour les filtres (chargées séparément)
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Fonction pour construire l'URL de l'API avec tous les paramètres
  const buildApiUrl = useCallback(
    (filters: typeof searchFilters, page: number, pageSize: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        include: 'concepts',
        active: 'false', // Récupérer toutes les propriétés pour la gestion
      });

      if (filters.searchTerm.trim()) {
        params.set('search', filters.searchTerm.trim());
      }
      if (filters.categoryFilter !== 'all') {
        params.set('category', filters.categoryFilter);
      }
      if (filters.activeFilter !== 'all') {
        params.set('status', filters.activeFilter); // active/inactive
      }

      return `/api/properties?${params.toString()}`;
    },
    [],
  );

  // Charger les propriétés avec pagination
  const fetchProperties = useCallback(
    async (filters: typeof searchFilters, page: number, customPageSize?: number) => {
      try {
        setLoading(true);
        setError('');

        const effectivePageSize = customPageSize || pagination.pageSize;
        const url = buildApiUrl(filters, page, effectivePageSize);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des propriétés');
        }

        const data = await response.json();

        setProperties(data.properties || []);
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.pageSize,
          totalCount: data.pagination.totalCount,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setProperties([]);
        setPagination((prev) => ({ ...prev, totalCount: 0, totalPages: 0 }));
      } finally {
        setLoading(false);
      }
    },
    [buildApiUrl],
  );

  // Charger les catégories disponibles (pour les filtres)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/properties/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  }, []);

  // Effet initial : charger les données
  useEffect(() => {
    fetchCategories();
    fetchProperties(searchFilters, 1, 12); // Utiliser pageSize par défaut
  }, []); // Pas de dépendances pour éviter les boucles

  // Handler pour les changements de recherche/filtres
  const handleSearch = useCallback(
    (searchTerm: string, categoryFilter: string, activeFilter: string) => {
      const newFilters = { searchTerm, categoryFilter, activeFilter };
      setSearchFilters(newFilters);
      // Revenir à la page 1 lors d'une nouvelle recherche
      fetchProperties(newFilters, 1);
    },
    [fetchProperties],
  );

  // Handler pour les changements de page
  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchProperties(searchFilters, newPage);
    },
    [fetchProperties, searchFilters],
  );

  // Handler pour changer la taille de page
  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPagination((prev) => ({ ...prev, pageSize: newPageSize }));
      fetchProperties(searchFilters, 1, newPageSize); // Revenir à la page 1 avec nouvelle pageSize
    },
    [fetchProperties, searchFilters],
  );

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

      // Recharger la page actuelle
      fetchProperties(searchFilters, pagination.page);
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

      // Fermer le formulaire et recharger
      setIsFormOpen(false);
      setEditingProperty(null);
      fetchProperties(searchFilters, pagination.page);
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProperty(null);
  };

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

  if (error && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchProperties(searchFilters, pagination.page)}
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
                Gérez vos propriétés et catégories • {pagination.totalCount} propriété
                {pagination.totalCount !== 1 ? 's' : ''} au total • Page {pagination.page} sur{' '}
                {pagination.totalPages}
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
          totalCount={pagination.totalCount}
          filteredCount={pagination.totalCount} // Maintenant égal car filtrage côté serveur
          loading={loading}
        />

        {/* Properties Grid */}
        {properties.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏷️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune propriété trouvée</h3>
            <p className="text-gray-600">
              {pagination.totalCount === 0
                ? 'Créez votre première propriété pour commencer'
                : 'Essayez de modifier vos critères de recherche'}
            </p>
          </div>
        ) : (
          <>
            {/* Loading overlay pour les rechargements */}
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
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
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
