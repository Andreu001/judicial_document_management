import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useProtectedFetching = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  const fetching = async (callback) => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!isAuthenticated()) {
        throw new Error('Требуется авторизация');
      }
      
      const result = await callback();
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return [fetching, isLoading, error];
};