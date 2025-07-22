
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { CheckCircle, XCircle, AlertCircle, Clock, Users, Calendar, Mail, Ban, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";
import { balanceService } from "@/services/balanceService";

interface ManagerDashboardProps {
  currentUser: any;
  activeView?: 'requests' | 'balance';
}

export const ManagerDashboard = ({ currentUser, activeView = 'requests' }: ManagerDashboardProps) => {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historicRequests, setHistoricRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply sorting to data
  const sortedHistoricRequests = useSorting(historicRequests, 'Created', 'desc');
  const sortedTeamMembers = useSorting(teamMembers, 'EmployeeName', 'asc');

  // Apply pagination to sorted data
  const requestsPagination = usePagination(sortedHistoricRequests.sortedData);
  const balancesPagination = usePagination(sortedTeamMembers.sortedData);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchTeamData = async () => {
    try {
      // Fetch leave requests - server already filters for manager's team
      const requestsResponse = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        console.log('Raw requests data:', requestsData);
        
        // The server returns { success: true, requests: [...] }
        const requestsArray = requestsData.success ? requestsData.requests : [];
        
        console.log('Processed requests array:', requestsArray);

        const pending = requestsArray.filter((request: any) => 
          (request.Status || request.status || '').toLowerCase() === 'pending'
        );
        const historic = requestsArray.filter((request: any) => 
          (request.Status || request.status || '').toLowerCase() !== 'pending'
        );
        
        setPendingRequests(pending);
        setHistoricRequests(historic);

        // Get unique team member emails for balance fetching (use Requester field from leave requests)
        const teamMemberEmails = [...new Set(requestsArray.map((req: any) => req.Requester).filter(Boolean))];
        console.log('Team member emails:', teamMemberEmails);
        
        // Log a sample request to check field names
        if (requestsArray.length > 0) {
          console.log('Sample request fields:', Object.keys(requestsArray[0]));
          console.log('Sample request:', requestsArray[0]);
        }
        
        // Fetch balances for each team member individually
        const balancePromises = teamMemberEmails.map(async (email: string) => {
          try {
            const response = await makeApiRequest(`${apiConfig.endpoints.balance}/${email}`, {
              headers: getAuthHeaders(),
            });
            if (response.ok) {
              const data = await response.json();
              console.log(`Balance data for ${email}:`, data);
              return data.success ? { ...data.balance, EmployeeEmail: email } : null;
            }
            return null;
          } catch (error) {
            console.error(`Error fetching balance for ${email}:`, error);
            return null;
          }
        });

        const teamBalancesResults = await Promise.all(balancePromises);
        const validBalances = teamBalancesResults.filter(balance => balance !== null);
        console.log('Final team balances:', validBalances);
        setTeamMembers(validBalances);
      }

    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [currentUser.email]);

  const calculateLeaveBalance = (balance: any, leaveType: string) => {
    return balanceService.calculateCurrentBalance(balance, leaveType.toLowerCase());
  };

  const handleApprove = async (requestId: number, employeeName: string, employeeEmail: string) => {
    const request = pendingRequests.find(r => r.LeaveID === requestId);
    if (!request) return;

    try {
      // Update request status
      const response = await fetch(`${apiConfig.endpoints.leave}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'approved',
          approver: currentUser.email
        })
      });

      if (response.ok) {
        // Update balance
        await balanceService.updateBalanceOnApproval(request);
        
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(r => r.LeaveID !== requestId));
        
        toast({
          title: "Request Approved",
          description: `${employeeName}'s leave request has been approved and balance updated.`,
        });
      }
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
    try {
      const response = await fetch(`${apiConfig.endpoints.leave}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'rejected',
          approver: currentUser.email
        })
      });

      if (response.ok) {
        setPendingRequests(prev => prev.filter(r => r.LeaveID !== requestId));
        
        toast({
          title: "Request Rejected",
          description: `${employeeName}'s leave request has been rejected.`,
          variant: "destructive",
        });
      }
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
    const request = historicRequests.find(r => r.LeaveID === requestId);
    if (!request || request.Status !== 'approved') return;

    try {
      const response = await fetch(`${apiConfig.endpoints.leave}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'cancelled',
          approver: currentUser.email
        })
      });

      if (response.ok) {
        // Restore balance
        await balanceService.updateBalanceOnCancellation(request);
        
        setHistoricRequests(prev => prev.map(r => 
          r.LeaveID === requestId ? { ...r, Status: 'cancelled' } : r
        ));
        
        toast({
          title: "Leave Cancelled",
          description: `${employeeName}'s leave has been cancelled and balance restored.`,
        });
      }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'balance') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Leave Balances</h2>
            <p className="text-gray-600">Monitor your team's leave usage</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {balancesPagination.startIndex}-{balancesPagination.endIndex} of {balancesPagination.pagination.total} team members
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead 
                      sortKey="EmployeeName"
                      currentSortKey={sortedTeamMembers.sortConfig?.key}
                      currentSortDirection={sortedTeamMembers.sortConfig?.direction}
                      onSort={sortedTeamMembers.handleSort}
                    >
                      Employee
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="EmployeeEmail"
                      currentSortKey={sortedTeamMembers.sortConfig?.key}
                      currentSortDirection={sortedTeamMembers.sortConfig?.direction}
                      onSort={sortedTeamMembers.handleSort}
                    >
                      Email
                    </SortableTableHead>
                    <TableHead>Annual Leave</TableHead>
                    <TableHead>Study Leave</TableHead>
                    <TableHead>Wellness Leave</TableHead>
                    <SortableTableHead 
                      sortKey="AnnualUsed"
                      currentSortKey={sortedTeamMembers.sortConfig?.key}
                      currentSortDirection={sortedTeamMembers.sortConfig?.direction}
                      onSort={sortedTeamMembers.handleSort}
                    >
                      Annual Used
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="Broughtforward"
                      currentSortKey={sortedTeamMembers.sortConfig?.key}
                      currentSortDirection={sortedTeamMembers.sortConfig?.direction}
                      onSort={sortedTeamMembers.handleSort}
                    >
                      Brought Forward
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancesPagination.paginatedData.map((member) => {
                    const annualBalance = calculateLeaveBalance(member, 'annual');
                    const studyBalance = calculateLeaveBalance(member, 'study');
                    const wellnessBalance = calculateLeaveBalance(member, 'wellness');
                    
                    return (
                      <TableRow key={member.BalanceID}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                {member.EmployeeName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.EmployeeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.EmployeeEmail}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{annualBalance} days</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${Math.max(0, Math.min(100, ((20 - annualBalance) / 20) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{studyBalance} days</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500" 
                                style={{ width: `${Math.max(0, Math.min(100, ((6 - studyBalance) / 6) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{wellnessBalance} days</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500" 
                                style={{ width: `${Math.max(0, Math.min(100, ((2 - wellnessBalance) / 2) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.AnnualUsed}</TableCell>
                        <TableCell>{member.Broughtforward}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <TablePagination
                currentPage={balancesPagination.pagination.page}
                totalPages={balancesPagination.totalPages}
                totalItems={balancesPagination.pagination.total}
                startIndex={balancesPagination.startIndex}
                endIndex={balancesPagination.endIndex}
                onPageChange={balancesPagination.goToPage}
                onFirst={balancesPagination.goToFirst}
                onPrevious={balancesPagination.goToPrevious}
                onNext={balancesPagination.goToNext}
                onLast={balancesPagination.goToLast}
                hasNext={balancesPagination.hasNext}
                hasPrevious={balancesPagination.hasPrevious}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter rejected requests
  const rejectedRequests = historicRequests.filter(request => request.Status === 'rejected');

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
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{historicRequests.length}</p>
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
                <div key={request.LeaveID} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {request.Requester.split('@')[0].charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">{request.Title}</h4>
                        <p className="text-sm text-gray-600">{request.Requester} • {request.Detail}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{request.StartDate} to {request.EndDate}</span>
                          <span>{request.workingDays} day{request.workingDays > 1 ? 's' : ''}</span>
                          <Badge variant="outline" className="text-xs">
                            {request.LeaveType} Leave
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.LeaveID, request.Requester, request.Requester)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.LeaveID, request.Requester, request.Requester)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historic Leave Requests - Table Format */}
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
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {requestsPagination.startIndex}-{requestsPagination.endIndex} of {requestsPagination.pagination.total} requests
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="Title"
                    currentSortKey={sortedHistoricRequests.sortConfig?.key}
                    currentSortDirection={sortedHistoricRequests.sortConfig?.direction}
                    onSort={sortedHistoricRequests.handleSort}
                  >
                    Title
                  </SortableTableHead>
                  <TableHead>Detail</TableHead>
                  <SortableTableHead
                    sortKey="StartDate"
                    currentSortKey={sortedHistoricRequests.sortConfig?.key}
                    currentSortDirection={sortedHistoricRequests.sortConfig?.direction}
                    onSort={sortedHistoricRequests.handleSort}
                  >
                    Start Date
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="EndDate"
                    currentSortKey={sortedHistoricRequests.sortConfig?.key}
                    currentSortDirection={sortedHistoricRequests.sortConfig?.direction}
                    onSort={sortedHistoricRequests.handleSort}
                  >
                    End Date
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="LeaveType"
                    currentSortKey={sortedHistoricRequests.sortConfig?.key}
                    currentSortDirection={sortedHistoricRequests.sortConfig?.direction}
                    onSort={sortedHistoricRequests.handleSort}
                  >
                    Leave Type
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="Requester"
                    currentSortKey={sortedHistoricRequests.sortConfig?.key}
                    currentSortDirection={sortedHistoricRequests.sortConfig?.direction}
                    onSort={sortedHistoricRequests.handleSort}
                  >
                    Requester
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="Status"
                    currentSortKey={sortedHistoricRequests.sortConfig?.key}
                    currentSortDirection={sortedHistoricRequests.sortConfig?.direction}
                    onSort={sortedHistoricRequests.handleSort}
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="workingDays"
                    currentSortKey={sortedHistoricRequests.sortConfig?.key}
                    currentSortDirection={sortedHistoricRequests.sortConfig?.direction}
                    onSort={sortedHistoricRequests.handleSort}
                  >
                    Working Days
                  </SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsPagination.paginatedData.map((request) => (
                  <TableRow key={request.LeaveID}>
                    <TableCell className="font-medium">{request.Title}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={request.Detail}>
                        {request.Detail}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(request.StartDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.EndDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {request.LeaveType}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.Requester}</TableCell>
                    <TableCell>{getStatusBadge(request.Status)}</TableCell>
                    <TableCell>{request.workingDays}</TableCell>
                    <TableCell>
                      {request.Status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelApprovedLeave(request.LeaveID, request.Requester, request.Requester)}
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

            <TablePagination
              currentPage={requestsPagination.pagination.page}
              totalPages={requestsPagination.totalPages}
              totalItems={requestsPagination.pagination.total}
              startIndex={requestsPagination.startIndex}
              endIndex={requestsPagination.endIndex}
              onPageChange={requestsPagination.goToPage}
              onFirst={requestsPagination.goToFirst}
              onPrevious={requestsPagination.goToPrevious}
              onNext={requestsPagination.goToNext}
              onLast={requestsPagination.goToLast}
              hasNext={requestsPagination.hasNext}
              hasPrevious={requestsPagination.hasPrevious}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
