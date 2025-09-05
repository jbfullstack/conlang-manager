// src/app/properties/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import PropertyCard from '@/app/components/features/properties/PropertyCard';
import PropertyForm from '@/app/components/features/properties/PropertyForm';
import PropertySearchAndFilter from '@/app/components/features/properties/PropertySearchAndFilter';
import Pagination from '@/app/components/ui/Pagination';
import { Property } from '@/interfaces/property.interface';
import { usePagination } from '@/hooks/usePagination';

import ContentSection from '@/app/components/ui/ContentSection';
import AnimatedGrid from '@/app/components/ui/AnimatedGrid';
import {
  LoadingScreen,
  ErrorState,
  EmptyState,
  ContentContainer,
} from '@/app/components/ui/LoadingStates';
import { fetchPropertiesCategories, fetch as signedFetch } from '@/utils/api-client';

import PageLayout from '@/app/components/ui/PageLayout';
import PageHeader from '@/app/components/ui/PageHeader';
import { useSpace } from '@/app/components/providers/SpaceProvider';

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PropertiesPage() {
  const { current } = useSpace();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const pagination = usePagination({ defaultPageSize: 12, defaultPage: 1 });

  const [searchFilters, setSearchFilters] = useState({
    searchTerm: '',
    categoryFilter: 'all',
    activeFilter: 'all',
  });

  const [serverPagination, setServerPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fetchProperties = useCallback(async () => {
    // Stopper le spinner si aucun espace sélectionné
    if (!current?.id) {
      setLoading(false);
      setProperties([]);
      setServerPagination((p) => ({ ...p, totalCount: 0, totalPages: 0 }));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(pagination.currentPage),
        pageSize: String(pagination.pageSize),
        include: 'concepts',
        active: 'false',
        spaceId: current.id,
      });

      if (searchFilters.searchTerm.trim()) params.set('search', searchFilters.searchTerm.trim());
      if (searchFilters.categoryFilter !== 'all')
        params.set('category', searchFilters.categoryFilter);
      if (searchFilters.activeFilter !== 'all') params.set('status', searchFilters.activeFilter);

      // IMPORTANT : utiliser signedFetch (Response-like)
      const response = await signedFetch(`/api/properties?${params.toString()}`);

      if (!response.ok) throw new Error('Erreur lors du chargement des propriétés');

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
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProperties([]);
      setServerPagination((prev) => ({ ...prev, totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [
    current?.id, // <-- DEP AJOUTÉE (évite fermeture obsolète)
    searchFilters,
    pagination.currentPage,
    pagination.pageSize,
  ]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetchPropertiesCategories();
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories || []);
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSearch = useCallback(
    (searchTerm: string, categoryFilter: string, activeFilter: string) => {
      setSearchFilters({ searchTerm, categoryFilter, activeFilter });
      pagination.resetPagination();
    },
    [pagination],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      pagination.onPageChange(newPage);
    },
    [pagination],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      pagination.onPageSizeChange(newPageSize);
    },
    [pagination],
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) return;

    try {
      const response = await signedFetch(`/api/properties/${id}`, 'DELETE');
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
      const response = await signedFetch(url, method, propertyData);

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

  // Aucun espace sélectionné : message clair
  if (!current?.id && !loading) {
    return (
      <PageLayout variant="green">
        <PageHeader
          title="Propriétés Linguistiques"
          icon="🏷️"
          titleGradient="from-green-600 via-blue-600 to-purple-600"
          stats={[]}
        />
        <ContentSection>
          <EmptyState
            icon="🌌"
            title="Aucun espace sélectionné"
            description="Sélectionnez ou créez un slang‑space pour gérer vos propriétés."
            actionButton={{
              label: 'Créer / choisir un espace',
              onClick: () => (location.href = '/spaces'),
              gradient:
                'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600',
            }}
          />
        </ContentSection>
      </PageLayout>
    );
  }

  if (loading && properties.length === 0) {
    return (
      <LoadingScreen
        message="Chargement des propriétés..."
        subMessage="Classification en cours"
        variant="green"
      />
    );
  }

  if (error && properties.length === 0) {
    return (
      <ErrorState
        title="Problème de chargement"
        message={error}
        onRetry={fetchProperties}
        variant="red"
      />
    );
  }

  const headerStats = [
    {
      icon: '📊',
      label: serverPagination.totalCount !== 1 ? 'propriétés' : 'propriété',
      value: serverPagination.totalCount,
      color: 'green' as const,
    },
    { icon: '📂', label: 'catégories', value: availableCategories.length, color: 'blue' as const },
    {
      icon: '📄',
      label: `Page ${pagination.currentPage} / ${serverPagination.totalPages}`,
      value: '',
      color: 'purple' as const,
    },
  ];

  return (
    <PageLayout variant="green">
      <PageHeader
        title="Propriétés Linguistiques"
        icon="🏷️"
        titleGradient="from-green-600 via-blue-600 to-purple-600"
        stats={headerStats}
        actionButton={{
          label: 'Nouvelle Propriété',
          shortLabel: 'Nouvelle',
          icon: '🆕',
          onClick: handleCreateProperty,
          gradient:
            'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600',
        }}
      />

      <ContentSection>
        <PropertySearchAndFilter
          onSearch={handleSearch}
          categories={availableCategories}
          totalCount={serverPagination.totalCount}
          filteredCount={serverPagination.totalCount}
          loading={loading}
        />
      </ContentSection>

      <ContentContainer
        loading={loading && properties.length > 0}
        loadingMessage="Actualisation..."
      >
        {properties.length === 0 && !loading ? (
          <EmptyState
            icon={serverPagination.totalCount === 0 ? '🏷️' : '🔍'}
            title={
              serverPagination.totalCount === 0
                ? 'Aucune propriété créée'
                : 'Aucune propriété trouvée'
            }
            description={
              serverPagination.totalCount === 0
                ? 'Créez votre première propriété linguistique pour enrichir votre système de classification'
                : 'Affinez vos critères de recherche ou créez une nouvelle propriété'
            }
            actionButton={{
              label: 'Créer votre première propriété',
              onClick: handleCreateProperty,
              gradient:
                'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600',
            }}
          />
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <AnimatedGrid columns={4} gap="md">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onEdit={() => handleEditProperty(property)}
                    onDelete={() => handleDeleteProperty(property.id)}
                  />
                ))}
              </AnimatedGrid>
            </div>

            {serverPagination.totalPages > 1 && (
              <ContentSection>
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={serverPagination.totalPages}
                  totalCount={serverPagination.totalCount}
                  pageSize={pagination.pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  loading={loading}
                />
              </ContentSection>
            )}
          </>
        )}
      </ContentContainer>

      {isFormOpen && (
        <PropertyForm
          property={editingProperty}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </PageLayout>
  );
}
