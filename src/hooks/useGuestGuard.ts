// hooks/useAuthGuard.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAuthGuard = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if:
    // 1. We're not loading
    // 2. The auth context is initialized (session restoration complete)
    // 3. User is not authenticated
    if (!isLoading && isInitialized && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate, redirectTo]);

  return { 
    isAuthenticated, 
    isLoading: isLoading || !isInitialized // Consider not initialized as loading
  };
};

