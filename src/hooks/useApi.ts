import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export function useApi<T>(
  apiCall: () => Promise<any>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response);
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

export function useAudioFiles(params?: any) {
  return useApi(
    () => apiService.getAudioFiles(params),
    [params]
  );
}

export function useBackgrounds(params?: any) {
  return useApi(
    () => apiService.getBackgrounds(params),
    [params]
  );
}

export function useCharacters(params?: any) {
  return useApi(
    () => apiService.getCharacters(params),
    [params]
  );
}