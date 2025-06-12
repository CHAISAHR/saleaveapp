import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertCircle, Edit, Save, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Mock data - in real app this would come from API
  const [requests, setRequests] = useState<LeaveRequest[]>([
    {
      LeaveID: 1,
      Title: "Family Vacation",
      Detail: "Summer vacation with family",
      StartDate: "2024-07-15",
      EndDate: "2024-07-19",
      LeaveType: "Annual",
      Requester: "john.smith@company.com",
      Approver: "sarah.johnson@company.com",
      Status: "approved",
      workingDays: 5,
      Created: "2024-06-15T10:00:00Z",
      Modified: "2024-06-16T14:30:00Z",
      ModifiedBy: "sarah.johnson@company.com"
    },
    {
      LeaveID: 2,
      Title: "Medical Appointment",
      Detail: "Regular health check-up",
      StartDate: "2024-06-20",
      EndDate: "2024-06-20",
      LeaveType: "Sick",
      Requester: "emily.davis@company.com",
      Status: "pending",
      workingDays: 1,
      Created: "2024-06-18T09:15:00Z",
      Modified: "2024-06-18T09:15:00Z",
      ModifiedBy: "emily.davis@company.com"
    }
  ]);

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

  const handleSave = () => {
    if (!editingRequest) return;

    const updatedRequest = {
      ...editingRequest,
      Modified: new Date().toISOString(),
      ModifiedBy: "admin@company.com" // In real app, this would be current user
    };

    setRequests(prev => prev.map(r => 
      r.LeaveID === updatedRequest.LeaveID ? updatedRequest : r
    ));

    console.log('Updated request:', updatedRequest);

    toast({
      title: "Request Updated",
      description: "Leave request has been successfully updated.",
    });

    setEditingId(null);
    setEditingRequest(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingRequest(null);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Leave Requests</h2>
          <p className="text-gray-600">View and manage all employee leave requests</p>
        </div>
        <Button onClick={downloadCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>All leave requests across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead>Modified By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.LeaveID}>
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
                        <Button size="sm" variant="outline" onClick={() => handleEdit(request)}>
                          <Edit className="h-4 w-4" />
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
