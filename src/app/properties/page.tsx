'use client';

import { useState, useEffect, useCallback } from 'react';
import PropertyCard from '../components/features/properties/PropertyCard';
import PropertyForm from '../components/features/properties/PropertyForm';
import PropertySearchAndFilter from '../components/features/properties/PropertySearchAndFilter';
import Pagination from '../components/ui/Pagination';
import { Property } from '@/interfaces/property.interface';
import { usePagination } from '@/hooks/usePagination';

// Composants réutilisables
import PageLayout from '../components/ui/PageLayout';
import PageHeader from '../components/ui/PageHeader';
import ContentSection from '../components/ui/ContentSection';
import AnimatedGrid from '../components/ui/AnimatedGrid';
import {
  LoadingScreen,
  ErrorState,
  EmptyState,
  ContentContainer,
} from '../components/ui/LoadingStates';

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

  const pagination = usePagination({
    defaultPageSize: 12,
    defaultPage: 1,
  });

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

  // API calls
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
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProperties([]);
      setServerPagination((prev) => ({ ...prev, totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [searchFilters, pagination.currentPage, pagination.pageSize]);

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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Handlers
  const handleSearch = useCallback(
    (searchTerm: string, categoryFilter: string, activeFilter: string) => {
      const newFilters = { searchTerm, categoryFilter, activeFilter };
      setSearchFilters(newFilters);
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
        headers: { 'Content-Type': 'application/json' },
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
      <LoadingScreen
        message="Chargement des propriétés..."
        subMessage="Classification en cours"
        variant="green"
      />
    );
  }

  // Error state
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

  // Préparer les stats pour le header
  const headerStats = [
    {
      icon: '📊',
      label: serverPagination.totalCount !== 1 ? 'propriétés' : 'propriété',
      value: serverPagination.totalCount,
      color: 'green' as const,
    },
    {
      icon: '📂',
      label: 'catégories',
      value: availableCategories.length,
      color: 'blue' as const,
    },
    {
      icon: '📄',
      label: `Page ${pagination.currentPage} / ${serverPagination.totalPages}`,
      value: '',
      color: 'purple' as const,
    },
  ];

  return (
    <PageLayout variant="green">
      {/* Header */}
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

      {/* Search and Filter */}
      <ContentSection>
        <PropertySearchAndFilter
          onSearch={handleSearch}
          categories={availableCategories}
          totalCount={serverPagination.totalCount}
          filteredCount={serverPagination.totalCount}
          loading={loading}
        />
      </ContentSection>

      {/* Main Content */}
      <ContentContainer
        loading={loading && properties.length > 0}
        loadingMessage="Actualisation..."
      >
        {/* Empty state */}
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
            {/* Properties Grid */}
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

            {/* Pagination */}
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

      {/* Form Modal */}
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
