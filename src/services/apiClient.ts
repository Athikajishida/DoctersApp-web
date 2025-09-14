// services/apiClient.ts

interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const tokensString = localStorage.getItem('auth_tokens');
    if (tokensString) {
      try {
        const tokens = JSON.parse(tokensString);
        if (tokens.access_token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${tokens.access_token}`,
          };
        }
      } catch (error) {
        console.error('Failed to parse auth tokens:', error);
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: errorData?.error || errorData?.errors?.join(', ') || 'Request failed',
          errors: errorData?.errors || [errorData?.error || 'Request failed'],
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        errors: ['Network error occurred'],
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();