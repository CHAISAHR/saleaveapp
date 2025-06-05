
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, Clock, Users, Calendar, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManagerDashboardProps {
  currentUser: any;
  activeView?: 'requests' | 'balance';
}

export const ManagerDashboard = ({ currentUser, activeView = 'requests' }: ManagerDashboardProps) => {
  const { toast } = useToast();
  
  // Sample team data
  const teamMembers = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@company.com",
      department: "Marketing",
      balances: {
        annual: { used: 5, total: 20 },
        sick: { used: 2, total: 36 },
        family: { used: 0, total: 3 }
      }
    },
    {
      id: 2,
      name: "Emily Davis",
      email: "emily.davis@company.com",
      department: "Marketing",
      balances: {
        annual: { used: 12, total: 20 },
        sick: { used: 4, total: 36 },
        family: { used: 1, total: 3 }
      }
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@company.com",
      department: "Marketing",
      balances: {
        annual: { used: 8, total: 20 },
        sick: { used: 1, total: 36 },
        family: { used: 0, total: 3 }
      }
    }
  ];

  // Sample pending requests
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      employeeName: "John Smith",
      employeeEmail: "john.smith@company.com",
      title: "Wedding Anniversary",
      type: "Annual",
      startDate: "2024-07-20",
      endDate: "2024-07-22",
      days: 3,
      submittedDate: "2024-06-20",
      description: "Celebrating 10th wedding anniversary with spouse"
    },
    {
      id: 2,
      employeeName: "Emily Davis",
      employeeEmail: "emily.davis@company.com",
      title: "Doctor's Appointment",
      type: "Sick",
      startDate: "2024-06-25",
      endDate: "2024-06-25",
      days: 1,
      submittedDate: "2024-06-23",
      description: "Specialist consultation for ongoing treatment"
    },
    {
      id: 3,
      employeeName: "Michael Brown",
      employeeEmail: "michael.brown@company.com",
      title: "Professional Development",
      type: "Study",
      startDate: "2024-08-15",
      endDate: "2024-08-16",
      days: 2,
      submittedDate: "2024-06-20",
      description: "Attending advanced marketing workshop"
    }
  ]);

  const handleApprove = (requestId: number, employeeName: string, employeeEmail: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    
    // Simulate email notification
    console.log(`Email sent to ${employeeEmail}: Your leave request has been approved by ${currentUser.name}`);
    
    toast({
      title: "Request Approved",
      description: `${employeeName}'s leave request has been approved and they've been notified.`,
    });
  };

  const handleReject = (requestId: number, employeeName: string, employeeEmail: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    
    // Simulate email notification
    console.log(`Email sent to ${employeeEmail}: Your leave request has been rejected by ${currentUser.name}`);
    
    toast({
      title: "Request Rejected",
      description: `${employeeName}'s leave request has been rejected and they've been notified.`,
      variant: "destructive",
    });
  };

  if (activeView === 'balance') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Leave Balances</h2>
            <p className="text-gray-600">Monitor your team's leave usage and availability</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription>{member.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Annual Leave</span>
                      <span className="text-sm text-gray-500">
                        {member.balances.annual.total - member.balances.annual.used} / {member.balances.annual.total} days
                      </span>
                    </div>
                    <Progress 
                      value={(member.balances.annual.used / member.balances.annual.total) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Sick Leave</span>
                      <span className="text-sm text-gray-500">
                        {member.balances.sick.total - member.balances.sick.used} / {member.balances.sick.total} days
                      </span>
                    </div>
                    <Progress 
                      value={(member.balances.sick.used / member.balances.sick.total) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Family Leave</span>
                      <span className="text-sm text-gray-500">
                        {member.balances.family.total - member.balances.family.used} / {member.balances.family.total} days
                      </span>
                    </div>
                    <Progress 
                      value={(member.balances.family.used / member.balances.family.total) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Summary</CardTitle>
            <CardDescription>Overview of team leave usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {teamMembers.reduce((acc, member) => acc + (member.balances.annual.total - member.balances.annual.used), 0)}
                </div>
                <div className="text-sm text-blue-700">Total Annual Days Available</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(teamMembers.reduce((acc, member) => acc + ((member.balances.annual.total - member.balances.annual.used) / member.balances.annual.total), 0) / teamMembers.length * 100)}%
                </div>
                <div className="text-sm text-green-700">Average Available</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
                <div className="text-sm text-yellow-700">Pending Approvals</div>
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
          <h2 className="text-2xl font-bold text-gray-900">Team Leave Requests</h2>
          <p className="text-gray-600">Review and approve your team's leave applications</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
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
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Notifications Sent</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span>Pending Approval ({pendingRequests.length})</span>
          </CardTitle>
          <CardDescription>Requests requiring your immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>All caught up! No pending requests to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {request.employeeName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">{request.title}</h4>
                        <p className="text-sm text-gray-600">{request.employeeName} • {request.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{request.startDate} to {request.endDate}</span>
                          <span>{request.days} day{request.days > 1 ? 's' : ''}</span>
                          <Badge variant="outline" className="text-xs">
                            {request.type} Leave
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id, request.employeeName, request.employeeEmail)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id, request.employeeName, request.employeeEmail)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-400">
                    Submitted on {request.submittedDate} • Email notification will be sent automatically
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
