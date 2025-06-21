import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Settings, Users } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminAllRequests } from "@/components/AdminAllRequests";
import { AdminAllBalances } from "@/components/AdminAllBalances";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { HolidayCalendar } from "@/components/HolidayCalendar";
import { PolicyGuide } from "@/components/PolicyGuide";
import { UserDropdown } from "@/components/UserDropdown";
import { SignInButton } from "@/components/SignInButton";
import { useAuth } from "@/contexts/AuthContext";
import { ManualSignInForm } from "@/components/ManualSignInForm";
import { ManualSignUpForm } from "@/components/ManualSignUpForm";
import { PasswordResetForm } from "@/components/PasswordResetForm";
import { AdminPanel } from "@/components/AdminPanel";
import { ForfeitRibbon } from "@/components/ForfeitRibbon";

const Index = () => {
  const {
    user,
    isAuthenticated,
    loading,
    manualLogin,
    manualSignUp,
    resetPassword
  } = useAuth();
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'admin'>('employee');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  // Determine user role based on email or stored data
  const determineUserRole = (userEmail: string): 'employee' | 'manager' | 'admin' => {
    console.log('[Index] Determining user role for:', userEmail);
    
    // Admin users (you can modify this logic as needed)
    const adminEmails = ['admin@company.com', 'hr@company.com'];
    
    // Manager users (you can modify this logic as needed)
    const managerEmails = ['sarah.johnson@company.com', 'manager@company.com'];
    
    let role: 'employee' | 'manager' | 'admin' = 'employee';
    
    if (adminEmails.includes(userEmail)) {
      role = 'admin';
    } else if (managerEmails.includes(userEmail)) {
      role = 'manager';
    }
    
    console.log('[Index] Determined role:', role, 'for user:', userEmail);
    return role;
  };

  // Get user's full name from different sources
  const getUserFullName = () => {
    if (!user) return "Unknown User";
    
    // Try to get from idTokenClaims first (for detailed info)
    if (user.idTokenClaims?.given_name && user.idTokenClaims?.family_name) {
      return `${user.idTokenClaims.given_name} ${user.idTokenClaims.family_name}`;
    }
    
    // Fall back to user.name if available
    if (user.name && user.name.includes(' ')) {
      return user.name;
    }
    
    // Last resort: use email prefix
    return user.username?.split('@')[0] || "User";
  };

  // Sample user data with role - in real app this would come from your backend
  const currentUser = {
    name: getUserFullName(),
    email: user?.username || "sarah.johnson@company.com",
    department: user?.idTokenClaims?.department || "HR",
    avatar: "",
    employeeId: "EMP001",
    role: determineUserRole(user?.username || "sarah.johnson@company.com")
  };

  // Set initial role based on user's actual role
  useEffect(() => {
    if (user) {
      console.log('[Index] User changed, determining role for:', user.username);
      const actualRole = determineUserRole(user.username);
      console.log('[Index] Setting user role to:', actualRole);
      setUserRole(actualRole);
      
      // Log token info for debugging
      const authToken = localStorage.getItem('auth_token');
      console.log('[Index] Auth token present:', !!authToken);
      if (user.idTokenClaims?.role) {
        console.log('[Index] User role from token claims:', user.idTokenClaims.role);
      }
    }
  }, [user]);

  // Updated manualSignUp handler to include gender
  const handleManualSignUp = (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
    gender: string;
  }) => {
    manualSignUp(userData);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {authMode === 'reset' ? (
          <PasswordResetForm
            onBack={() => setAuthMode('signin')}
            onResetRequest={resetPassword}
          />
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/chailogo.png" 
                  alt="Company Logo" 
                  className="h-12 w-12"
                />
              </div>
              <CardTitle className="text-2xl">LeaveApp_SA</CardTitle>
              <CardDescription>HR Management System - South Africa</CardDescription>
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
                <ManualSignUpForm onSignUp={handleManualSignUp} />
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="flex justify-center">
                <SignInButton />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Employee balance data for forfeit ribbon
  const employeeBalance = {
    broughtForward: 5,
    annualUsed: 3
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return userRole === 'employee' ? (
          <EmployeeDashboard onNewRequest={() => setShowRequestForm(true)} currentUser={currentUser} />
        ) : userRole === 'manager' ? (
          <ManagerDashboard currentUser={currentUser} />
        ) : (
          <AdminDashboard currentUser={currentUser} />
        );

      case 'balance':
        return userRole === 'employee' ? (
          <EmployeeDashboard onNewRequest={() => setShowRequestForm(true)} currentUser={currentUser} activeView="balance" />
        ) : userRole === 'manager' ? (
          <ManagerDashboard currentUser={currentUser} activeView="balance" />
        ) : (
          <AdminDashboard currentUser={currentUser} activeView="system" />
        );

      case 'all-requests':
        return userRole === 'admin' ? <AdminAllRequests /> : null;

      case 'all-balances':
        return userRole === 'admin' ? <AdminAllBalances /> : null;

      case 'user-management':
        return userRole === 'admin' ? <AdminPanel currentUser={currentUser} /> : null;

      case 'admin':
        return userRole === 'admin' ? <AdminDashboard currentUser={currentUser} activeView="admin" /> : null;

      case 'holidays':
        return <HolidayCalendar userRole={userRole} />;

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          currentUser={currentUser}
          userRole={userRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRoleChange={setUserRole}
        />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            {/* Top right user info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-4 p-4 md:p-6">
            {/* Forfeit ribbon for employees */}
            {userRole === 'employee' && (
              <ForfeitRibbon 
                broughtForward={employeeBalance.broughtForward}
                annualUsed={employeeBalance.annualUsed}
              />
            )}
            
            {renderMainContent()}
          </main>
        </SidebarInset>
      </div>

      {/* Leave Request Form Modal */}
      {showRequestForm && (
        <LeaveRequestForm
          isOpen={showRequestForm}
          onClose={() => setShowRequestForm(false)}
          currentUser={currentUser}
        />
      )}
    </SidebarProvider>
  );
};

export default Index;
