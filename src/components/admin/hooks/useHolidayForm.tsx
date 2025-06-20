
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from '@/config/apiConfig';

interface HolidayFormData {
  name: string;
  date: Date | undefined;
  type: string;
  description: string;
  office_status: string;
}

interface UseHolidayFormProps {
  onHolidayAdded: () => void;
  hasValidToken: () => boolean;
  getAuthHeaders: () => Record<string, string>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
}

export const useHolidayForm = ({
  onHolidayAdded,
  hasValidToken,
  getAuthHeaders,
  loading,
  setLoading,
  onClose
}: UseHolidayFormProps) => {
  const { toast } = useToast();
  const [newHoliday, setNewHoliday] = useState<HolidayFormData>({
    name: "",
    date: undefined,
    type: "public",
    description: "",
    office_status: "closed"
  });

  const resetForm = () => {
    setNewHoliday({
      name: "",
      date: undefined,
      type: "public",
      description: "",
      office_status: "closed"
    });
  };

  const handleAddHoliday = async () => {
    console.log('Starting holiday creation process...');
    console.log('Holiday data:', newHoliday);

    if (!newHoliday.name || !newHoliday.date) {
      console.log('Validation failed: Missing name or date');
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!hasValidToken()) {
      console.log('Authentication failed: No valid token');
      toast({
        title: "Authentication Required",
        description: "Please log in to add holidays.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        name: newHoliday.name,
        date: format(newHoliday.date, 'yyyy-MM-dd'),
        type: newHoliday.type,
        description: newHoliday.description,
        office_status: newHoliday.office_status,
        is_recurring: false
      };

      console.log('Sending request to:', apiConfig.endpoints.holiday);
      console.log('Request data:', requestData);
      console.log('Headers:', getAuthHeaders());

      const response = await fetch(apiConfig.endpoints.holiday, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Holiday created successfully');
        onHolidayAdded();
        resetForm();
        onClose();

        toast({
          title: "Holiday Added",
          description: `${newHoliday.name} has been added to the holiday calendar.`,
        });
      } else {
        console.error('Server returned error:', response.status, responseData);
        throw new Error(responseData.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please check your connection and ensure the server is running.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message === 'No valid authentication token') {
        toast({
          title: "Authentication Required",
          description: "Please log in to add holidays.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Adding Holiday",
          description: error instanceof Error ? error.message : "Failed to add holiday. Check console for details.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    newHoliday,
    setNewHoliday,
    handleAddHoliday,
    resetForm
  };
};
