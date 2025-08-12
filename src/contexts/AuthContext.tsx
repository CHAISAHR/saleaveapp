
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
    console.error('[useAuth] Context is undefined - AuthProvider may not be properly mounted');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AuthProvider] Mounting AuthProvider...');
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
          console.log('[AuthContext] Found stored manual login data');
          console.log('[AuthContext] Token exists:', !!authToken);
          
          // Skip backend validation if localhost is not available
          // Just use stored user data if API is pointing to localhost
          if (apiConfig.baseURL.includes('localhost')) {
            console.log('[AuthContext] Backend not available (localhost), using stored user data');
            try {
              const storedUser = JSON.parse(manualUser);
              if (storedUser && storedUser.username) {
                console.log('[AuthContext] Successfully restored user from localStorage:', storedUser.username);
                setUser(storedUser);
              } else {
                console.warn('[AuthContext] Invalid stored user data, clearing');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('manualUser');
              }
            } catch (error) {
              console.error('[AuthContext] Error parsing stored user data:', error);
              localStorage.removeItem('auth_token');
              localStorage.removeItem('manualUser');
            }
          } else {
            // Only try backend validation if we have a real API URL
            console.log('[AuthContext] Validating manual login token with backend...');
            
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
                    exp: (Date.now() / 1000) + 86400, // 24 hours
                    sub: `manual-${userData.user.email}`,
                    email: userData.user.email,
                    role: userData.user.role,
                    department: userData.user.department
                  }
                };
                setUser(userAccount);
              } else {
                console.warn('[AuthContext] Token validation failed:', response.status);
                // Fallback to stored user data
                const storedUser = JSON.parse(manualUser);
                if (storedUser && storedUser.username) {
                  console.log('[AuthContext] Using stored user data as fallback:', storedUser.username);
                  setUser(storedUser);
                } else {
                  console.warn('[AuthContext] Clearing invalid token and user data');
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('manualUser');
                }
              }
            } catch (error) {
              console.error('[AuthContext] Token validation error:', error);
              // Always fallback to stored user data on network errors
              console.log('[AuthContext] Network error during validation, using stored user data');
              try {
                const storedUser = JSON.parse(manualUser);
                if (storedUser && storedUser.username) {
                  console.log('[AuthContext] Successfully restored user from localStorage:', storedUser.username);
                  setUser(storedUser);
                } else {
                  console.warn('[AuthContext] No valid stored user data found');
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('manualUser');
                }
              } catch (parseError) {
                console.error('[AuthContext] Error parsing stored user data:', parseError);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('manualUser');
              }
            }
          }
        }

        // Check for mock admin login only if there's no manual auth
        const mockUser = localStorage.getItem('mockUser');
        const mockToken = localStorage.getItem('auth_token');
        
        if (mockUser && mockToken === 'mock-admin-token' && !manualUser) {
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
      homeAccountId: 'mock-chaisahr@clintonhealthaccess.org',
      environment: 'mock',
      tenantId: 'mock-tenant',
      username: 'chaisahr@clintonhealthaccess.org',
      localAccountId: 'mock-chaisahr@clintonhealthaccess.org',
      name: 'Admin User',
      idTokenClaims: {
        aud: 'mock',
        iss: 'mock',
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + 86400, // 24 hours
        sub: 'mock-chaisahr@clintonhealthaccess.org',
        email: 'chaisahr@clintonhealthaccess.org',
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
      
      // Check if backend is available (not localhost fallback)
      if (apiConfig.baseURL.includes('localhost')) {
        console.log('Backend not available, using mock authentication');
        // Create a mock authenticated user for demo purposes
        const mockUserAccount: AccountInfo = {
          homeAccountId: `manual-${email}`,
          environment: 'manual',
          tenantId: 'manual-tenant',
          username: email,
          localAccountId: `manual-${email}`,
          name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          idTokenClaims: {
            aud: 'manual',
            iss: 'manual',
            iat: Date.now() / 1000,
            exp: (Date.now() / 1000) + 86400, // 24 hours
            sub: `manual-${email}`,
            email: email,
            role: email.includes('admin') ? 'admin' : 'employee',
            department: 'Development'
          }
        };

        setUser(mockUserAccount);
        localStorage.setItem('manualUser', JSON.stringify(mockUserAccount));
        localStorage.setItem('auth_token', 'mock-jwt-token-' + Date.now());
        // Clear mock user if it exists
        localStorage.removeItem('mockUser');
        return;
      }
      
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
      // If it's a network error and we're using localhost, provide a helpful message
      if (error instanceof Error && error.message.includes('Failed to fetch') && apiConfig.baseURL.includes('localhost')) {
        throw new Error('Backend server not available. Please start the backend server or use mock authentication.');
      }
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
  console.log('[AuthProvider] Rendering with context value...');

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
