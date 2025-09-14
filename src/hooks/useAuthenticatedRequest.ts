// hooks/useAuthenticatedRequest.ts
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/auth.service';
import SessionStorageService from '../services/sessionStorage.service';

export const useAuthenticatedRequest = () => {
  const { tokens, logout } = useAuth();
  
  // Create a stable authService instance
  const authService = new AuthService();

  const makeRequest = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      if (!tokens) {
        throw new Error('No authentication tokens available');
      }

      try {
        const response = await authService.makeAuthenticatedRequest(
          url,
          options,
          tokens,
          (newToken) => {
            SessionStorageService.updateAccessToken(newToken);
          }
        );
        return response;
      } catch (error) {
        // If authentication fails completely, logout
        if (error instanceof Error && error.message === 'Authentication failed') {
          logout();
        }
        throw error;
      }
    },
    [tokens, logout] // Remove authService from dependencies to prevent recreation
  );

  return { makeRequest };
};
