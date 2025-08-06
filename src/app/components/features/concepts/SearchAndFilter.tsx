import { useState } from 'react';

interface SearchAndFilterProps {
  onSearch: (searchTerm: string, typeFilter: string) => void;
  types: string[];
  totalCount: number;
  filteredCount: number;
}

export default function SearchAndFilter({ onSearch, types, totalCount, filteredCount }: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value, typeFilter);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    onSearch(searchTerm, value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    onSearch('', 'all');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Rechercher
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Mot, définition, propriétés..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex-shrink-0">
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filtrer par type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les types ({totalCount})</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-end space-x-2">
          {(searchTerm || typeFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Effacer
            </button>
          )}
          <div className="text-sm text-gray-500 flex items-center">
            {filteredCount !== totalCount ? (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {filteredCount} sur {totalCount}
              </span>
            ) : (
              <span>{totalCount} concept{totalCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}