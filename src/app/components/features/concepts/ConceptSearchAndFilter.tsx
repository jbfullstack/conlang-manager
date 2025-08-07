import { useState, useCallback, useRef } from 'react';

interface ConceptSearchAndFilterProps {
  onSearch: (searchTerm: string, typeFilter: string) => void;
  types: string[];
  totalCount: number;
  filteredCount: number;
  loading?: boolean;
}

export default function ConceptSearchAndFilter({
  onSearch,
  types,
  totalCount,
  filteredCount,
  loading = false,
}: ConceptSearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // ✅ FIX: Utiliser useRef pour le timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ FIX: Fonction de déclenchement immédiat de la recherche
  const triggerSearch = useCallback(() => {
    // Nettoyer le timeout en cours
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    onSearch(searchTerm, typeFilter);
  }, [searchTerm, typeFilter, onSearch]);

  // ✅ FIX: Debounce amélioré avec possibilité de déclenchement immédiat
  const handleSearchTermChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      // Nettoyer le timeout précédent
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // ✅ FIX: Si on efface complètement, déclencher immédiatement
      if (value === '') {
        onSearch('', typeFilter);
        return;
      }

      // Sinon, utiliser le debounce mais avec un délai plus court
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(value, typeFilter);
        searchTimeoutRef.current = null;
      }, 500); // ✅ FIX: Augmenter à 500ms pour éviter les recherches trop rapides
    },
    [onSearch, typeFilter],
  );

  const handleTypeFilterChange = useCallback(
    (value: string) => {
      setTypeFilter(value);
      onSearch(searchTerm, value); // Pas de debounce pour les dropdowns
    },
    [searchTerm, onSearch],
  );

  const handleReset = useCallback(() => {
    // Nettoyer le timeout en cours
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    setSearchTerm('');
    setTypeFilter('all');
    onSearch('', 'all');
  }, [onSearch]);

  // ✅ FIX: Handler pour la touche Entrée
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSearch();
      }
    },
    [triggerSearch],
  );

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
              onKeyPress={handleKeyPress} // ✅ FIX: Ajout de la gestion d'Entrée
              disabled={loading}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <span className="text-gray-400">🔍</span>
              )}
            </div>
            {/* ✅ FIX: Bouton de recherche */}
            {searchTerm && !loading && (
              <button
                onClick={triggerSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800"
                title="Rechercher maintenant"
              >
                <span className="text-lg">⏎</span>
              </button>
            )}
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

          {/* ✅ FIX: Bouton de recherche explicite */}
          <button
            onClick={triggerSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            title="Lancer la recherche"
          >
            <span>🔍</span>
            <span>Rechercher</span>
          </button>

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
                🏷️ {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
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
