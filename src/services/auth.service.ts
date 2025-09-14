import SessionStorageService from './sessionStorage.service';
import type {
  LoginCredentials,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthTokens,
  User
} from '../types/auth.types';

class AuthService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:3000') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens and user data immediately after successful login
      if (data.access_token && data.refresh_token) {
        const tokens: AuthTokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token
        };
        SessionStorageService.setTokens(tokens);
        
        // Store user data if provided
        if (data.user) {
          SessionStorageService.setUser(data.user);
        }
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  async logout(): Promise<void> {
    try {
      const tokens = SessionStorageService.getTokens();
      
      if (tokens?.refresh_token) {
        // Call backend logout endpoint if it exists
        await fetch(`${this.apiBaseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.access_token}`,
          },
          body: JSON.stringify({ refresh_token: tokens.refresh_token }),
        }).catch(() => {}); // Ignore errors on logout
      }
    } finally {
      // Always clear local storage
      SessionStorageService.clearAll();
    }
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/forgot_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please try again.');
    }
  }

  async refreshToken(refreshTokenString?: string): Promise<RefreshTokenResponse> {
    try {
      const tokens = SessionStorageService.getTokens();
      const tokenToUse = refreshTokenString || tokens?.refresh_token;
      
      if (!tokenToUse) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: tokenToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Clear invalid tokens
        SessionStorageService.clearAll();
        throw new Error(data.error || 'Token refresh failed');
      }

      // Update stored tokens
      if (data.access_token) {
        const updatedTokens: AuthTokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || tokenToUse
        };
        SessionStorageService.setTokens(updatedTokens);
      }

      return data;
    } catch (error) {
      SessionStorageService.clearAll();
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Token refresh failed');
    }
  }

  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const tokens = SessionStorageService.getTokens();
    
    if (!tokens?.access_token) {
      throw new Error('No access token available');
    }

    const makeRequest = async (token: string) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    };

    let response = await makeRequest(tokens.access_token);

    // If token expired, try to refresh
    if (response.status === 401) {
      try {
        const refreshResponse = await this.refreshToken();
        
        if (refreshResponse.access_token) {
          response = await makeRequest(refreshResponse.access_token);
        }
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        SessionStorageService.clearAll();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Utility methods
  getCurrentUser(): User | null {
    return SessionStorageService.getUser();
  }

  getTokens(): AuthTokens | null {
    return SessionStorageService.getTokens();
  }

  isAuthenticated(): boolean {
    const tokens = SessionStorageService.getTokens();
    if (!tokens?.access_token) {
      return false;
    }

    // Check if token is expired
    return !SessionStorageService.isTokenExpired(tokens.access_token);
  }
}

export default AuthService;