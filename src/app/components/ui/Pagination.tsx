interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
  pageSizeOptions?: number[];
  compact?: boolean; // Nouvelle prop pour la version compacte
  variant?: 'default' | 'glassmorphic'; // Nouvelle prop pour le style
}

export const PAGE_SIZE_OPT = [4, 6, 12, 24, 48];

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  pageSizeOptions = PAGE_SIZE_OPT,
  compact = false,
  variant = 'default',
}: PaginationProps) {
  // Calculer les numéros de page à afficher
  const getPageNumbers = () => {
    const delta = compact ? 1 : 2; // Moins de pages visibles en mode compact
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

  // Classes dynamiques selon le variant
  const containerClasses =
    variant === 'glassmorphic'
      ? 'bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg'
      : 'bg-white rounded-lg shadow-sm border border-gray-200';

  const buttonSize = compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
  const spacing = compact ? 'space-x-1' : 'space-x-2';

  return (
    <div className={`${containerClasses} px-3 sm:px-6 py-3 sm:py-4 mt-4 sm:mt-6`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 gap-2 lg:gap-4">
        {/* Informations sur les éléments affichés */}
        <div
          className={`${
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          } text-gray-600 text-center lg:text-left order-3 lg:order-1`}
        >
          <span>
            Affichage de <span className="font-medium">{startItem}</span> à{' '}
            <span className="font-medium">{endItem}</span> sur{' '}
            <span className="font-medium">{totalCount}</span> résultat{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Navigation pagination */}
        <div className="flex items-center justify-center space-x-1 order-1 lg:order-2">
          {/* Bouton précédent */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`h-8 px-2 sm:px-3 text-xs ${
              variant === 'glassmorphic'
                ? 'bg-white/80 hover:bg-white/95 border border-white/50 shadow-sm text-gray-700'
                : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
            } 
              rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all
              flex items-center justify-center gap-1 font-medium`}
          >
            <span className="text-xs">←</span>
            <span className="hidden sm:inline">Précédent</span>
            <span className="sm:hidden">Préc</span>
          </button>

          {/* Numéros de page - masqués sur mobile en mode compact */}
          <div className={`${compact ? 'hidden sm:flex' : 'flex'} items-center space-x-1`}>
            {pageNumbers.slice(0, compact ? 5 : pageNumbers.length).map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`dots-${index}`}
                    className="h-8 px-2 sm:px-3 text-xs flex items-center justify-center text-gray-500"
                  >
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
                  className={`h-8 px-2 sm:px-3 text-xs border rounded-lg transition-all disabled:cursor-not-allowed font-medium
                    flex items-center justify-center min-w-[2rem]
                    ${
                      isActive
                        ? variant === 'glassmorphic'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md'
                          : 'bg-blue-600 text-white border-blue-600'
                        : variant === 'glassmorphic'
                        ? 'bg-white/80 hover:bg-white/95 text-gray-700 border-white/50 shadow-sm'
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
            className={`h-8 px-2 sm:px-3 text-xs ${
              variant === 'glassmorphic'
                ? 'bg-white/80 hover:bg-white/95 border border-white/50 shadow-sm text-gray-700'
                : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700'
            } 
              rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all
              flex items-center justify-center gap-1 font-medium`}
          >
            <span className="hidden sm:inline">Suivant</span>
            <span className="sm:hidden">Suiv</span>
            <span className="text-xs">→</span>
          </button>
        </div>

        {/* Sélecteur taille de page */}
        <div
          className={`flex items-center justify-center lg:justify-end space-x-2 ${
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          } order-2 lg:order-3`}
        >
          <label htmlFor="pageSize" className="text-gray-600 whitespace-nowrap">
            Par page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className={`border rounded-lg px-2 py-1 text-xs sm:text-sm transition-all disabled:opacity-50
              ${
                variant === 'glassmorphic'
                  ? 'bg-white/90 border-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicateur de page mobile en mode compact */}
      {compact && (
        <div className="flex sm:hidden items-center justify-center mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Page {currentPage} sur {totalPages}
          </span>
        </div>
      )}

      {/* Barre de progression loading */}
      {loading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full animate-pulse w-1/3"></div>
          </div>
        </div>
      )}
    </div>
  );
}
