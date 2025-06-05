
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, Calendar, Users, FileText, Plus } from "lucide-react";
import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { HolidayCalendar } from "@/components/HolidayCalendar";
import { PolicyGuide } from "@/components/PolicyGuide";

const Index = () => {
  const [userRole, setUserRole] = useState<'employee' | 'manager'>('employee');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sample user data
  const currentUser = {
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    department: "Marketing",
    avatar: "",
    employeeId: "EMP001"
  };

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
              <div className="flex items-center space-x-2">
                <Button
                  variant={userRole === 'employee' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserRole('employee')}
                >
                  Employee View
                </Button>
                <Button
                  variant={userRole === 'manager' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserRole('manager')}
                >
                  Manager View
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.department}</p>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>{userRole === 'employee' ? 'My Requests' : 'Team Requests'}</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{userRole === 'employee' ? 'Balance' : 'Team Balances'}</span>
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Holidays</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>About</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {userRole === 'employee' ? (
              <EmployeeDashboard 
                onNewRequest={() => setShowRequestForm(true)}
                currentUser={currentUser}
              />
            ) : (
              <ManagerDashboard currentUser={currentUser} />
            )}
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            {userRole === 'employee' ? (
              <EmployeeDashboard 
                onNewRequest={() => setShowRequestForm(true)}
                currentUser={currentUser}
                activeView="balance"
              />
            ) : (
              <ManagerDashboard currentUser={currentUser} activeView="balance" />
            )}
          </TabsContent>

          <TabsContent value="holidays" className="space-y-6">
            <HolidayCalendar />
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
