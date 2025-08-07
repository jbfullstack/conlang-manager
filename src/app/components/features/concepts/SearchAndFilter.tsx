import { useState, useCallback } from 'react';

interface SearchAndFilterProps {
  onSearch: (searchTerm: string, typeFilter: string) => void;
  types: string[];
  totalCount: number;
  filteredCount: number;
  loading?: boolean;
}

export default function SearchAndFilter({
  onSearch,
  types,
  totalCount,
  filteredCount,
  loading = false,
}: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fonction de recherche avec debounce
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchWithDebounce = useCallback(
    (term: string, tFilter: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        onSearch(term, tFilter);
      }, 300); // 300ms de debounce

      setSearchTimeout(timeout);
    },
    [onSearch, searchTimeout],
  );

  const handleSearchTermChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      handleSearchWithDebounce(value, typeFilter);
    },
    [typeFilter, handleSearchWithDebounce],
  );

  const handleTypeFilterChange = useCallback(
    (value: string) => {
      setTypeFilter(value);
      onSearch(searchTerm, value); // Pas de debounce pour les dropdowns
    },
    [searchTerm, onSearch],
  );

  const handleReset = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('all');
    onSearch('', 'all');
  }, [onSearch]);

  const handleQuickTypeFilter = useCallback(
    (type: string) => {
      setTypeFilter(type);
      onSearch(searchTerm, type);
    },
    [searchTerm, onSearch],
  );

  const hasFilters = searchTerm || typeFilter !== 'all';

  return (
    <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Barre de recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par mot, définition, type ou propriété..."
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <span className="text-gray-400">🔍</span>
              )}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Filtre par type */}
          <div className="min-w-[160px]">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="all">Tous les types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton reset */}
          {hasFilters && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span>
            {totalCount} concept{totalCount !== 1 ? 's' : ''} au total
            {hasFilters && <span className="ml-2 text-blue-600">(recherche active)</span>}
          </span>
        </div>

        {hasFilters && (
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            {searchTerm && <span className="text-blue-600">🔍 "{searchTerm}"</span>}
            {typeFilter !== 'all' && (
              <span className="text-green-600">
                📂 {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filtres rapides par type - seulement quand pas de filtres actifs */}
      {types.length > 0 && !hasFilters && !loading && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Filtres rapides par type:</p>
          <div className="flex flex-wrap gap-2">
            {types.slice(0, 8).map((type) => (
              <button
                key={type}
                onClick={() => handleQuickTypeFilter(type)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
            {types.length > 8 && (
              <span className="px-2 py-1 text-xs text-gray-500">+{types.length - 8} autres...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
