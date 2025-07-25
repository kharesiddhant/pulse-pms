'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '../lib/api';

interface User {
  id: number;
  email: string;
  type: string;
  organization_id: number;
  name: string;
  branches_under?: number[] | null;
}

interface LoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: LoginResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUserData = Cookies.get('userData');
    
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
      } catch (error) {
        console.error("Failed to parse user data from cookie", error);
        Cookies.remove('userData');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: LoginResponse) => {
    // Simplified validation - just check if we have basic data
    if (!userData || !userData.access_token || !userData.user) {
      console.error('Invalid login response structure:', userData);
      throw new Error('Invalid login response from server');
    }
    
    const userToStore = userData.user;
    Cookies.set('userData', JSON.stringify(userToStore), { expires: 7 }); // expires in 7 days
    Cookies.set('accessToken', userData.access_token, { expires: 7 });
    Cookies.set('refreshToken', userData.refresh_token, { expires: 14 });
    Cookies.set('loginTime', new Date().toISOString(), { expires: 7 });
    setUser(userToStore);
  };

  const refreshUser = async () => {
    try {
      const response = await fetchWithAuth('/auth/profile');
      
      // Handle backend response structure
      const userData = response.success && response.data ? response.data : response;
      
      // Update user data in state and cookies
      Cookies.set('userData', JSON.stringify(userData), { expires: 7 });
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might need to log in again
      logout();
    }
  };

  const logout = () => {
    Cookies.remove('userData');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('loginTime');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 