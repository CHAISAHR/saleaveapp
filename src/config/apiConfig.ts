
// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
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

// Helper function for making API requests with proper error handling
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
    throw error;
  }
};
