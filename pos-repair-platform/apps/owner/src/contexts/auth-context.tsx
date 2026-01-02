'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { authApi } from '@/lib/api';
import type { User } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (storeEmail: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Set a timeout to ensure loading state doesn't hang forever
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Only allow OWNER and MANAGER roles
          if (userData.role === 'OWNER' || userData.role === 'MANAGER') {
            setToken(storedToken);
            setUser(userData);
            apiClient.setToken(storedToken);
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      
      setIsLoading(false);
      clearTimeout(timeout);
    } catch (error) {
      console.error('Error in auth initialization:', error);
      setIsLoading(false);
      clearTimeout(timeout);
    }
  }, []);

  const login = async (storeEmail: string, pin: string) => {
    try {
      const response = await authApi.login(storeEmail, pin);
      
      const userData: User = {
        employeeId: response.user.employeeId,
        storeId: response.user.storeId,
        role: response.user.role as User['role'],
      };

      // Only allow OWNER and MANAGER roles
      if (userData.role !== 'OWNER' && userData.role !== 'MANAGER') {
        throw new Error('Access denied. Only store owners and managers can access this application.');
      }

      setToken(response.token);
      setUser(userData);
      apiClient.setToken(response.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      }

      // Use replace to avoid adding login to history
      router.replace('/owner/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    router.push('/owner/login');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
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

