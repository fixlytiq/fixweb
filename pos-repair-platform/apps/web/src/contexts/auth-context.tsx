'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export interface User {
  employeeId: string;
  storeId: string;
  role: 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (storeEmail: string, pin: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  ownerName: string;
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  notificationEmail?: string;
  pin: string;
}

interface LoginResponse {
  token: string;
  user: {
    employeeId: string;
    storeId: string;
    role: 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
  };
}

interface RegisterResponse {
  token: string;
  store: {
    id: string;
    name: string;
    storeEmail: string;
  };
  employee: {
    id: string;
    name: string;
    role: 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        apiClient.setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (storeEmail: string, pin: string) => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        storeEmail,
        pin,
      });

      // Backend returns user data directly in response
      const userData: User = {
        employeeId: response.user.employeeId,
        storeId: response.user.storeId,
        role: response.user.role,
      };

      setToken(response.token);
      setUser(userData);
      apiClient.setToken(response.token);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(userData));

      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register', data);

      // Backend returns token and user data directly
      const userData: User = {
        employeeId: response.employee.id,
        storeId: response.store.id,
        role: response.employee.role,
      };

      setToken(response.token);
      setUser(userData);
      apiClient.setToken(response.token);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(userData));

      // Redirect to dashboard after successful registration
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
