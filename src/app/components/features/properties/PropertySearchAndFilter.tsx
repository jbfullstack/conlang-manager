import { useState, useEffect } from 'react';
import { getCategoryLabel, getCategoriesByGroup } from '../../../lib/categories';

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
  const [showGroupedCategories, setShowGroupedCategories] = useState(false);

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

  // Organiser les catégories par groupes pour un meilleur affichage
  const categoriesByGroup = {
    conceptuel: getCategoriesByGroup('conceptuel').filter((cat) => categories.includes(cat.key)),
    perceptuel: getCategoriesByGroup('perceptuel').filter((cat) => categories.includes(cat.key)),
    linguistique: getCategoriesByGroup('linguistique').filter((cat) =>
      categories.includes(cat.key),
    ),
  };

  // Catégories utilisées qui ne sont pas dans le système centralisé
  const otherCategories = categories.filter(
    (cat) =>
      !getCategoriesByGroup('conceptuel').some((c) => c.key === cat) &&
      !getCategoriesByGroup('perceptuel').some((c) => c.key === cat) &&
      !getCategoriesByGroup('linguistique').some((c) => c.key === cat),
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
          <div className="min-w-[180px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes catégories</option>

              {/* Groupes de catégories */}
              {categoriesByGroup.conceptuel.length > 0 && (
                <optgroup label="🎯 Conceptuel">
                  {categoriesByGroup.conceptuel.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
              )}

              {categoriesByGroup.perceptuel.length > 0 && (
                <optgroup label="👁️ Perceptuel">
                  {categoriesByGroup.perceptuel.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
              )}

              {categoriesByGroup.linguistique.length > 0 && (
                <optgroup label="🗣️ Linguistique">
                  {categoriesByGroup.linguistique.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Autres catégories */}
              {otherCategories.length > 0 && (
                <optgroup label="📂 Autres">
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
              <span className="text-green-600">📂 {getCategoryLabel(categoryFilter)}</span>
            )}
            {activeFilter !== 'all' && (
              <span className="text-purple-600">
                🔄 {activeFilter === 'active' ? 'Actives' : 'Inactives'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Statistiques rapides par groupe de catégories */}
      {categories.length > 0 && !hasFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Répartition par catégorie:</p>
            <button
              onClick={() => setShowGroupedCategories(!showGroupedCategories)}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showGroupedCategories ? 'Masquer' : 'Voir groupes'}
            </button>
          </div>

          {showGroupedCategories ? (
            // Affichage groupé
            <div className="space-y-3">
              {Object.entries(categoriesByGroup).map(([groupName, groupCategories]) => {
                if (groupCategories.length === 0) return null;

                const groupEmoji =
                  {
                    conceptuel: '🎯',
                    perceptuel: '👁️',
                    linguistique: '🗣️',
                  }[groupName as keyof typeof categoriesByGroup] || '📂';

                return (
                  <div key={groupName}>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {groupEmoji} {groupName.charAt(0).toUpperCase() + groupName.slice(1)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {groupCategories.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setCategoryFilter(cat.key)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
                          title={cat.description}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Autres catégories */}
              {otherCategories.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">📂 Autres</p>
                  <div className="flex flex-wrap gap-1">
                    {otherCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setCategoryFilter(category)}
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
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
