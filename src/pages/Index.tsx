
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, Calendar, Users, FileText, Plus, Settings } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { HolidayCalendar } from "@/components/HolidayCalendar";
import { PolicyGuide } from "@/components/PolicyGuide";
import { UserDropdown } from "@/components/UserDropdown";
import { SignInButton } from "@/components/SignInButton";
import { useAuth } from "@/contexts/AuthContext";
import { ManualSignInForm } from "@/components/ManualSignInForm";
import { ManualSignUpForm } from "@/components/ManualSignUpForm";

const Index = () => {
  const { user, isAuthenticated, loading, manualLogin, manualSignUp } = useAuth();
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'admin'>('employee');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sample user data with role - in real app this would come from your backend
  const currentUser = {
    name: user?.name || "Sarah Johnson",
    email: user?.username || "sarah.johnson@company.com",
    department: "Marketing",
    avatar: "",
    employeeId: "EMP001",
    role: "manager" // This would come from your backend based on the authenticated user
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-blue-600 text-white p-3 rounded-lg mx-auto w-fit mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">LeaveApp_SA</CardTitle>
            <CardDescription>HR Management System</CardDescription>
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
              <ManualSignInForm onSignIn={manualLogin} />
            ) : (
              <ManualSignUpForm onSignUp={manualSignUp} />
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
      </div>
    );
  }

  // Role-based tab configuration
  const getAvailableTabs = () => {
    const baseTabs = [{
      value: "dashboard",
      icon: UserCheck,
      label: userRole === 'employee' ? 'My Requests' : userRole === 'manager' ? 'Team Requests' : 'Admin Panel'
    }, {
      value: "balance",
      icon: Calendar,
      label: userRole === 'employee' ? 'Balance' : userRole === 'manager' ? 'Team Balances' : 'System Overview'
    }, {
      value: "holidays",
      icon: Calendar,
      label: "Holidays"
    }, {
      value: "about",
      icon: FileText,
      label: "About"
    }];

    // Add admin-specific tab
    if (userRole === 'admin') {
      baseTabs.splice(2, 0, {
        value: "admin",
        icon: Settings,
        label: "Administration"
      });
    }
    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">LeaveApp_SA</h1>
                <p className="text-sm text-gray-500">HR Management System</p>
              </div>
            </div>
            
            {/* Horizontal Navigation Menu */}
            <div className="flex-1 flex justify-center">
              <NavigationMenu>
                <NavigationMenuList className="flex space-x-1">
                  {availableTabs.map(tab => (
                    <NavigationMenuItem key={tab.value}>
                      <NavigationMenuLink
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
                          activeTab === tab.value 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveTab(tab.value)}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Role switcher - only show if user has manager or admin privileges */}
              {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={userRole === 'employee' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setUserRole('employee')}
                  >
                    Employee View
                  </Button>
                  {currentUser.role === 'manager' && (
                    <Button 
                      variant={userRole === 'manager' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setUserRole('manager')}
                    >
                      Manager View
                    </Button>
                  )}
                  {currentUser.role === 'admin' && (
                    <>
                      <Button 
                        variant={userRole === 'manager' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setUserRole('manager')}
                      >
                        Manager View
                      </Button>
                      <Button 
                        variant={userRole === 'admin' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setUserRole('admin')}
                      >
                        Admin View
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {/* User Dropdown */}
              <UserDropdown currentUser={currentUser} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <>
              {userRole === 'employee' ? (
                <EmployeeDashboard onNewRequest={() => setShowRequestForm(true)} currentUser={currentUser} />
              ) : userRole === 'manager' ? (
                <ManagerDashboard currentUser={currentUser} />
              ) : (
                <AdminDashboard currentUser={currentUser} />
              )}
            </>
          )}

          {activeTab === 'balance' && (
            <>
              {userRole === 'employee' ? (
                <EmployeeDashboard onNewRequest={() => setShowRequestForm(true)} currentUser={currentUser} activeView="balance" />
              ) : userRole === 'manager' ? (
                <ManagerDashboard currentUser={currentUser} activeView="balance" />
              ) : (
                <AdminDashboard currentUser={currentUser} activeView="system" />
              )}
            </>
          )}

          {activeTab === 'admin' && userRole === 'admin' && (
            <AdminDashboard currentUser={currentUser} activeView="admin" />
          )}

          {activeTab === 'holidays' && (
            <HolidayCalendar userRole={userRole} />
          )}

          {activeTab === 'about' && (
            <PolicyGuide />
          )}
        </div>
      </main>

      {/* Leave Request Form Modal */}
      {showRequestForm && (
        <LeaveRequestForm 
          isOpen={showRequestForm} 
          onClose={() => setShowRequestForm(false)} 
          currentUser={currentUser} 
        />
      )}
    </div>
  );
};

export default Index;
