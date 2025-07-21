
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
  
  if (!viteApiUrl) {
    if (import.meta.env.PROD) {
      console.error('VITE_API_URL environment variable is not set in production');
      throw new Error('API base URL not configured. Please set VITE_API_URL in production variables.');
    } else {
      console.warn('VITE_API_URL not set in development, using mock data fallback');
      return 'http://localhost:3000'; // Development fallback for mock responses
    }
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
    departments: `${API_BASE_URL}/api/departments`
  }
};

// Helper function for making API requests with proper error handling and fallback to mock data
export const makeApiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    
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
    if (error instanceof Error && error.message === 'Failed to fetch') {
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
        employeeEmail: 'john.doe@example.com',
        leaveType: 'Annual Leave',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        status: 'approved',
        daysRequested: 5,
        manager: 'jane.smith@example.com'
      },
      {
        id: 2,
        employeeName: 'Sarah Wilson',
        employeeEmail: 'sarah.wilson@example.com',
        leaveType: 'Sick Leave',
        startDate: '2025-01-18',
        endDate: '2025-01-19',
        status: 'approved',
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
  }
  
  return new Response(JSON.stringify(mockData), {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
