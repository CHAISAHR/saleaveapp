
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordResetFormProps {
  onBack: () => void;
  onResetRequest: (email: string) => Promise<void>;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onBack, onResetRequest }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PasswordResetForm] Form submitted with email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[PasswordResetForm] Calling onResetRequest function...');
      await onResetRequest(email);
      console.log('[PasswordResetForm] Reset request successful');
      setIsSubmitted(true);
      toast({
        title: "Reset Link Sent",
        description: `If an account exists for ${email}, you will receive a password reset link.`,
      });
    } catch (error: any) {
      console.error('[PasswordResetForm] Password reset error:', error);
      console.error('[PasswordResetForm] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      const errorMessage = error.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a password reset link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Your Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <Button onClick={onBack} variant="outline" className="w-full" disabled={isLoading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
