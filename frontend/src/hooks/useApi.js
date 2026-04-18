import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook for API calls with loading and error states
 * @param {string} url - API endpoint
 * @param {object} options - Request options (method, data, etc.)
 * @param {boolean} immediate - Whether to call immediately
 * @returns {object} - { data, loading, error, execute, reset }
 */
export const useApi = (url, options = {}, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (customUrl = null, customOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const finalUrl = customUrl || url;
      const finalOptions = { ...options, ...customOptions };
      
      let response;
      if (finalOptions.method === 'POST' || finalOptions.method === 'PUT' || finalOptions.method === 'PATCH') {
        response = await api[finalOptions.method.toLowerCase()](finalUrl, finalOptions.data, finalOptions.config);
      } else if (finalOptions.method === 'DELETE') {
        response = await api.delete(finalUrl, finalOptions.config);
      } else {
        response = await api.get(finalUrl, finalOptions.config);
      }
      
      setData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []); // Only run on mount if immediate is true

  return { data, loading, error, execute, reset };
};

export default useApi;

