import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, Clock, Users, Calendar, Mail, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/emailService";
import { balanceService } from "@/services/balanceService";

interface ManagerDashboardProps {
  currentUser: any;
  activeView?: 'requests' | 'balance';
}

export const ManagerDashboard = ({ currentUser, activeView = 'requests' }: ManagerDashboardProps) => {
  const { toast } = useToast();
  
  // Sample team data with only Annual, Wellness, and Study leave
  const teamMembers = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@company.com",
      department: "Marketing",
      balances: {
        annual: { used: 5, total: 20 },
        wellness: { used: 0, total: 2 },
        study: { used: 0, total: 6 }
      }
    },
    {
      id: 2,
      name: "Emily Davis",
      email: "emily.davis@company.com",
      department: "Marketing",
      balances: {
        annual: { used: 12, total: 20 },
        wellness: { used: 1, total: 2 },
        study: { used: 2, total: 6 }
      }
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@company.com",
      department: "Marketing",
      balances: {
        annual: { used: 8, total: 20 },
        wellness: { used: 0, total: 2 },
        study: { used: 0, total: 6 }
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

  // Sample historic leave requests for current year
  const [historicRequests, setHistoricRequests] = useState([
    {
      id: 101,
      employeeName: "John Smith",
      employeeEmail: "john.smith@company.com",
      title: "Summer Vacation",
      type: "Annual",
      startDate: "2024-03-15",
      endDate: "2024-03-19",
      days: 5,
      submittedDate: "2024-02-20",
      approvedDate: "2024-02-22",
      description: "Family vacation",
      status: "approved"
    },
    {
      id: 102,
      employeeName: "Emily Davis",
      employeeEmail: "emily.davis@company.com",
      title: "Mental Health Day",
      type: "Wellness",
      startDate: "2024-04-10",
      endDate: "2024-04-10",
      days: 1,
      submittedDate: "2024-04-08",
      approvedDate: "2024-04-09",
      description: "Personal wellness day",
      status: "approved"
    },
    {
      id: 103,
      employeeName: "Michael Brown",
      employeeEmail: "michael.brown@company.com",
      title: "Conference Attendance",
      type: "Study",
      startDate: "2024-05-20",
      endDate: "2024-05-21",
      days: 2,
      submittedDate: "2024-05-01",
      description: "Marketing conference",
      status: "rejected"
    },
    {
      id: 104,
      employeeName: "John Smith",
      employeeEmail: "john.smith@company.com",
      title: "Sick Leave",
      type: "Sick",
      startDate: "2024-06-05",
      endDate: "2024-06-06",
      days: 2,
      submittedDate: "2024-06-05",
      approvedDate: "2024-06-05",
      description: "Flu symptoms",
      status: "approved"
    }
  ]);

  const handleApprove = async (requestId: number, employeeName: string, employeeEmail: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Update leave balance (simulate API call)
      console.log('Updating balance for approved leave:', {
        employeeEmail,
        leaveType: request.type,
        daysUsed: request.days,
        approvedBy: currentUser.name
      });
      
      // Send email notification to employee
      console.log(`Email sent to ${employeeEmail}:
        Subject: Leave Request Approved - ${request.title}
        
        Dear ${employeeName},
        
        Your leave request has been approved by ${currentUser.name}.
        
        Details:
        - Leave Type: ${request.type}
        - Dates: ${request.startDate} to ${request.endDate}
        - Working Days: ${request.days}
        
        Your leave balance has been automatically updated.
        
        Best regards,
        ${currentUser.name}
        Leave Management System`);
      
      // Log the approval to leave_taken table
      const leaveRecord = {
        Title: request.title,
        Detail: request.description,
        StartDate: request.startDate,
        EndDate: request.endDate,
        LeaveType: request.type,
        Requester: employeeEmail,
        Approver: currentUser.email,
        Status: 'approved',
        workingDays: request.days
      };
      
      console.log('Leave record created:', leaveRecord);
      
      toast({
        title: "Request Approved",
        description: `${employeeName}'s leave request has been approved. Email notification sent and balance updated.`,
      });
      
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast({
        title: "Error",
        description: "Failed to approve leave request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: number, employeeName: string, employeeEmail: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Send email notification to employee
      console.log(`Email sent to ${employeeEmail}:
        Subject: Leave Request Rejected - ${request.title}
        
        Dear ${employeeName},
        
        Unfortunately, your leave request has been rejected by ${currentUser.name}.
        
        Details:
        - Leave Type: ${request.type}
        - Dates: ${request.startDate} to ${request.endDate}
        - Working Days: ${request.days}
        
        Please contact your manager if you have any questions.
        
        Best regards,
        ${currentUser.name}
        Leave Management System`);
      
      // Log the rejection to leave_taken table
      const leaveRecord = {
        Title: request.title,
        Detail: request.description,
        StartDate: request.startDate,
        EndDate: request.endDate,
        LeaveType: request.type,
        Requester: employeeEmail,
        Approver: currentUser.email,
        Status: 'rejected'
      };
      
      console.log('Leave record created:', leaveRecord);
      
      toast({
        title: "Request Rejected",
        description: `${employeeName}'s leave request has been rejected. Email notification sent.`,
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast({
        title: "Error",
        description: "Failed to reject leave request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelApprovedLeave = async (requestId: number, employeeName: string, employeeEmail: string) => {
    const request = historicRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'approved') return;

    try {
      // Update status to cancelled
      setHistoricRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'cancelled' } : r
      ));
      
      // Add back leave days to balance
      console.log('Adding back leave days:', {
        employeeEmail,
        leaveType: request.type,
        daysToAddBack: request.days,
        cancelledBy: currentUser.name
      });
      
      // Send notification to employee
      await emailService.notifyEmployeeOfRejection({
        Requester: employeeEmail,
        Title: request.title,
        LeaveType: request.type,
        StartDate: request.startDate,
        EndDate: request.endDate,
        workingDays: request.days
      }, currentUser.name, "Leave has been cancelled by manager");
      
      // Send notification to admin
      console.log(`Email sent to admin:
        Subject: Leave Cancellation - ${request.title}
        
        A previously approved leave has been cancelled:
        
        Employee: ${employeeName}
        Leave Type: ${request.type}
        Dates: ${request.startDate} to ${request.endDate}
        Working Days: ${request.days}
        Cancelled by: ${currentUser.name}
        
        Leave balance has been automatically restored.`);
      
      toast({
        title: "Leave Cancelled",
        description: `${employeeName}'s leave has been cancelled and balance restored. Notifications sent.`,
      });
      
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast({
        title: "Error",
        description: "Failed to cancel leave. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      pending: "secondary", 
      rejected: "destructive",
      cancelled: "outline"
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (activeView === 'balance') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Leave Balances</h2>
            <p className="text-gray-600">Monitor your team's Annual, Wellness, and Study leave usage</p>
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
                      <span className="text-sm font-medium text-gray-600">Wellness Leave</span>
                      <span className="text-sm text-gray-500">
                        {member.balances.wellness.total - member.balances.wellness.used} / {member.balances.wellness.total} days
                      </span>
                    </div>
                    <Progress 
                      value={(member.balances.wellness.used / member.balances.wellness.total) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Study Leave</span>
                      <span className="text-sm text-gray-500">
                        {member.balances.study.total - member.balances.study.used} / {member.balances.study.total} days
                      </span>
                    </div>
                    <Progress 
                      value={(member.balances.study.used / member.balances.study.total) * 100} 
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
                  {teamMembers.reduce((acc, member) => acc + (member.balances.wellness.total - member.balances.wellness.used), 0)}
                </div>
                <div className="text-sm text-green-700">Total Wellness Days Available</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {teamMembers.reduce((acc, member) => acc + (member.balances.study.total - member.balances.study.used), 0)}
                </div>
                <div className="text-sm text-purple-700">Total Study Days Available</div>
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
                <p className="text-sm text-gray-600">This Year</p>
                <p className="text-2xl font-bold text-gray-900">{historicRequests.length}</p>
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

      {/* Historic Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Leave History - {new Date().getFullYear()}</span>
          </CardTitle>
          <CardDescription>All leave requests for the current year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historicRequests.map((request) => (
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
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {request.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelApprovedLeave(request.id, request.employeeName, request.employeeEmail)}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-400">
                  Submitted: {request.submittedDate}
                  {request.approvedDate && ` • Approved: ${request.approvedDate}`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
