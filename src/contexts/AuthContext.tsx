
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import { msalInstance, loginRequest } from '@/config/authConfig';

interface AuthContextType {
  user: AccountInfo | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  manualLogin: (email: string, password: string) => Promise<void>;
  manualSignUp: (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await msalInstance.initialize();
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          setUser(accounts[0]);
        }
        
        // Check for manually logged in user in localStorage
        const manualUser = localStorage.getItem('manualUser');
        if (manualUser && !accounts.length) {
          setUser(JSON.parse(manualUser));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async () => {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      if (response.account) {
        setUser(response.account);
        // Clear any manual user data
        localStorage.removeItem('manualUser');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const manualLogin = async (email: string, password: string) => {
    try {
      console.log('Manual login attempt:', email);
      
      // Create a mock user object similar to MSAL account structure
      const mockUser: AccountInfo = {
        homeAccountId: `manual-${email}`,
        environment: 'manual',
        tenantId: 'manual-tenant',
        username: email,
        localAccountId: `manual-${email}`,
        name: email.split('@')[0], // Use email prefix as name
        idTokenClaims: {
          aud: 'manual',
          iss: 'manual',
          iat: Date.now() / 1000,
          exp: (Date.now() / 1000) + 3600,
          sub: `manual-${email}`,
          email: email
        }
      };

      setUser(mockUser);
      localStorage.setItem('manualUser', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', 'mock-jwt-token'); // Mock token for admin access
    } catch (error) {
      console.error('Manual login error:', error);
    }
  };

  const manualSignUp = async (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
  }) => {
    try {
      // Basic validation
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (!userData.name || !userData.surname || !userData.department) {
        throw new Error('Please fill in all required fields');
      }

      console.log('Manual sign up attempt:', userData);
      
      // Create a mock user object with full name
      const fullName = `${userData.name} ${userData.surname}`;
      const mockUser: AccountInfo = {
        homeAccountId: `manual-${userData.email}`,
        environment: 'manual',
        tenantId: 'manual-tenant',
        username: userData.email,
        localAccountId: `manual-${userData.email}`,
        name: fullName,
        idTokenClaims: {
          aud: 'manual',
          iss: 'manual',
          iat: Date.now() / 1000,
          exp: (Date.now() / 1000) + 3600,
          sub: `manual-${userData.email}`,
          email: userData.email,
          given_name: userData.name,
          family_name: userData.surname,
          department: userData.department
        }
      };

      setUser(mockUser);
      localStorage.setItem('manualUser', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', 'mock-jwt-token'); // Mock token for admin access
    } catch (error) {
      console.error('Manual sign up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Password reset requested for:', email);
      // In a real app, this would call your backend API
      // For now, we'll just simulate the request
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        await msalInstance.logoutPopup();
      }
      localStorage.removeItem('manualUser');
      localStorage.removeItem('auth_token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    manualLogin,
    manualSignUp,
    resetPassword,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
