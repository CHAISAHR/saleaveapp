
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const SignInButton: React.FC = () => {
  const { login } = useAuth();

  return (
    <Button onClick={login} className="flex items-center space-x-2">
      <LogIn className="h-4 w-4" />
      <span>Sign in with Microsoft</span>
    </Button>
  );
};
