
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface EmployeeDashboardProps {
  onNewRequest: () => void;
  currentUser: any;
  activeView?: 'requests' | 'balance';
}

export const EmployeeDashboard = ({ onNewRequest, currentUser, activeView = 'requests' }: EmployeeDashboardProps) => {
  // Sample leave balances
  const leaveBalances = [
    { type: 'Annual', used: 8, total: 20, accrued: 12.5, unit: 'days' },
    { type: 'Sick', used: 3, total: 36, accrued: 36, unit: 'days' },
    { type: 'Maternity', used: 0, total: 90, accrued: 90, unit: 'days' },
    { type: 'Parental', used: 0, total: 20, accrued: 20, unit: 'days' },
    { type: 'Family', used: 1, total: 3, accrued: 3, unit: 'days' },
    { type: 'Adoption', used: 0, total: 20, accrued: 20, unit: 'days' },
    { type: 'Study', used: 2, total: 6, accrued: 6, unit: 'days' },
    { type: 'Wellness', used: 0, total: 2, accrued: 2, unit: 'days' }
  ];

  // Sample leave requests
  const leaveRequests = [
    {
      id: 1,
      title: "Family Vacation",
      type: "Annual",
      startDate: "2024-07-15",
      endDate: "2024-07-19",
      days: 5,
      status: "approved",
      submittedDate: "2024-06-15",
      description: "Summer vacation with family"
    },
    {
      id: 2,
      title: "Medical Appointment",
      type: "Sick",
      startDate: "2024-06-20",
      endDate: "2024-06-20",
      days: 1,
      status: "pending",
      submittedDate: "2024-06-18",
      description: "Regular health check-up"
    },
    {
      id: 3,
      title: "Conference Attendance",
      type: "Study",
      startDate: "2024-08-10",
      endDate: "2024-08-12",
      days: 3,
      status: "rejected",
      submittedDate: "2024-06-10",
      description: "Professional development conference"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (activeView === 'balance') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leave Balance</h2>
            <p className="text-gray-600">Track your available and used leave days</p>
          </div>
          <Button onClick={onNewRequest} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveBalances.map((balance) => {
            const percentage = (balance.used / balance.total) * 100;
            const remaining = balance.total - balance.used;
            
            return (
              <Card key={balance.type} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {balance.type} Leave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">{remaining}</span>
                      <span className="text-sm text-gray-500">of {balance.total} days</span>
                    </div>
                    
                    <Progress value={percentage} className="h-2" />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Used: {balance.used}</span>
                      <span>Remaining: {remaining}</span>
                    </div>
                    
                    {balance.type === 'Annual' && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        Accrues 1.66 days/month
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Policy Summary</CardTitle>
            <CardDescription>Important information about your leave entitlements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Annual Leave Carry-over</h4>
              <p className="text-sm text-yellow-700">
                Unused annual leave expires after 6 months from the end of the leave year. 
                Plan your vacation time accordingly.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Accrual Rates</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• Annual: 1.66 days per month</li>
                  <li>• Sick: Full allocation at year start</li>
                  <li>• Other: Full allocation at year start</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Application Requirements</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• Submit requests 2 weeks in advance</li>
                  <li>• Manager approval required</li>
                  <li>• Medical certificates for sick leave >3 days</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Leave Requests</h2>
          <p className="text-gray-600">Manage and track your leave applications</p>
        </div>
        <Button onClick={onNewRequest} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{leaveRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your latest leave applications and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{request.title}</h4>
                    <p className="text-sm text-gray-600">{request.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{request.startDate} to {request.endDate}</span>
                      <span>{request.days} day{request.days > 1 ? 's' : ''}</span>
                      <span>{request.type} Leave</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(request.status)}
                  <div className="text-right text-xs text-gray-500">
                    <p>Submitted</p>
                    <p>{request.submittedDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
