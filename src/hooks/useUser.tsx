
import { useAuth } from '@/contexts/AuthContext';

export const useUser = () => {
  const { user } = useAuth();
  return {
    user
  };
};
