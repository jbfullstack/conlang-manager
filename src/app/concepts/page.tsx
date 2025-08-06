'use client';

import { useState, useEffect } from 'react';
import ConceptCard from '../components/features/concepts/ConceptCard';
import ConceptForm from '../components/features/concepts/ConceptForm';
import SearchAndFilter from '../components/features/concepts/SearchAndFilter';

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

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [filteredConcepts, setFilteredConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);

  // Charger les concepts au montage
  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/concepts');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des concepts');
      }

      const data = await response.json();
      setConcepts(data.concepts || []);
      setFilteredConcepts(data.concepts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string, typeFilter: string) => {
    let filtered = concepts;

    // Filtre par texte
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (concept) =>
          concept.mot.toLowerCase().includes(term) ||
          concept.definition.toLowerCase().includes(term) ||
          concept.proprietes.some((prop) => prop.toLowerCase().includes(term)),
      );
    }

    // Filtre par type
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((concept) => concept.type === typeFilter);
    }

    setFilteredConcepts(filtered);
  };

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

      // Recharger les concepts
      fetchConcepts();
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

      // Fermer le formulaire et recharger
      setIsFormOpen(false);
      setEditingConcept(null);
      fetchConcepts();
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingConcept(null);
  };

  // Types uniques pour le filtre
  const uniqueTypes = [...new Set(concepts.map((c) => c.type))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des concepts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchConcepts}
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
                Gérez vos concepts de base • {concepts.length} concept
                {concepts.length !== 1 ? 's' : ''} • {filteredConcepts.length} affiché
                {filteredConcepts.length !== 1 ? 's' : ''}
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
        <SearchAndFilter
          onSearch={handleSearch}
          types={uniqueTypes}
          totalCount={concepts.length}
          filteredCount={filteredConcepts.length}
        />

        {/* Concepts Grid */}
        {filteredConcepts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun concept trouvé</h3>
            <p className="text-gray-600">
              {concepts.length === 0
                ? 'Créez votre premier concept pour commencer'
                : 'Essayez de modifier vos critères de recherche'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConcepts.map((concept) => (
              <ConceptCard
                key={concept.id}
                concept={concept}
                onEdit={() => handleEditConcept(concept)}
                onDelete={() => handleDeleteConcept(concept.id)}
              />
            ))}
          </div>
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
