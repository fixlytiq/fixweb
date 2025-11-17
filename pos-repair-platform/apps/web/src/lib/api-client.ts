// API Client utility for making authenticated requests to the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export class ApiClientError extends Error {
  statusCode: number;
  error?: string;

  constructor(message: string, statusCode: number, error?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorCode = response.status;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorCode = errorData.statusCode || response.status;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // For 401 errors, clear the token as it's likely expired or invalid
    if (errorCode === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    throw new ApiClientError(errorMessage, errorCode);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
  }
}

  getToken(): string | null {
    if (this.token) {
      return this.token;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Log warning if no token is available (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.warn('API Client: No authentication token found. Request may fail with 401 Unauthorized.');
      }
    }

    return headers;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    try {
      const url = new URL(`${this.baseURL}${endpoint}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiClientError(
          `Unable to connect to the server. Please ensure the backend is running on ${this.baseURL}`,
          0,
          'NetworkError'
        );
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiClientError(
          `Unable to connect to the server. Please ensure the backend is running on ${this.baseURL}`,
          0,
          'NetworkError'
        );
      }
      throw error;
    }
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiClientError(
          `Unable to connect to the server. Please ensure the backend is running on ${this.baseURL}`,
          0,
          'NetworkError'
        );
      }
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return handleResponse<T>(response);
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiClientError(
          `Unable to connect to the server. Please ensure the backend is running on ${this.baseURL}`,
          0,
          'NetworkError'
        );
      }
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Initialize token from localStorage on client side
// Note: This runs at module load time, but the AuthContext also sets the token on mount
// This is a fallback to ensure the token is available even if AuthContext hasn't loaded yet
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token');
  if (token) {
    apiClient.setToken(token);
    if (process.env.NODE_ENV === 'development') {
      console.log('API Client: Token initialized from localStorage');
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('API Client: No token found in localStorage. User may need to log in.');
    }
  }
}

