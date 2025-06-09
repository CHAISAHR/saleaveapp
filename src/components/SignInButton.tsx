
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const SignInButton: React.FC = () => {
  const { login } = useAuth();

  return (
    <Button 
      onClick={login} 
      variant="outline" 
      size="icon"
      className="rounded-full"
      title="Sign in with Microsoft"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 23 23"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="#f35325" d="M1 1h10v10H1z"/>
        <path fill="#81bc06" d="M12 1h10v10H12z"/>
        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
        <path fill="#ffba08" d="M12 12h10v10H12z"/>
      </svg>
    </Button>
  );
};
