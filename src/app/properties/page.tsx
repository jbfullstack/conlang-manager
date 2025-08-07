'use client';

import { useState, useEffect } from 'react';
import PropertyCard from '../components/features/properties/PropertyCard';
import PropertySearchAndFilter from '../components/features/properties/PropertySearchAndFilter';
import PropertyForm from '../components/features/properties/PropertyForm';
import { Property } from '../interfaces/property.interface';

// interface Property {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
//   usageCount: number;
//   isActive: boolean;
//   conceptProperties?: {
//     concept: {
//       id: string;
//       mot: string;
//       type: string;
//     };
//   }[];
//   createdAt: string;
// }

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Charger les propriétés au montage
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties?include=concepts');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des propriétés');
      }

      const data = await response.json();
      setProperties(data.properties || []);
      setFilteredProperties(data.properties || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string, categoryFilter: string, activeFilter: string) => {
    let filtered = properties;

    // Filtre par texte
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.name.toLowerCase().includes(term) ||
          property.description.toLowerCase().includes(term) ||
          property.category.toLowerCase().includes(term),
      );
    }

    // Filtre par catégorie
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((property) => property.category === categoryFilter);
    }

    // Filtre par statut
    if (activeFilter !== 'all') {
      const isActive = activeFilter === 'active';
      filtered = filtered.filter((property) => property.isActive === isActive);
    }

    setFilteredProperties(filtered);
  };

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

      // Recharger les propriétés
      fetchProperties();
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
      fetchProperties();
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProperty(null);
  };

  // Catégories uniques pour le filtre
  const uniqueCategories = [...new Set(properties.map((p) => p.category))];

  // Statistiques
  const totalUsage = properties.reduce((sum, prop) => sum + prop.usageCount, 0);
  const activeProperties = properties.filter((p) => p.isActive).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des propriétés...</p>
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
            onClick={fetchProperties}
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
                Gérez vos propriétés et catégories • {properties.length} propriété
                {properties.length !== 1 ? 's' : ''} • {activeProperties} active
                {activeProperties !== 1 ? 's' : ''} • {totalUsage} usage
                {totalUsage !== 1 ? 's' : ''}
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
          categories={uniqueCategories}
          totalCount={properties.length}
          filteredCount={filteredProperties.length}
        />

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏷️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune propriété trouvée</h3>
            <p className="text-gray-600">
              {properties.length === 0
                ? 'Créez votre première propriété pour commencer'
                : 'Essayez de modifier vos critères de recherche'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={() => handleEditProperty(property)}
                onDelete={() => handleDeleteProperty(property.id)}
              />
            ))}
          </div>
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
