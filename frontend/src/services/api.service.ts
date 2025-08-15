import { authService } from './auth.service';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
  }

  // Get authentication headers
  private getAuthHeaders(): HeadersInit {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Make authenticated GET request
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await authService.refreshToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Make authenticated POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await authService.refreshToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`POST request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Make authenticated PUT request
  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await authService.refreshToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PUT request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Make authenticated DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await authService.refreshToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`DELETE request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Make authenticated PATCH request
  async patch<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await authService.refreshToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PATCH request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Check if API is available
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService(); 