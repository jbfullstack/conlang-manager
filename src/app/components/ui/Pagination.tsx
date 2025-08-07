interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  pageSizeOptions = [6, 12, 24, 48],
}: PaginationProps) {
  // Calculer les numéros de page à afficher
  const getPageNumbers = () => {
    const delta = 2; // Nombre de pages à afficher de chaque côté
    const range = [];
    const rangeWithDots = [];

    // Calculer les limites
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    // Toujours inclure la première page
    if (totalPages > 1) {
      range.push(1);
    }

    // Ajouter les pages du milieu
    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    // Toujours inclure la dernière page
    if (totalPages > 1 && !range.includes(totalPages)) {
      range.push(totalPages);
    }

    // Construire le tableau final avec les "..."
    let last = 0;
    for (const page of range) {
      if (page - last === 2) {
        rangeWithDots.push(last + 1);
      } else if (page - last !== 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      last = page;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  // Calcul des éléments affichés
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-200 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Informations sur les éléments affichés */}
        <div className="text-sm text-gray-700">
          <span>
            Affichage de <span className="font-medium">{startItem}</span> à{' '}
            <span className="font-medium">{endItem}</span> sur{' '}
            <span className="font-medium">{totalCount}</span> résultat{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Navigation pagination */}
        <div className="flex items-center space-x-2">
          {/* Bouton précédent */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédent
          </button>

          {/* Numéros de page */}
          <div className="flex space-x-1">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`dots-${index}`} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors disabled:cursor-not-allowed ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Bouton suivant */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant →
          </button>
        </div>

        {/* Sélecteur taille de page */}
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700">
            Par page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Barre de progression loading */}
      {loading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse w-1/3"></div>
          </div>
        </div>
      )}
    </div>
  );
}
