import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiConfig } from '@/config/apiConfig';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => Promise<void>;
  loading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const useMaintenanceMode = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    // Return safe defaults instead of throwing to prevent app crash
    return {
      isMaintenanceMode: false,
      setMaintenanceMode: async () => {},
      loading: false,
    } as MaintenanceContextType;
  }
  return context;
};

interface MaintenanceProviderProps {
  children: ReactNode;
}

export const MaintenanceProvider = ({ children }: MaintenanceProviderProps) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch maintenance mode status on mount
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const url = `${apiConfig.baseURL}/api/system/maintenance`;
        
        // Skip polling if API URL is not configured
        if (url.includes('MISSING_API_URL')) {
          setIsMaintenanceMode(false);
          setLoading(false);
          return;
        }

        // Skip polling if user is not authenticated
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsMaintenanceMode(false);
          setLoading(false);
          return;
        }

        // Use fetch directly to avoid aggressive 401/403 redirect loops
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsMaintenanceMode(data.maintenanceMode || false);
        } else {
          setIsMaintenanceMode(false);
        }
      } catch (error) {
        console.error('Failed to fetch maintenance status:', error);
        // Default to false if can't fetch
        setIsMaintenanceMode(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceStatus();
    
    // Poll for maintenance status every 30 seconds
    const interval = setInterval(fetchMaintenanceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const setMaintenanceMode = async (enabled: boolean) => {
    try {
      const response = await makeApiRequest(`${apiConfig.baseURL}/api/system/maintenance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ maintenanceMode: enabled })
      });

      if (response.ok) {
        setIsMaintenanceMode(enabled);
      } else {
        throw new Error('Failed to update maintenance mode');
      }
    } catch (error) {
      console.error('Failed to set maintenance mode:', error);
      throw error;
    }
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, setMaintenanceMode, loading }}>
      {children}
    </MaintenanceContext.Provider>
  );
};
