/**
 * API Client Helper
 * 
 * Provides utilities for making HTTP requests to the API during tests
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class APIClient {
  private client: AxiosInstance;
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:7401') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<AxiosResponse> {
    return this.get('/health');
  }

  /**
   * Login and get auth token
   */
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.post('/auth/login', { email, password });
    const { token, user } = response.data;
    this.setAuthToken(token);
    return { token, user };
  }

  /**
   * Logout and clear auth token
   */
  async logout(): Promise<void> {
    await this.post('/auth/logout');
    this.clearAuthToken();
  }
}

export default APIClient; 