import type { User, AuthTokens } from '../types/auth.types';

class SessionStorageService {
  private static readonly USER_KEY = 'user_data';
  private static readonly TOKENS_KEY = 'auth_tokens';

  // User methods
  static setUser(user: User): void {
    try {
      const userString = JSON.stringify(user);
      localStorage.setItem(this.USER_KEY, userString);
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }

  static getUser(): User | null {
    try {
      const userString = localStorage.getItem(this.USER_KEY);
      
      if (!userString || userString === 'undefined' || userString === 'null') {
        return null;
      }
      
      return JSON.parse(userString) as User;
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  static clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  // Token methods
  static setTokens(tokens: AuthTokens): void {
    try {
      const tokensString = JSON.stringify(tokens);
      localStorage.setItem(this.TOKENS_KEY, tokensString);
      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  static getTokens(): AuthTokens | null {
    try {
      const tokensString = localStorage.getItem(this.TOKENS_KEY);
      
      if (!tokensString || tokensString === 'undefined' || tokensString === 'null') {
        console.log('No tokens found in storage');
        return null;
      }
      
      const tokens = JSON.parse(tokensString) as AuthTokens;
      
      // Check if access token is expired
      if (this.isTokenExpired(tokens.access_token)) {
        console.log('Access token is expired');
      }
      
      return tokens;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      localStorage.removeItem(this.TOKENS_KEY);
      return null;
    }
  }

  static updateAccessToken(accessToken: string): void {
    try {
      const tokens = this.getTokens();
      if (tokens) {
        const updatedTokens = {
          ...tokens,
          access_token: accessToken
        };
        this.setTokens(updatedTokens);
        console.log('Access token updated successfully');
      }
    } catch (error) {
      console.error('Failed to update access token:', error);
    }
  }

  static clearTokens(): void {
    try {
      localStorage.removeItem(this.TOKENS_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Token validation
  static isTokenExpired(token: string): boolean {
    try {
      if (!token) return true;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  // Clear all data
  static clearAll(): void {
    try {
      this.clearUser();
      this.clearTokens();
      console.log('All session data cleared');
    } catch (error) {
      console.error('Failed to clear all session data:', error);
    }
  }
}

export default SessionStorageService;