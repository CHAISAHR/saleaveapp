
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from '@/config/apiConfig';
import { HolidayForm } from "./HolidayForm";
import { HolidayList } from "./HolidayList";
import { HolidayErrorCard } from "./HolidayErrorCard";

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  description: string;
  office_status: string;
}

export const HolidayManagement = () => {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);

  // Check if we have a valid token
  const hasValidToken = () => {
    const authToken = localStorage.getItem('auth_token');
    console.log('[HolidayManagement] Checking auth token:', authToken ? 'present' : 'missing');
    return authToken && authToken !== 'null' && authToken !== '';
  };

  // Get authorization headers
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    console.log('[HolidayManagement] Getting auth headers, token present:', !!authToken);
    console.log('[HolidayManagement] Token value:', authToken);
    
    if (!authToken || authToken === 'null' || authToken === '') {
      console.error('[HolidayManagement] No valid authentication token');
      throw new Error('No valid authentication token');
    }
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    console.log('[HolidayManagement] Request headers:', headers);
    return headers;
  };

  // Fetch holidays from backend
  const fetchHolidays = async () => {
    console.log('[HolidayManagement] Starting fetchHolidays...');
    
    if (!hasValidToken()) {
      console.warn('[HolidayManagement] No valid token, showing auth required message');
      setBackendError(true);
      toast({
        title: "Authentication Required",
        description: "Please log in to access holiday management.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setBackendError(false);
      
      const url = apiConfig.endpoints.holiday;
      console.log('[HolidayManagement] Fetching holidays from:', url);
      
      const headers = getAuthHeaders();
      
      const response = await fetch(url, { headers });
      
      console.log('[HolidayManagement] Fetch response status:', response.status);
      console.log('[HolidayManagement] Fetch response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[HolidayManagement] Successfully fetched holidays:', data.holidays?.length || 0);
        setHolidays(data.holidays || []);
      } else if (response.status === 401) {
        console.warn('[HolidayManagement] 401 - Authentication failed');
        console.warn('[HolidayManagement] This usually means the token is invalid or expired in production');
        setBackendError(true);
        toast({
          title: "Authentication Failed",
          description: "Your session has expired or the authentication token is invalid. Please log in again.",
          variant: "destructive",
        });
      } else if (response.status === 403) {
        console.warn('[HolidayManagement] 403 - Admin access denied');
        toast({
          title: "Access Denied",
          description: "Admin privileges required for holiday management.",
          variant: "destructive",
        });
      } else {
        console.error('[HolidayManagement] HTTP error:', response.status);
        throw new Error(`HTTP ${response.status}: Failed to fetch holidays`);
      }
    } catch (error) {
      console.error('[HolidayManagement] Error fetching holidays:', error);
      setBackendError(true);
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        console.error('[HolidayManagement] Network error - backend connection failed');
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please check your connection.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message === 'No valid authentication token') {
        console.error('[HolidayManagement] Auth token error');
        toast({
          title: "Authentication Required",
          description: "Please log in to access holiday management.",
          variant: "destructive",
        });
      } else {
        console.error('[HolidayManagement] Unknown error:', error);
        toast({
          title: "Error",
          description: "Failed to load holidays. Please try logging in again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      console.log('[HolidayManagement] Fetch holidays completed');
    }
  };

  // Load holidays on component mount
  useEffect(() => {
    console.log('[HolidayManagement] Component mounted, fetching holidays...');
    fetchHolidays();
  }, []);

  // Show backend connection error if there's an error
  if (backendError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Holiday Management</h2>
            <p className="text-gray-600">Manage company holidays and office closure dates</p>
          </div>
        </div>

        <HolidayErrorCard onRetry={fetchHolidays} loading={loading} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Holiday Management</h2>
          <p className="text-gray-600">Manage company holidays and office closure dates</p>
        </div>
        <HolidayForm 
          onHolidayAdded={fetchHolidays}
          hasValidToken={hasValidToken}
          getAuthHeaders={getAuthHeaders}
          loading={loading}
          setLoading={setLoading}
        />
      </div>

      <HolidayList holidays={holidays} loading={loading} />
    </div>
  );
};
