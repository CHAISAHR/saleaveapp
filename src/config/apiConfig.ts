
// API configuration for different environments
// Use VITE_API_URL environment variable from production settings
const getApiBaseUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  
  console.log('Environment variables check:', {
    VITE_API_URL: viteApiUrl,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  });
  
  // If VITE_API_URL is not set, provide fallback based on environment
  if (!viteApiUrl) {
    console.warn('VITE_API_URL environment variable is not set, using fallback');
    
    // In development, use localhost on port 3001 (where the server runs)
    if (import.meta.env.DEV) {
      const fallbackUrl = 'http://localhost:3001';
      console.log('Using development fallback:', fallbackUrl);
      return fallbackUrl;
    }
    
    // In production, you should set VITE_API_URL in your deployment settings
    // For now, we'll return a placeholder that will trigger mock data
    console.error('Production deployment missing VITE_API_URL. Please configure it in project settings.');
    return 'MISSING_API_URL'; // This will trigger mock data responses
  }
  
  console.log('Selected API base URL:', viteApiUrl);
  return viteApiUrl;
};

const API_BASE_URL = getApiBaseUrl();

console.log('Final API Configuration:', {
  API_BASE_URL: API_BASE_URL,
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV
});

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: `${API_BASE_URL}/api/auth`,
    users: `${API_BASE_URL}/api/users`,
    leave: `${API_BASE_URL}/api/leave`,
    balance: `${API_BASE_URL}/api/balance`,
    holiday: `${API_BASE_URL}/api/holiday`,
    rollover: `${API_BASE_URL}/api/rollover`,
    departments: `${API_BASE_URL}/api/departments`,
    audit: `${API_BASE_URL}/api/audit`
  }
};

// Helper function for making API requests with proper error handling and fallback to mock data
export const makeApiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    
    // If API URL is missing, immediately return mock data
    if (url.includes('MISSING_API_URL')) {
      console.warn('API URL not configured, returning mock data');
      return createMockResponse(url);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Check if this is a network error (backend unavailable)
    if (error instanceof Error && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
      console.warn('Backend unavailable, falling back to mock data');
      // Return a mock response for demonstration purposes
      return createMockResponse(url);
    }
    
    throw error;
  }
};

// Mock data generator for when backend is unavailable
const createMockResponse = (url: string): Response => {
  let mockData: any = [];
  
  if (url.includes('/api/leave')) {
    mockData = [
      {
        id: 1,
        employeeName: 'John Doe',
        Requester: 'john.doe@example.com',
        leaveType: 'Annual Leave',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        Status: 'approved',
        daysRequested: 5,
        manager: 'jane.smith@example.com'
      },
      {
        id: 2,
        employeeName: 'Sarah Wilson',
        Requester: 'sarah.wilson@example.com',
        leaveType: 'Sick Leave',
        startDate: '2025-01-18',
        endDate: '2025-01-19',
        Status: 'approved',
        daysRequested: 2,
        manager: 'jane.smith@example.com'
      }
    ];
  } else if (url.includes('/api/balance')) {
    mockData = [
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        department: 'Engineering',
        annualLeave: 15.5,
        sickLeave: 8,
        familyResponsibility: 3,
        maternityLeave: 0,
        paternityLeave: 0,
        studyLeave: 5
      },
      {
        email: 'sarah.wilson@example.com',
        name: 'Sarah Wilson',
        department: 'Marketing',
        annualLeave: 12,
        sickLeave: 6,
        familyResponsibility: 2,
        maternityLeave: 0,
        paternityLeave: 0,
        studyLeave: 8
      },
      {
        email: 'chaisahr@clintonhealthaccess.org',
        name: 'Chai Sahr',
        department: 'Health',
        annualLeave: 18,
        sickLeave: 12,
        familyResponsibility: 3,
        maternityLeave: 0,
        paternityLeave: 0,
        studyLeave: 7
      }
    ];
  } else if (url.includes('/api/users')) {
    mockData = [
      {
        id: 1,
        email: 'john.doe@example.com',
        name: 'John Doe',
        department: 'Engineering',
        role: 'employee',
        manager: 'jane.smith@example.com'
      },
      {
        id: 2,
        email: 'sarah.wilson@example.com',
        name: 'Sarah Wilson',
        department: 'Marketing',
        role: 'employee',
        manager: 'jane.smith@example.com'
      },
      {
        id: 3,
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        department: 'Management',
        role: 'manager',
        manager: null
      }
    ];
  } else if (url.includes('/api/audit')) {
    mockData = {
      success: true,
      activity: [
        {
          id: 1,
          table_name: 'leave_taken',
          record_id: '123',
          action: 'INSERT',
          old_values: null,
          new_values: '{"title":"Vacation","leaveType":"Annual Leave"}',
          changed_by: 'john.doe@example.com',
          changed_by_name: 'John Doe',
          changed_at: '2025-01-26T10:00:00Z'
        },
        {
          id: 2,
          table_name: 'leave_taken',
          record_id: '124',
          action: 'UPDATE',
          old_values: '{"status":"pending"}',
          new_values: '{"status":"approved"}',
          changed_by: 'manager@example.com',
          changed_by_name: 'Manager User',
          changed_at: '2025-01-26T11:00:00Z'
        }
      ]
    };
  } else if (url.includes('/api/leave/documents')) {
    mockData = {
      success: true,
      documents: [
        {
          id: 1,
          leave_id: 123,
          original_name: 'medical_certificate.pdf',
          uploaded_at: '2025-01-26T09:00:00Z'
        },
        {
          id: 2,
          leave_id: 124,
          original_name: 'travel_booking.pdf',
          uploaded_at: '2025-01-26T10:30:00Z'
        }
      ]
    };
  }
  
  return new Response(JSON.stringify(mockData), {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
