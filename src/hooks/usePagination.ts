import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  defaultPageSize?: number;
  defaultPage?: number;
}

export function usePagination({ 
  defaultPageSize = 12, 
  defaultPage = 1 
}: UsePaginationOptions = {}) {
  // États internes synchronisés
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // ✅ FIX: Handler qui PRÉSERVE le pageSize lors du changement de page
  const handlePageChange = useCallback((newPage: number) => {
    console.log('📄 Page change:', newPage, 'PageSize preserved:', pageSize);
    setCurrentPage(newPage);
    // ⚠️ Ne pas toucher au pageSize !
  }, [pageSize]); // ✅ FIX: Ajouter pageSize en dépendance pour la cohérence

  // ✅ FIX: Handler qui REMET à la page 1 lors du changement de pageSize
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    console.log('📏 PageSize change:', newPageSize, 'Reset to page 1');
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset à la page 1 quand on change la taille
  }, []);

  // ✅ FIX: Fonction pour reset la pagination (NE PAS changer le pageSize)
  const resetPagination = useCallback(() => {
    console.log('🔄 Reset pagination - keeping pageSize:', pageSize);
    setCurrentPage(1);
    // ⚠️ Ne PAS reset le pageSize ici ! L'utilisateur l'a choisi pour une raison
  }, [pageSize]);

  // ✅ FIX: Nouvelle fonction pour reset complet si nécessaire
  const fullReset = useCallback(() => {
    console.log('🔄 Full reset pagination');
    setCurrentPage(defaultPage);
    setPageSize(defaultPageSize);
  }, [defaultPage, defaultPageSize]);

  // Calculer les indices pour slice()
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Calculer les totaux
  const calculatePagination = useCallback((totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      totalPages,
      startItem: totalItems > 0 ? startIndex + 1 : 0,
      endItem: Math.min(endIndex, totalItems),
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [currentPage, pageSize, startIndex, endIndex]);

  return {
    // États
    currentPage,
    pageSize,
    startIndex,
    endIndex,
    
    // Handlers (à passer à votre composant Pagination)
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    
    // Utilities
    calculatePagination,
    resetPagination,   // ✅ Ne reset QUE la page
    fullReset,         // ✅ Reset complet si besoin
  };
}