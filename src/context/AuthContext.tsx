// context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type {ReactNode} from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState, AuthContextType, LoginCredentials, User, AuthTokens } from '../types/auth.types';
import AuthService from '../services/auth.service';
import SessionStorageService from '../services/sessionStorage.service';

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'FORGOT_PASSWORD_START' }
  | { type: 'FORGOT_PASSWORD_SUCCESS' }
  | { type: 'FORGOT_PASSWORD_FAILURE'; payload: string }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE_SESSION'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'SET_INITIALIZED' };

// Initial State
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'FORGOT_PASSWORD_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true, // Set initialized on successful login
      };

    case 'LOGIN_FAILURE':
    case 'FORGOT_PASSWORD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isInitialized: true, // Set initialized even on failure
      };

    case 'FORGOT_PASSWORD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true, // Keep initialized after logout
      };

    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        tokens: state.tokens ? {
          ...state.tokens,
          access_token: action.payload,
        } : null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  apiBaseUrl = 'http://localhost:3000' 
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const authService = new AuthService(apiBaseUrl);

  // Memoize refresh token function to prevent infinite loops
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const tokens = SessionStorageService.getTokens();
    
    if (!tokens) {
      dispatch({ type: 'LOGOUT' });
      return false;
    }

    try {
      const response = await authService.refreshToken(tokens.refresh_token);

      SessionStorageService.updateAccessToken(response.access_token);
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: response.access_token });
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      SessionStorageService.clearAll();
      dispatch({ type: 'LOGOUT' });
      return false;
    }
  }, [authService]);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const tokens = SessionStorageService.getTokens();
        let user = SessionStorageService.getUser();

        if (tokens) {
          if (SessionStorageService.isTokenExpired(tokens.access_token)) {
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
              const updatedTokens = SessionStorageService.getTokens();
              if (updatedTokens) {
                user = SessionStorageService.getUser();
                if (user) {
                  dispatch({
                    type: 'RESTORE_SESSION',
                    payload: { user, tokens: updatedTokens }
                  });
                  return;
                }
              }
            }
            SessionStorageService.clearAll();
            dispatch({ type: 'SET_INITIALIZED' });
          } else {
            if (user) {
              dispatch({
                type: 'RESTORE_SESSION',
                payload: { user, tokens }
              });
            } else {
              try {
                const tokenPayload = JSON.parse(atob(tokens.access_token.split('.')[1]));
                const userFromToken: User = {
                  id: tokenPayload.admin_user_id?.toString() || '0',
                  email_address: 'admin@mediconnect.com',
                  full_name: 'Admin User',
                  role: 'admin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                
                SessionStorageService.setUser(userFromToken);
                
                dispatch({
                  type: 'RESTORE_SESSION',
                  payload: { 
                    user: userFromToken,
                    tokens 
                  }
                });
              } catch (fetchError) {
                console.error('Failed to create user from token:', fetchError);
                const fallbackUser: User = {
                  id: '0',
                  email_address: 'admin@mediconnect.com',
                  full_name: 'Admin User',
                  role: 'admin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                
                SessionStorageService.setUser(fallbackUser);
                
                dispatch({
                  type: 'RESTORE_SESSION',
                  payload: { 
                    user: fallbackUser,
                    tokens 
                  }
                });
              }
            }
          }
        } else {
          dispatch({ type: 'SET_INITIALIZED' });
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        SessionStorageService.clearAll();
        dispatch({ type: 'SET_INITIALIZED' });
      }
    };

    if (!state.isInitialized) {
      restoreSession();
    }
  }, [refreshToken, state.isInitialized]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authService.login(credentials);
      
      const tokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };

      SessionStorageService.setTokens(tokens);

      let user: User;
      if (response.user) {
        user = response.user;
        SessionStorageService.setUser(user);
      } else {
        try {
          const tokenPayload = JSON.parse(atob(response.access_token.split('.')[1]));
          user = {
            id: tokenPayload.admin_user_id?.toString() || '0',
            email_address: credentials.email_address,
            full_name: 'Admin User',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          SessionStorageService.setUser(user);
        } catch (tokenError) {
          console.error('Failed to decode token:', tokenError);
          user = {
            id: '0',
            email_address: credentials.email_address,
            full_name: 'Admin User',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          SessionStorageService.setUser(user);
        }
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user,
          tokens,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  }, [authService]);

  // Memoize logout function
  const logout = useCallback((): void => {
    SessionStorageService.clearAll();
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  }, [navigate]);

  // Memoize forgot password function
  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    dispatch({ type: 'FORGOT_PASSWORD_START' });

    try {
      await authService.forgotPassword({ email_address: email });
      dispatch({ type: 'FORGOT_PASSWORD_SUCCESS' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      dispatch({ type: 'FORGOT_PASSWORD_FAILURE', payload: errorMessage });
      throw error; // Re-throw to allow component to handle
    }
  }, [authService]);

  // Memoize clear error function
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    forgotPassword,
    refreshToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};