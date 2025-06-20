
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
    return authToken && authToken !== 'null' && authToken !== '';
  };

  // Get authorization headers
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken || authToken === 'null' || authToken === '') {
      throw new Error('No valid authentication token');
    }
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch holidays from backend
  const fetchHolidays = async () => {
    if (!hasValidToken()) {
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
      
      const response = await fetch(apiConfig.endpoints.holiday, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      } else if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
      } else {
        throw new Error('Failed to fetch holidays');
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      setBackendError(true);
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please check your connection.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message === 'No valid authentication token') {
        toast({
          title: "Authentication Required",
          description: "Please log in to access holiday management.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load holidays",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load holidays on component mount
  useEffect(() => {
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
