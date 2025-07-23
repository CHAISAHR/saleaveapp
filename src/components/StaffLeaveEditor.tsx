
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { balanceService } from "@/services/balanceService";

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

interface StaffLeaveEditorProps {
  userEmail: string;
}

export const StaffLeaveEditor = ({ userEmail }: StaffLeaveEditorProps) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);

  // Mock data - in real app this would fetch user's requests
  const [requests, setRequests] = useState<LeaveRequest[]>([
    {
      LeaveID: 1,
      Title: "Family Vacation",
      Detail: "Summer vacation with family",
      StartDate: "2025-07-15",
      EndDate: "2025-07-19",
      LeaveType: "Annual",
      Requester: userEmail,
      Status: "pending",
      workingDays: 5,
      Created: "2024-06-15T10:00:00Z",
      Modified: "2024-06-16T14:30:00Z",
      ModifiedBy: userEmail
    },
    {
      LeaveID: 2,
      Title: "Medical Appointment",
      Detail: "Regular health check-up",
      StartDate: "2024-06-20",
      EndDate: "2024-06-20",
      LeaveType: "Sick",
      Requester: userEmail,
      Status: "approved",
      workingDays: 1,
      Created: "2024-06-18T09:15:00Z",
      Modified: "2024-06-18T09:15:00Z",
      ModifiedBy: userEmail
    }
  ]);

  const canEditRequest = (request: LeaveRequest): boolean => {
    return balanceService.canStaffEditLeave(request);
  };

  const getEditRestrictionReason = (request: LeaveRequest): string => {
    if (request.Status !== 'pending') {
      return `Cannot edit ${request.Status} requests`;
    }
    
    const startDate = new Date(request.StartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return "Cannot edit requests for past dates";
    }
    
    return "";
  };

  const handleEdit = (request: LeaveRequest) => {
    if (!canEditRequest(request)) {
      toast({
        title: "Cannot Edit Request",
        description: getEditRestrictionReason(request),
        variant: "destructive"
      });
      return;
    }

    setEditingId(request.LeaveID);
    setEditingRequest({ ...request });
  };

  const handleSave = () => {
    if (!editingRequest) return;

    const updatedRequest = {
      ...editingRequest,
      Modified: new Date().toISOString(),
      ModifiedBy: userEmail
    };

    setRequests(prev => prev.map(r => 
      r.LeaveID === updatedRequest.LeaveID ? updatedRequest : r
    ));

    console.log('Request updated by staff:', updatedRequest);

    toast({
      title: "Request Updated",
      description: "Your leave request has been successfully updated.",
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
    <Card>
      <CardHeader>
        <CardTitle>My Leave Requests</CardTitle>
        <CardDescription>View and edit your pending leave requests</CardDescription>
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
                <TableHead>Status</TableHead>
                <TableHead>Working Days</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.LeaveID}>
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
                  <TableCell>{getStatusBadge(request.Status)}</TableCell>
                  <TableCell>{request.workingDays}</TableCell>
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
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(request)}
                          disabled={!canEditRequest(request)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!canEditRequest(request) && (
                          <div className="flex items-center text-xs text-gray-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {getEditRestrictionReason(request)}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
