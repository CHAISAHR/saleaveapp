
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import { msalInstance, loginRequest } from '@/config/authConfig';

interface AuthContextType {
  user: AccountInfo | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  manualLogin: (email: string, password: string) => Promise<void>;
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
      // Simulate authentication - in real app, this would call your backend
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
    } catch (error) {
      console.error('Manual login error:', error);
    }
  };

  const logout = async () => {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        await msalInstance.logoutPopup();
      }
      localStorage.removeItem('manualUser');
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
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
