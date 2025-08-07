import { useState, useEffect } from 'react';

interface PropertySearchAndFilterProps {
  onSearch: (searchTerm: string, categoryFilter: string, activeFilter: string) => void;
  categories: string[];
  totalCount: number;
  filteredCount: number;
}

export default function PropertySearchAndFilter({
  onSearch,
  categories,
  totalCount,
  filteredCount,
}: PropertySearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  // Déclencher la recherche à chaque changement
  useEffect(() => {
    onSearch(searchTerm, categoryFilter, activeFilter);
  }, [searchTerm, categoryFilter, activeFilter, onSearch]);

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setActiveFilter('all');
  };

  const hasFilters = searchTerm || categoryFilter !== 'all' || activeFilter !== 'all';

  return (
    <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Barre de recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par nom, description ou catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Filtre par catégorie */}
          <div className="min-w-[160px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes catégories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par statut */}
          <div className="min-w-[120px]">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </div>

          {/* Bouton reset */}
          {hasFilters && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
              title="Réinitialiser les filtres"
            >
              <span>↻</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Résumé et statistiques */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <div>
          {filteredCount === totalCount ? (
            <span>
              {totalCount} propriété{totalCount !== 1 ? 's' : ''} au total
            </span>
          ) : (
            <span>
              {filteredCount} propriété{filteredCount !== 1 ? 's' : ''} affichée
              {filteredCount !== 1 ? 's' : ''} sur {totalCount}
            </span>
          )}
        </div>

        {hasFilters && (
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            {searchTerm && <span className="text-blue-600">🔍 "{searchTerm}"</span>}
            {categoryFilter !== 'all' && (
              <span className="text-green-600">📂 {categoryFilter}</span>
            )}
            {activeFilter !== 'all' && (
              <span className="text-purple-600">
                🔄 {activeFilter === 'active' ? 'Actives' : 'Inactives'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Statistiques rapides par catégorie */}
      {categories.length > 0 && !hasFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Répartition par catégorie:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
