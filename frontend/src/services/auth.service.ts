import { User } from '../App';

export interface LoginCredentials {
  email: string;
  password: string;
  organizationId: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
}

class AuthService {
  private baseUrl: string;
  private useMock: boolean;

  constructor() {
    // Use real API by default, fallback to mock only if explicitly needed
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:7401';
    this.useMock = false; // Disable mock mode for real integration
  }

  // Get available organizations
  async getOrganizations(): Promise<Organization[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/organizations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.organizations || [];
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      // Return empty array instead of mock data
      return [];
    }
  }

  // Authenticate user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Login failed: ${response.status}`
        };
      }

      const data = await response.json();
      
      // Debug logging for received token
      console.log('🔑 Auth Service - Login Response:', {
        hasToken: !!data.token,
        tokenLength: data.token ? data.token.length : 0,
        tokenPreview: data.token ? `${data.token.substring(0, 20)}...` : 'none',
        user: data.user ? { id: data.user.id, email: data.user.email, role: data.user.role } : 'no user'
      });
      
      // Store token and user data
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        console.log('✅ Token stored in localStorage');
      } else {
        console.log('❌ No token received in login response');
      }

      return {
        success: true,
        user: data.user,
        token: data.token
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  // Get current token
  getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    
    // Debug logging for token retrieval
    console.log('🔑 Auth Service - Token Retrieved:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      fullToken: token || 'no token'
    });
    
    return token;
  }

  // Get current user data
  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Get fresh user data from server
  async getFreshUserData(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseUrl}/api/v1/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Update stored user data
          localStorage.setItem('user_data', JSON.stringify(data.user));
          console.log('✅ Auth Service - Fresh user data retrieved:', data.user);
          return data.user;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get fresh user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Validate token
  async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${this.baseUrl}/api/v1/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update stored user data with fresh data from server
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
          console.log('✅ Auth Service - User data updated from validate:', data.user);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Refresh token
  async refreshToken(): Promise<string | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          return data.token;
        }
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  // Debug function to check current auth state
  debugAuthState(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    console.log('🔍 Auth Debug - Current State:', {
      token: {
        exists: !!token,
        length: token ? token.length : 0,
        preview: token ? `${token.substring(0, 20)}...` : 'none',
        full: token || 'no token'
      },
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : 'no user',
      isAuthenticated: this.isAuthenticated(),
      localStorage: {
        auth_token: localStorage.getItem('auth_token'),
        user_data: localStorage.getItem('user_data')
      }
    });
  }

  // Get user permissions
  async getUserPermissions(): Promise<string[]> {
    try {
      const token = this.getToken();
      if (!token) return [];

      const response = await fetch(`${this.baseUrl}/api/v1/auth/permissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.permissions || [];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      return [];
    }
  }
}

export const authService = new AuthService();

// Expose debug function globally for browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuth = () => authService.debugAuthState();
  (window as any).authService = authService;
} 