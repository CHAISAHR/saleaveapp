import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertCircle, Clock, Users, Calendar, Mail, Ban, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/emailService";
import { balanceService } from "@/services/balanceService";

interface ManagerDashboardProps {
  currentUser: any;
  activeView?: 'requests' | 'balance';
}

export const ManagerDashboard = ({ currentUser, activeView = 'requests' }: ManagerDashboardProps) => {
  const { toast } = useToast();
  
  // Sample team data with balances from leave_balances table structure
  const teamMembers = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@company.com",
      department: "HR",
      leaveBalance: {
        BalanceID: 1,
        EmployeeName: "John Smith",
        EmployeeEmail: "john.smith@company.com",
        Department: "HR",
        Year: 2025,
        Broughtforward: 5,
        Annual: 20,
        AnnualUsed: 8,
        Forfeited: 0,
        Annual_leave_adjustments: 0,
        SickBroughtforward: 2,
        Sick: 36,
        SickUsed: 2,
        MaternityUsed: 0,
        ParentalUsed: 0,
        FamilyUsed: 1,
        AdoptionUsed: 0,
        StudyUsed: 0,
        WellnessUsed: 0,
        Current_leave_balance: 17,
        Manager: "sarah.johnson@company.com"
      }
    },
    {
      id: 2,
      name: "Emily Davis",
      email: "emily.davis@company.com",
      department: "HR",
      leaveBalance: {
        BalanceID: 2,
        EmployeeName: "Emily Davis",
        EmployeeEmail: "emily.davis@company.com",
        Department: "HR",
        Year: 2025,
        Broughtforward: 3,
        Annual: 20,
        AnnualUsed: 12,
        Forfeited: 0,
        Annual_leave_adjustments: 0,
        SickBroughtforward: 5,
        Sick: 36,
        SickUsed: 4,
        MaternityUsed: 0,
        ParentalUsed: 0,
        FamilyUsed: 1,
        AdoptionUsed: 0,
        StudyUsed: 2,
        WellnessUsed: 0,
        Current_leave_balance: 11,
        Manager: "sarah.johnson@company.com"
      }
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@company.com",
      department: "HR",
      leaveBalance: {
        BalanceID: 3,
        EmployeeName: "Michael Brown",
        EmployeeEmail: "michael.brown@company.com",
        Department: "HR",
        Year: 2025,
        Broughtforward: 8,
        Annual: 20,
        AnnualUsed: 8,
        Forfeited: 0,
        Annual_leave_adjustments: 0,
        SickBroughtforward: 0,
        Sick: 36,
        SickUsed: 0,
        MaternityUsed: 0,
        ParentalUsed: 0,
        FamilyUsed: 0,
        AdoptionUsed: 0,
        StudyUsed: 0,
        WellnessUsed: 0,
        Current_leave_balance: 20,
        Manager: "sarah.johnson@company.com"
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
      description: "Attending advanced HR workshop"
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
      status: "approved",
      created: "2024-02-20T10:00:00Z",
      modified: "2024-02-22T14:30:00Z",
      modifiedBy: "sarah.johnson@company.com"
    },
    {
      id: 102,
      employeeName: "Emily Davis",
      employeeEmail: "emily.davis@company.com",
      title: "Wellness Day",
      type: "Wellness",
      startDate: "2024-04-10",
      endDate: "2024-04-10",
      days: 1,
      submittedDate: "2024-04-08",
      approvedDate: "2024-04-09",
      description: "Personal wellness day",
      status: "approved",
      created: "2024-04-08T09:00:00Z",
      modified: "2024-04-09T11:15:00Z",
      modifiedBy: "sarah.johnson@company.com"
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
      description: "HR conference",
      status: "rejected",
      created: "2024-05-01T10:00:00Z",
      modified: "2024-05-02T16:00:00Z",
      modifiedBy: "sarah.johnson@company.com"
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
      status: "approved",
      created: "2024-06-05T08:00:00Z",
      modified: "2024-06-05T08:30:00Z",
      modifiedBy: "sarah.johnson@company.com"
    }
  ]);

  const calculateLeaveBalance = (balance: any, leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case 'annual':
        // Broughtforward + monthly earned (20/12 per month * 12) - AnnualUsed - Forfeited - Annual_leave_adjustments
        return balance.Broughtforward + 20 - balance.AnnualUsed - balance.Forfeited - balance.Annual_leave_adjustments;
      case 'sick':
        return 36 - balance.SickUsed;
      case 'family':
        return 3 - balance.FamilyUsed;
      case 'study':
        return 6 - balance.StudyUsed;
      case 'wellness':
      case 'Wellness':
        return 2 - balance.WellnessUsed;
      case 'maternity':
        return 90 - balance.MaternityUsed;
      case 'parental':
        return 20 - balance.ParentalUsed;
      case 'adoption':
        return 20 - balance.AdoptionUsed;
      default:
        return 0;
    }
  };

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
        HR`);
      
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
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (activeView === 'balance') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Leave Balances</h2>
            <p className="text-gray-600">Monitor your team's leave usage from leave_balances data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {teamMembers.map((member) => {
            const annualBalance = calculateLeaveBalance(member.leaveBalance, 'annual');
            const studyBalance = calculateLeaveBalance(member.leaveBalance, 'study');
            const wellnessBalance = calculateLeaveBalance(member.leaveBalance, 'wellness');
            
            return (
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
                          {annualBalance} days
                        </span>
                      </div>
                      <Progress 
                        value={((20 - annualBalance) / 20) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-400">
                        Used: {member.leaveBalance.AnnualUsed} | BF: {member.leaveBalance.Broughtforward}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Study Leave</span>
                        <span className="text-sm text-gray-500">
                          {studyBalance} days
                        </span>
                      </div>
                      <Progress 
                        value={((6 - studyBalance) / 6) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-400">
                        Used: {member.leaveBalance.StudyUsed}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Wellness Leave</span>
                        <span className="text-sm text-gray-500">
                          {wellnessBalance} days
                        </span>
                      </div>
                      <Progress 
                        value={((2 - wellnessBalance) / 2) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-400">
                        Used: {member.leaveBalance.WellnessUsed}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Filter rejected requests
  const rejectedRequests = historicRequests.filter(request => request.status === 'rejected');

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
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedRequests.length}</p>
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

      {/* Historic Leave Requests - Now in Table Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Leave History - {new Date().getFullYear()}</span>
          </CardTitle>
          <CardDescription>All leave requests for the current year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead>Modified By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={request.description}>
                        {request.description}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {request.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.employeeName}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {new Date(request.created).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {new Date(request.modified).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">{request.modifiedBy}</div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
