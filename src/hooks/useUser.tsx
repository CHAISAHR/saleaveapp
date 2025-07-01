
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useUser = () => {
  const { user } = useContext(AuthContext);
  
  return {
    user: user ? {
      name: user.name || "Unknown User",
      email: user.username || "user@company.com"
    } : null
  };
};
