import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
}

// Specific hooks for different API endpoints
export function useBackgrounds(params?: any) {
  return useApi(
    () => apiService.getBackgrounds(params),
    [params]
  );
}

export function useAudioFiles(params?: any) {
  return useApi(
    () => apiService.getAudioFiles(params),
    [params]
  );
}

export function useCharacters(params?: any) {
  return useApi(
    () => apiService.getCharacters(params),
    [params]
  );
}

// Add other specific hooks as needed
export function useBackground(id: string) {
  return useApi(
    () => apiService.getBackground(id),
    [id]
  );
}

export function useCharacter(id: string) {
  return useApi(
    () => apiService.getCharacter(id),
    [id]
  );
}

export function useAudioFile(id: string) {
  return useApi(
    () => apiService.getAudioFile(id),
    [id]
  );
}