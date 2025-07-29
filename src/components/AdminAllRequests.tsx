import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertCircle, Edit, Save, X, Download, Ban, Filter, FilterX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LeaveDetailsDialog } from "@/components/LeaveDetailsDialog";
import { balanceService } from "@/services/balanceService";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";

interface LeaveRequest {
  LeaveID: number;
  Title: string;
  Detail: string;
  StartDate: string;
  EndDate: string;
  LeaveType: string;
  Requester: string;
  Approver?: string;
  Status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  workingDays: number;
  Created: string;
  Modified: string;
  ModifiedBy?: string;
}

export const AdminAllRequests = () => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    requester: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchRequests = async () => {
    try {
      const response = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      // Handle both mock data (array) and real API response (object with success property)
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data.success && data.requests) {
        setRequests(data.requests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId: number, newStatus: 'pending' | 'approved' | 'rejected' | 'cancelled', reason?: string) => {
    try {
      const response = await makeApiRequest(`${apiConfig.endpoints.leave}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          reason: reason
        })
      });

      if (response.ok) {
        // Refresh the data
        await fetchRequests();
        toast({
          title: "Success",
          description: `Leave request ${newStatus} successfully`,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update leave request status",
        variant: "destructive",
      });
    }
  };

  const handleCancelLeave = async (request: LeaveRequest) => {
    if (request.Status === 'approved') {
      // Restore balance for previously approved leave
      await balanceService.updateBalanceOnCancellation(request);
    }

    await handleStatusUpdate(request.LeaveID, 'cancelled', 'Cancelled by admin');
  };

  const downloadCSV = () => {
    const headers = [
      'LeaveID', 'Title', 'Detail', 'StartDate', 'EndDate', 'LeaveType', 
      'Requester', 'Approver', 'Status', 'WorkingDays', 'Created', 'Modified', 'ModifiedBy'
    ];
    
    const csvContent = [
      headers.join(','),
      ...requests.map(request => [
        request.LeaveID,
        `"${request.Title}"`,
        `"${request.Detail}"`,
        request.StartDate,
        request.EndDate,
        request.LeaveType,
        request.Requester,
        request.Approver || '',
        request.Status,
        request.workingDays,
        request.Created,
        request.Modified,
        request.ModifiedBy || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Downloaded",
      description: "Leave requests data has been exported successfully.",
    });
  };

  const handleEdit = (request: LeaveRequest) => {
    setEditingId(request.LeaveID);
    setEditingRequest({ ...request });
  };

  const handleSave = async () => {
    if (!editingRequest) return;

    const originalRequest = requests.find(r => r.LeaveID === editingRequest.LeaveID);
    if (!originalRequest) return;

    // Check if status changed from pending to approved
    const statusChangedToApproved = originalRequest.Status === 'pending' && editingRequest.Status === 'approved';
    
    // Check if status changed from approved to something else
    const statusChangedFromApproved = originalRequest.Status === 'approved' && editingRequest.Status !== 'approved';

    // Update balance based on status change
    if (statusChangedToApproved) {
      await balanceService.updateBalanceOnApproval(editingRequest);
      console.log('Balance updated for approved leave:', editingRequest);
    } else if (statusChangedFromApproved) {
      await balanceService.updateBalanceOnCancellation(originalRequest);
      console.log('Balance restored for status change from approved:', originalRequest);
    }

    // Update the request via API
    await handleStatusUpdate(editingRequest.LeaveID, editingRequest.Status, 'Updated by admin');

    toast({
      title: "Request Updated",
      description: statusChangedToApproved 
        ? "Leave request approved and balance updated successfully." 
        : "Leave request has been successfully updated.",
    });

    setEditingId(null);
    setEditingRequest(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingRequest(null);
  };

  const handleRowClick = (request: LeaveRequest, event: React.MouseEvent) => {
    // Prevent row click when clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleDialogApprove = async (requestId: number, reason?: string) => {
    await handleStatusUpdate(requestId, 'approved', reason);
    await fetchRequests(); // Refresh data
  };

  const handleDialogReject = async (requestId: number, reason?: string) => {
    await handleStatusUpdate(requestId, 'rejected', reason);
    await fetchRequests(); // Refresh data
  };

  const handleDialogCancel = async (requestId: number, reason?: string) => {
    await handleStatusUpdate(requestId, 'cancelled', reason);
    await fetchRequests(); // Refresh data
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesStatus = filters.status === 'all' || !filters.status || request.Status.toLowerCase() === filters.status.toLowerCase();
      const matchesLeaveType = filters.leaveType === 'all' || !filters.leaveType || request.LeaveType === filters.leaveType;
      const matchesRequester = !filters.requester || request.Requester.toLowerCase().includes(filters.requester.toLowerCase());
      const matchesStartDate = !filters.startDate || request.StartDate >= filters.startDate;
      const matchesEndDate = !filters.endDate || request.EndDate <= filters.endDate;
      const matchesSearchTerm = !filters.searchTerm || 
        request.Title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        request.Detail.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        request.Requester.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return matchesStatus && matchesLeaveType && matchesRequester && 
             matchesStartDate && matchesEndDate && matchesSearchTerm;
    });
  }, [requests, filters]);

  // Apply sorting to filtered data
  const { sortedData: sortedRequests, sortConfig, handleSort, getSortIcon } = useSorting(
    filteredRequests,
    'Created', // Default sort by created date
    'desc' // Newest first
  );

  // Apply pagination to sorted data
  const {
    paginatedData: displayRequests,
    pagination,
    goToPage,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
    totalPages,
    startIndex,
    endIndex,
  } = usePagination(sortedRequests, 20);

  const clearFilters = () => {
    setFilters({
      status: 'all',
      leaveType: 'all',
      requester: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-lime-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Leave Requests</h2>
          <p className="text-gray-600">View and manage all employee leave requests</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button onClick={downloadCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <FilterX className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search title, detail, or requester..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Leave Type</label>
                <Select value={filters.leaveType} onValueChange={(value) => setFilters(prev => ({ ...prev, leaveType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Sick">Sick</SelectItem>
                    <SelectItem value="Family">Family</SelectItem>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Maternity">Maternity</SelectItem>
                    <SelectItem value="Parental">Parental</SelectItem>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Requester</label>
                <Input
                  placeholder="Filter by requester name..."
                  value={filters.requester}
                  onChange={(e) => setFilters(prev => ({ ...prev, requester: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Start Date From</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date To</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            Showing {filteredRequests.length} of {requests.length} leave requests
            {filteredRequests.length !== requests.length && ' (filtered)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{requests.length === 0 ? 'No leave requests found' : 'No requests match your filters'}</p>
              {requests.length > 0 && (
                <Button onClick={clearFilters} variant="outline" className="mt-2">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead 
                      sortKey="LeaveID" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Leave ID
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="Title" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Title
                    </SortableTableHead>
                    <TableHead>Detail</TableHead>
                    <SortableTableHead 
                      sortKey="StartDate" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Start Date
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="EndDate" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      End Date
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="LeaveType" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Leave Type
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="Requester" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Requester
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="Approver" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Approver
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="Status" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Status
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="workingDays" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Working Days
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="Created" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Created
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="Modified" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Modified
                    </SortableTableHead>
                    <SortableTableHead 
                      sortKey="ModifiedBy" 
                      currentSortKey={sortConfig?.key} 
                      currentSortDirection={sortConfig?.direction} 
                      onSort={handleSort}
                    >
                      Modified By
                    </SortableTableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRequests.map((request) => (
                    <TableRow 
                      key={request.LeaveID} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => handleRowClick(request, e)}
                    >
                      <TableCell className="font-medium">{request.LeaveID}</TableCell>
                      <TableCell>
                        {editingId === request.LeaveID ? (
                          <Input
                            value={editingRequest?.Title || ''}
                            onChange={(e) => setEditingRequest(prev => prev ? {...prev, Title: e.target.value} : null)}
                            className="w-full"
                          />
                        ) : (
                          request.Title
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === request.LeaveID ? (
                          <Textarea
                            value={editingRequest?.Detail || ''}
                            onChange={(e) => setEditingRequest(prev => prev ? {...prev, Detail: e.target.value} : null)}
                            className="w-full min-w-[200px]"
                          />
                        ) : (
                          <div className="max-w-[200px] truncate" title={request.Detail}>
                            {request.Detail}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === request.LeaveID ? (
                          <Input
                            type="date"
                            value={editingRequest?.StartDate || ''}
                            onChange={(e) => setEditingRequest(prev => prev ? {...prev, StartDate: e.target.value} : null)}
                          />
                        ) : (
                          new Date(request.StartDate).toLocaleDateString()
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === request.LeaveID ? (
                          <Input
                            type="date"
                            value={editingRequest?.EndDate || ''}
                            onChange={(e) => setEditingRequest(prev => prev ? {...prev, EndDate: e.target.value} : null)}
                          />
                        ) : (
                          new Date(request.EndDate).toLocaleDateString()
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === request.LeaveID ? (
                          <Select
                            value={editingRequest?.LeaveType || ''}
                            onValueChange={(value) => setEditingRequest(prev => prev ? {...prev, LeaveType: value} : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Annual">Annual</SelectItem>
                              <SelectItem value="Sick">Sick</SelectItem>
                              <SelectItem value="Family">Family</SelectItem>
                              <SelectItem value="Study">Study</SelectItem>
                              <SelectItem value="Maternity">Maternity</SelectItem>
                              <SelectItem value="Parental">Parental</SelectItem>
                              <SelectItem value="Wellness">Wellness</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          request.LeaveType
                        )}
                      </TableCell>
                      <TableCell>{request.Requester}</TableCell>
                      <TableCell>{request.Approver || '-'}</TableCell>
                      <TableCell>
                        {editingId === request.LeaveID ? (
                          <Select
                            value={editingRequest?.Status || ''}
                            onValueChange={(value) => setEditingRequest(prev => prev ? {...prev, Status: value as any} : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getStatusBadge(request.Status)
                        )}
                      </TableCell>
                      <TableCell>{request.workingDays}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {new Date(request.Created).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {new Date(request.Modified).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{request.ModifiedBy || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {editingId === request.LeaveID ? (
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(request)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {(request.Status === 'approved' || request.Status === 'pending') && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleCancelLeave(request)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {filteredRequests.length > 0 && (
                <TablePagination
                  currentPage={pagination.page}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={filteredRequests.length}
                  onPageChange={goToPage}
                  onFirst={goToFirst}
                  onLast={goToLast}
                  onNext={goToNext}
                  onPrevious={goToPrevious}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <LeaveDetailsDialog
        request={selectedRequest}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        userRole="admin"
        onApprove={handleDialogApprove}
        onReject={handleDialogReject}
        onCancel={handleDialogCancel}
        canEditStatus={true}
      />
    </div>
  );
};