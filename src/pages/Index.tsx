
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, Calendar, Users, FileText, Plus, Settings } from "lucide-react";
import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { HolidayCalendar } from "@/components/HolidayCalendar";
import { PolicyGuide } from "@/components/PolicyGuide";

const Index = () => {
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'admin'>('employee');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sample user data with role
  const currentUser = {
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    department: "Marketing",
    avatar: "",
    employeeId: "EMP001",
    role: "employee" // This would come from the backend authentication
  };

  // Role-based tab configuration
  const getAvailableTabs = () => {
    const baseTabs = [
      {
        value: "dashboard",
        icon: UserCheck,
        label: userRole === 'employee' ? 'My Requests' : userRole === 'manager' ? 'Team Requests' : 'Admin Panel'
      },
      {
        value: "balance",
        icon: Calendar,
        label: userRole === 'employee' ? 'Balance' : userRole === 'manager' ? 'Team Balances' : 'System Overview'
      },
      {
        value: "holidays",
        icon: Calendar,
        label: "Holidays"
      },
      {
        value: "about",
        icon: FileText,
        label: "About"
      }
    ];

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
                <h1 className="text-xl font-semibold text-gray-900">LeaveManager</h1>
                <p className="text-sm text-gray-500">HR Management System</p>
              </div>
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
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentUser.department} • {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                  </p>
                </div>
                <Avatar>
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {userRole === 'employee' ? (
              <EmployeeDashboard 
                onNewRequest={() => setShowRequestForm(true)}
                currentUser={currentUser}
              />
            ) : userRole === 'manager' ? (
              <ManagerDashboard currentUser={currentUser} />
            ) : (
              <AdminDashboard currentUser={currentUser} />
            )}
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            {userRole === 'employee' ? (
              <EmployeeDashboard 
                onNewRequest={() => setShowRequestForm(true)}
                currentUser={currentUser}
                activeView="balance"
              />
            ) : userRole === 'manager' ? (
              <ManagerDashboard currentUser={currentUser} activeView="balance" />
            ) : (
              <AdminDashboard currentUser={currentUser} activeView="system" />
            )}
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="admin" className="space-y-6">
              <AdminDashboard currentUser={currentUser} activeView="admin" />
            </TabsContent>
          )}

          <TabsContent value="holidays" className="space-y-6">
            <HolidayCalendar userRole={userRole} />
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <PolicyGuide />
          </TabsContent>
        </Tabs>
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
