
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManualSignInForm } from "@/components/ManualSignInForm";
import { ManualSignUpForm } from "@/components/ManualSignUpForm";
import { PasswordResetForm } from "@/components/PasswordResetForm";
import { useAuth } from "@/contexts/AuthContext";

interface AuthenticationPageProps {
  manualLogin: (email: string, password: string) => Promise<void>;
  manualSignUp: (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
    gender: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthenticationPage = ({ manualLogin, manualSignUp, resetPassword }: AuthenticationPageProps) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const { mockAdminLogin } = useAuth();

  if (authMode === 'reset') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-primary-dark to-navy-primary flex items-center justify-center">
        <PasswordResetForm
          onBack={() => setAuthMode('signin')}
          onResetRequest={resetPassword}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-primary-dark to-navy-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-navy-secondary/20">
        <CardHeader className="text-center bg-gradient-to-r from-navy-primary to-navy-accent text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo/chailogo.png" 
              alt="Company Logo" 
              className="h-12 w-12 bg-white/10 rounded-full p-2"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white">LeaveApp_SA</CardTitle>
          <CardDescription className="text-navy-secondary">Leave Management System - South Africa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auth mode toggle */}
          <div className="flex space-x-2">
            <Button
              variant={authMode === 'signin' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setAuthMode('signin')}
            >
              Sign In
            </Button>
            <Button
              variant={authMode === 'signup' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setAuthMode('signup')}
            >
              Sign Up
            </Button>
          </div>

          {/* Auth forms */}
          {authMode === 'signin' ? (
            <>
              <ManualSignInForm onSignIn={manualLogin} />
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm"
                  onClick={() => setAuthMode('reset')}
                >
                  Forgot your password?
                </Button>
              </div>
            </>
          ) : (
            <ManualSignUpForm onSignUp={manualSignUp} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
