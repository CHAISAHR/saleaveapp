
import { useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useUser = () => {
  const { user } = useAuth();
  
  return {
    user: user ? {
      name: user.name || "Unknown User",
      email: user.username || "user@company.com"
    } : null
  };
};
