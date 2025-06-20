
// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://leave-smart-track-production.up.railway.app';

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
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
