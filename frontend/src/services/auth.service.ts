import { User } from '../App';

// Mock data for development
const mockOrganizations = [
  { id: '1', name: 'AdTech Solutions Inc' },
  { id: '2', name: 'Digital Marketing Co' },
  { id: '3', name: 'Brand Publishers LLC' },
];

const mockUsers = [
  {
    id: '1',
    email: 'admin@adtech.com',
    password: 'admin123',
    name: 'John Admin',
    role: 'admin' as const,
    organizationId: '1',
  },
  {
    id: '2',
    email: 'advertiser@digital.com',
    password: 'advertiser123',
    name: 'Sarah Advertiser',
    role: 'advertiser' as const,
    organizationId: '2',
  },
  {
    id: '3',
    email: 'publisher@brand.com',
    password: 'publisher123',
    name: 'Mike Publisher',
    role: 'publisher' as const,
    organizationId: '3',
  },
];

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
    // Use mock data in development, real API in production
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
    this.useMock = (import.meta as any).env?.NODE_ENV === 'development' || !(import.meta as any).env?.VITE_API_URL;
  }

  // Get available organizations
  async getOrganizations(): Promise<Organization[]> {
    if (this.useMock) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockOrganizations.map(org => ({
        ...org,
        type: 'ADVERTISER',
        status: 'active'
      }));
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/admin/organizations`, {
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
      // Fallback to mock data if API fails
      return mockOrganizations.map(org => ({
        ...org,
        type: 'ADVERTISER',
        status: 'active'
      }));
    }
  }

  // Authenticate user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (this.useMock) {
      // Mock authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = mockUsers.find(u => 
        u.email === credentials.email && 
        u.password === credentials.password &&
        u.organizationId === credentials.organizationId
      );
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials or organization mismatch'
        };
      }

      const organization = mockOrganizations.find(org => org.id === credentials.organizationId);
      
      const userData: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: credentials.organizationId,
        organizationName: organization?.name || '',
      };

      // Store mock token in localStorage
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user_data', JSON.stringify(userData));

      return {
        success: true,
        user: userData,
        token: mockToken
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
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
          error: errorData.message || `Login failed: ${response.status}`
        };
      }

      const data = await response.json();
      
      // Store token and user data
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
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
    if (this.useMock) {
      // Clear mock data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      return;
    }

    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseUrl}/api/auth/logout`, {
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
    return localStorage.getItem('auth_token');
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

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Validate token (for real API)
  async validateToken(): Promise<boolean> {
    if (this.useMock) {
      return this.isAuthenticated();
    }

    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Refresh token (for real API)
  async refreshToken(): Promise<string | null> {
    if (this.useMock) {
      return this.getToken();
    }

    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
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

  // Get user permissions (for real API)
  async getUserPermissions(): Promise<string[]> {
    if (this.useMock) {
      const user = this.getCurrentUser();
      if (!user) return [];

      // Mock permissions based on role
      switch (user.role) {
        case 'admin':
          return ['ORG_CREATE', 'USER_MANAGE', 'API_KEY_MANAGE', 'SYSTEM_ACCESS'];
        case 'advertiser':
          return ['CAMPAIGN_MANAGE', 'ANALYTICS_READ', 'AUDIENCE_MANAGE'];
        case 'publisher':
          return ['SITE_MANAGE', 'AD_UNIT_MANAGE', 'EARNINGS_READ'];
        default:
          return [];
      }
    }

    try {
      const token = this.getToken();
      if (!token) return [];

      const response = await fetch(`${this.baseUrl}/api/auth/permissions`, {
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