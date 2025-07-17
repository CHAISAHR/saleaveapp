
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import { apiConfig, makeApiRequest } from '@/config/apiConfig';

interface AuthContextType {
  user: AccountInfo | null;
  isAuthenticated: boolean;
  manualLogin: (email: string, password: string) => Promise<void>;
  mockAdminLogin: () => void;
  manualSignUp: (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
    gender: string;
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
      console.log('[AuthContext] Initializing authentication...');
      try {
        // Check for manually logged in user and validate token
        const authToken = localStorage.getItem('auth_token');
        const manualUser = localStorage.getItem('manualUser');
        
        console.log('[AuthContext] Manual auth token present:', !!authToken);
        console.log('[AuthContext] Manual user data present:', !!manualUser);
        
        if (authToken && authToken !== 'mock-jwt-token' && manualUser) {
          console.log('[AuthContext] Validating manual login token...');
          try {
            // Validate token with backend
            const response = await fetch(`${apiConfig.endpoints.auth}/me`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('[AuthContext] Token validation response:', response.status);
            
            if (response.ok) {
              const userData = await response.json();
              console.log('[AuthContext] Token validation successful, user role:', userData.user.role);
              // Create AccountInfo-like object from backend user data
              const userAccount: AccountInfo = {
                homeAccountId: `manual-${userData.user.email}`,
                environment: 'manual',
                tenantId: 'manual-tenant',
                username: userData.user.email,
                localAccountId: `manual-${userData.user.email}`,
                name: userData.user.name,
                idTokenClaims: {
                  aud: 'manual',
                  iss: 'manual',
                  iat: Date.now() / 1000,
                  exp: (Date.now() / 1000) + 3600,
                  sub: `manual-${userData.user.email}`,
                  email: userData.user.email,
                  role: userData.user.role
                }
              };
              setUser(userAccount);
            } else {
              console.warn('[AuthContext] Token validation failed:', response.status);
              // Token is invalid, clear it
              localStorage.removeItem('auth_token');
              localStorage.removeItem('manualUser');
            }
          } catch (error) {
            console.error('[AuthContext] Token validation error:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('manualUser');
          }
        }

        // Check for mock admin login
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser && !authToken) {
          console.log('[AuthContext] Setting mock user');
          setUser(JSON.parse(mockUser));
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
      } finally {
        setLoading(false);
        console.log('[AuthContext] Auth initialization completed');
      }
    };

    initializeAuth();
  }, []);

  const mockAdminLogin = () => {
    console.log('Mock admin login triggered');
    
    // Create a mock admin user
    const mockAdminAccount: AccountInfo = {
      homeAccountId: 'mock-admin@company.com',
      environment: 'mock',
      tenantId: 'mock-tenant',
      username: 'admin@company.com',
      localAccountId: 'mock-admin@company.com',
      name: 'Admin User',
      idTokenClaims: {
        aud: 'mock',
        iss: 'mock',
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + 86400, // 24 hours
        sub: 'mock-admin@company.com',
        email: 'admin@company.com',
        role: 'admin',
        department: 'HR & Operations',
        given_name: 'Admin',
        family_name: 'User'
      }
    };

    setUser(mockAdminAccount);
    localStorage.setItem('mockUser', JSON.stringify(mockAdminAccount));
    localStorage.setItem('auth_token', 'mock-admin-token');
    
    console.log('Mock admin login successful');
  };

  const manualLogin = async (email: string, password: string) => {
    try {
      console.log('Manual login attempt:', email);
      
      const response = await makeApiRequest(`${apiConfig.endpoints.auth}/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        // Store the real JWT token
        localStorage.setItem('auth_token', data.token);
        
        // Create AccountInfo-like object from backend user data
        const userAccount: AccountInfo = {
          homeAccountId: `manual-${data.user.email}`,
          environment: 'manual',
          tenantId: 'manual-tenant',
          username: data.user.email,
          localAccountId: `manual-${data.user.email}`,
          name: data.user.name,
          idTokenClaims: {
            aud: 'manual',
            iss: 'manual',
            iat: Date.now() / 1000,
            exp: (Date.now() / 1000) + 86400, // 24 hours
            sub: `manual-${data.user.email}`,
            email: data.user.email,
            role: data.user.role,
            department: data.user.department
          }
        };

        setUser(userAccount);
        localStorage.setItem('manualUser', JSON.stringify(userAccount));
        // Clear mock user if it exists
        localStorage.removeItem('mockUser');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Manual login error:', error);
      throw error;
    }
  };

  const manualSignUp = async (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
    gender: string;
  }) => {
    try {
      // Basic validation
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (!userData.name || !userData.surname || !userData.department || !userData.gender) {
        throw new Error('Please fill in all required fields');
      }

      console.log('Manual sign up attempt:', userData);
      
      const response = await makeApiRequest(`${apiConfig.endpoints.auth}/register`, {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          surname: userData.surname,
          department: userData.department,
          gender: userData.gender
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // After successful registration, log the user in
        await manualLogin(userData.email, userData.password);
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Manual sign up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('[AuthContext] Password reset requested for:', email);
      console.log('[AuthContext] API endpoint:', `${apiConfig.endpoints.auth}/reset-password`);
      
      if (!email || !email.includes('@')) {
        console.error('[AuthContext] Invalid email provided:', email);
        throw new Error('Please enter a valid email address');
      }
      
      const requestBody = JSON.stringify({ email });
      console.log('[AuthContext] Request body:', requestBody);
      
      const requestOptions = {
        method: 'POST',
        body: requestBody
      };
      console.log('[AuthContext] Request options:', requestOptions);
      
      const response = await makeApiRequest(`${apiConfig.endpoints.auth}/reset-password`, requestOptions);
      console.log('[AuthContext] Response received:', response.status, response.statusText);

      const data = await response.json();
      console.log('[AuthContext] Response data:', data);
      
      if (!data.success) {
        console.error('[AuthContext] Server returned error:', data.message);
        throw new Error(data.message || 'Password reset failed');
      }
      
      console.log('[AuthContext] Password reset request successful for:', email);
    } catch (error: any) {
      console.error('[AuthContext] Password reset error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        email: email
      });
      
      // Provide user-friendly error messages
      if (error.message.includes('HTTP error! status: 500')) {
        throw new Error('Server error. Please try again later or contact support.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.message.includes('Cannot GET')) {
        throw new Error('Server configuration error. The password reset endpoint is not properly configured.');
      } else {
        throw new Error(error.message || 'Password reset failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('manualUser');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('mockUser');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    manualLogin,
    mockAdminLogin,
    manualSignUp,
    resetPassword,
    logout,
    loading,
  };

  console.log('[AuthContext] Current auth state - user:', user?.username, 'authenticated:', !!user);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
