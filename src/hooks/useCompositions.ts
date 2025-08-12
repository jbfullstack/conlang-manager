import { useEffect, useState, useCallback } from 'react';

export function useCompositions() {
  const [comps, setComps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompositions = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📚 Fetching compositions...');
      const response = await fetch('/api/compositions');
      
      console.log('📚 Response status:', response.status, response.statusText);
      
      // Vérifier le status avant de parser JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Vérifier le content-type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('📚 Response is not JSON:', text);
        throw new Error('Response is not JSON');
      }
      
      // Parser JSON seulement si tout est OK
      const data = await response.json();
      console.log('📚 Received data:', data);
      
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.compositions)
          ? data.compositions
          : [];
          
      console.log('📚 Processed list:', list.length, 'compositions');
      setComps(list);
      
    } catch (error) {
      console.error('📚 Error fetching compositions:', error);
      setComps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // AJOUTEZ CETTE FONCTION :
  const refreshCompositions = useCallback(async () => {
    console.log('🔄 Refreshing compositions...');
    await fetchCompositions();
  }, [fetchCompositions]);

  useEffect(() => {
    fetchCompositions();
  }, [fetchCompositions]);

  return { 
    communityComps: comps, 
    loading,
    refreshCompositions // ← AJOUTEZ CETTE LIGNE
  };
}