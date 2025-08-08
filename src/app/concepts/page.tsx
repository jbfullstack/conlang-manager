'use client';

import { useState, useEffect, useCallback } from 'react';
import ConceptCard from '@/app/components/features/concepts/ConceptCard';
import ConceptForm from '@/app/components/features/concepts/ConceptForm';
import ConceptSearchAndFilter from '@/app/components/features/concepts/ConceptSearchAndFilter';
import Pagination from '@/app/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

// Composants réutilisables
import PageLayout from '@/app/components/ui/PageLayout';
import PageHeader from '@/app/components/ui/PageHeader';
import ContentSection from '@/app/components/ui/ContentSection';
import AnimatedGrid from '@/app/components/ui/AnimatedGrid';
import {
  LoadingScreen,
  ErrorState,
  EmptyState,
  ContentContainer,
} from '@/app/components/ui/LoadingStates';

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

  const pagination = usePagination({
    defaultPageSize: 12,
    defaultPage: 1,
  });

  const [searchFilters, setSearchFilters] = useState({
    searchTerm: '',
    typeFilter: 'all',
  });

  const [serverPagination, setServerPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // API calls
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
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setConcepts([]);
      setServerPagination((prev) => ({ ...prev, totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [searchFilters, pagination.currentPage, pagination.pageSize]);

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

  useEffect(() => {
    fetchTypes();
  }, []);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  // Handlers
  const handleSearch = useCallback(
    (searchTerm: string, typeFilter: string) => {
      const newFilters = { searchTerm, typeFilter };
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
        headers: { 'Content-Type': 'application/json' },
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
      <LoadingScreen
        message="Chargement des concepts..."
        subMessage="Préparation de votre bibliothèque"
        variant="blue"
      />
    );
  }

  // Error state
  if (error && concepts.length === 0) {
    return <ErrorState message={error} onRetry={fetchConcepts} variant="red" />;
  }

  // Préparer les stats pour le header
  const headerStats = [
    {
      icon: '📊',
      label: serverPagination.totalCount !== 1 ? 'concepts' : 'concept',
      value: serverPagination.totalCount,
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
    <PageLayout variant="blue">
      {/* Header */}
      <PageHeader
        title="Concepts Primitifs"
        icon="🧠"
        titleGradient="from-blue-600 via-purple-600 to-pink-600"
        stats={headerStats}
        actionButton={{
          label: 'Nouveau Concept',
          shortLabel: 'Nouveau',
          icon: '➕',
          onClick: handleCreateConcept,
          gradient:
            'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
        }}
      />

      {/* Search and Filter */}
      <ContentSection>
        <ConceptSearchAndFilter
          onSearch={handleSearch}
          types={availableTypes}
          totalCount={serverPagination.totalCount}
          filteredCount={serverPagination.totalCount}
          loading={loading}
        />
      </ContentSection>

      {/* Main Content */}
      <ContentContainer loading={loading && concepts.length > 0} loadingMessage="Actualisation...">
        {/* Empty state */}
        {concepts.length === 0 && !loading ? (
          <EmptyState
            icon={serverPagination.totalCount === 0 ? '📝' : '🔍'}
            title={
              serverPagination.totalCount === 0 ? 'Aucun concept créé' : 'Aucun concept trouvé'
            }
            description={
              serverPagination.totalCount === 0
                ? 'Commencez par créer votre premier concept primitif pour construire votre vocabulaire'
                : 'Essayez de modifier vos critères de recherche ou créez un nouveau concept'
            }
            actionButton={{
              label: 'Créer votre premier concept',
              onClick: handleCreateConcept,
              gradient:
                'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600',
            }}
          />
        ) : (
          <>
            {/* Concepts Grid */}
            <div className="mb-6 sm:mb-8">
              <AnimatedGrid columns={4} gap="md">
                {concepts.map((concept) => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    onEdit={() => handleEditConcept(concept)}
                    onDelete={() => handleDeleteConcept(concept.id)}
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
        <ConceptForm
          concept={editingConcept}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </PageLayout>
  );
}
