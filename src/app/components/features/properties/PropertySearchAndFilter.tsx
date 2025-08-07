import {
  useState,
  useCallback,
  useRef,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
} from 'react';
import { getCategoryLabel, getCategoriesByGroup } from '../../../../lib/categories';

interface PropertySearchAndFilterProps {
  onSearch: (searchTerm: string, categoryFilter: string, activeFilter: string) => void;
  categories: string[];
  totalCount: number;
  filteredCount: number;
  loading?: boolean;
}

export default function PropertySearchAndFilter({
  onSearch,
  categories,
  totalCount,
  filteredCount,
  loading = false,
}: PropertySearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showGroupedCategories, setShowGroupedCategories] = useState(false);

  // ✅ FIX: Utiliser useRef pour le timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ FIX: Fonction de déclenchement immédiat de la recherche
  const triggerSearch = useCallback(() => {
    // Nettoyer le timeout en cours
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    onSearch(searchTerm, categoryFilter, activeFilter);
  }, [searchTerm, categoryFilter, activeFilter, onSearch]);

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
        onSearch('', categoryFilter, activeFilter);
        return;
      }

      // Sinon, utiliser le debounce mais avec un délai plus long
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(value, categoryFilter, activeFilter);
        searchTimeoutRef.current = null;
      }, 500); // ✅ FIX: 500ms pour éviter les recherches trop rapides
    },
    [onSearch, categoryFilter, activeFilter],
  );

  const handleCategoryFilterChange = useCallback(
    (value: string) => {
      setCategoryFilter(value);
      onSearch(searchTerm, value, activeFilter); // Pas de debounce pour les dropdowns
    },
    [searchTerm, activeFilter, onSearch],
  );

  const handleActiveFilterChange = useCallback(
    (value: string) => {
      setActiveFilter(value);
      onSearch(searchTerm, categoryFilter, value); // Pas de debounce pour les dropdowns
    },
    [searchTerm, categoryFilter, onSearch],
  );

  const handleReset = useCallback(() => {
    // Nettoyer le timeout en cours
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    setSearchTerm('');
    setCategoryFilter('all');
    setActiveFilter('all');
    onSearch('', 'all', 'all');
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

  const handleQuickCategoryFilter = useCallback(
    (category: string) => {
      setCategoryFilter(category);
      onSearch(searchTerm, category, activeFilter);
    },
    [searchTerm, activeFilter, onSearch],
  );

  const hasFilters = searchTerm || categoryFilter !== 'all' || activeFilter !== 'all';

  // Organiser les catégories par groupes pour un meilleur affichage
  const categoriesByGroup = {
    conceptuel: getCategoriesByGroup('conceptuel').filter((cat: { key: string }) =>
      categories.includes(cat.key),
    ),
    perceptuel: getCategoriesByGroup('perceptuel').filter((cat: { key: string }) =>
      categories.includes(cat.key),
    ),
    linguistique: getCategoriesByGroup('linguistique').filter((cat: { key: string }) =>
      categories.includes(cat.key),
    ),
  };

  // Catégories utilisées qui ne sont pas dans le système centralisé
  const otherCategories = categories.filter(
    (cat) =>
      !getCategoriesByGroup('conceptuel').some((c: { key: string }) => c.key === cat) &&
      !getCategoriesByGroup('perceptuel').some((c: { key: string }) => c.key === cat) &&
      !getCategoriesByGroup('linguistique').some((c: { key: string }) => c.key === cat),
  );

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
          {/* Filtre par catégorie */}
          <div className="min-w-[180px]">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="all">Toutes catégories</option>

              {/* Groupes de catégories */}
              {categoriesByGroup.conceptuel.length > 0 && (
                <optgroup label="🧠 Conceptuel">
                  {categoriesByGroup.conceptuel.map(
                    (cat: {
                      key: string;
                      label:
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactElement<unknown, string | JSXElementConstructor<any>>
                        | Iterable<ReactNode>
                        | ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactPortal
                            | ReactElement<unknown, string | JSXElementConstructor<any>>
                            | Iterable<ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                    }) => (
                      <option key={cat.key as string} value={cat.key as string}>
                        {cat.label}
                      </option>
                    ),
                  )}
                </optgroup>
              )}

              {categoriesByGroup.perceptuel.length > 0 && (
                <optgroup label="👁️ Perceptuel">
                  {categoriesByGroup.perceptuel.map(
                    (cat: {
                      key: string;
                      label:
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactElement<unknown, string | JSXElementConstructor<any>>
                        | Iterable<ReactNode>
                        | ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactPortal
                            | ReactElement<unknown, string | JSXElementConstructor<any>>
                            | Iterable<ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                    }) => (
                      <option key={cat.key as string} value={cat.key as string}>
                        {cat.label}
                      </option>
                    ),
                  )}
                </optgroup>
              )}

              {categoriesByGroup.linguistique.length > 0 && (
                <optgroup label="🗣️ Linguistique">
                  {categoriesByGroup.linguistique.map(
                    (cat: {
                      key: string;
                      label:
                        | string
                        | number
                        | bigint
                        | boolean
                        | ReactElement<unknown, string | JSXElementConstructor<any>>
                        | Iterable<ReactNode>
                        | ReactPortal
                        | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactPortal
                            | ReactElement<unknown, string | JSXElementConstructor<any>>
                            | Iterable<ReactNode>
                            | null
                            | undefined
                          >
                        | null
                        | undefined;
                    }) => (
                      <option key={cat.key as string} value={cat.key as string}>
                        {cat.label}
                      </option>
                    ),
                  )}
                </optgroup>
              )}

              {/* Autres catégories */}
              {otherCategories.length > 0 && (
                <optgroup label="🏷️ Autres">
                  {otherCategories.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Filtre par statut */}
          <div className="min-w-[120px]">
            <select
              value={activeFilter}
              onChange={(e) => handleActiveFilterChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
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
            {totalCount} propriété{totalCount !== 1 ? 's' : ''} au total
            {hasFilters && <span className="ml-2 text-blue-600">(recherche active)</span>}
          </span>
        </div>

        {hasFilters && (
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            {searchTerm && <span className="text-blue-600">🔍 "{searchTerm}"</span>}
            {categoryFilter !== 'all' && (
              <span className="text-green-600">🏷️ {getCategoryLabel(categoryFilter)}</span>
            )}
            {activeFilter !== 'all' && (
              <span className="text-purple-600">
                🔍 {activeFilter === 'active' ? 'Actives' : 'Inactives'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Statistiques rapides par groupe de catégories - seulement quand pas de filtres actifs */}
      {categories.length > 0 && !hasFilters && !loading && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Filtres rapides par catégorie:</p>
            <button
              onClick={() => setShowGroupedCategories(!showGroupedCategories)}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showGroupedCategories ? 'Vue simple' : 'Vue groupée'}
            </button>
          </div>

          {showGroupedCategories ? (
            // Affichage groupé
            <div className="space-y-3">
              {Object.entries(categoriesByGroup).map(([groupName, groupCategories]) => {
                if (groupCategories.length === 0) return null;

                const groupEmoji =
                  {
                    conceptuel: '🧠',
                    perceptuel: '👁️',
                    linguistique: '🗣️',
                  }[groupName as keyof typeof categoriesByGroup] || '🏷️';

                return (
                  <div key={groupName}>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {groupEmoji} {groupName.charAt(0).toUpperCase() + groupName.slice(1)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {groupCategories.map(
                        (cat: {
                          key: string;
                          description: string | undefined;
                          label:
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactElement<unknown, string | JSXElementConstructor<any>>
                            | Iterable<ReactNode>
                            | ReactPortal
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactPortal
                                | ReactElement<unknown, string | JSXElementConstructor<any>>
                                | Iterable<ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined;
                        }) => (
                          <button
                            key={cat.key as string}
                            onClick={() => handleQuickCategoryFilter(cat.key as string)}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
                            title={cat.description}
                          >
                            {cat.label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Autres catégories */}
              {otherCategories.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">🏷️ Autres</p>
                  <div className="flex flex-wrap gap-1">
                    {otherCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleQuickCategoryFilter(category)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
                      >
                        {getCategoryLabel(category)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Affichage simple
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 8).map((category) => (
                <button
                  key={category}
                  onClick={() => handleQuickCategoryFilter(category)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
              {categories.length > 8 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{categories.length - 8} autres...
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
