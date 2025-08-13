
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { LeaveDetailsDialog } from "@/components/LeaveDetailsDialog";
import { EditLeaveRequestDialog } from "@/components/EditLeaveRequestDialog";

interface LeaveRequest {
  id: number;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  submittedDate: string;
  description: string;
}

interface LeaveRequestsListProps {
  leaveRequests: LeaveRequest[];
  onRequestUpdated?: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'declined':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge variant="default" className="bg-lime-600">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>;
    case 'declined':
      return <Badge variant="destructive">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>;
    case 'pending':
      return <Badge variant="secondary">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>;
    default:
      return <Badge variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>;
  }
};

export const LeaveRequestsList = ({ leaveRequests, onRequestUpdated }: LeaveRequestsListProps) => {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<LeaveRequest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleRowClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setEditRequest(request);
    setIsEditDialogOpen(true);
    setIsDialogOpen(false); // Close details dialog
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditRequest(null);
  };

  const handleEditSuccess = () => {
    if (onRequestUpdated) {
      onRequestUpdated();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Requests</CardTitle>
        <CardDescription>Your latest leave applications and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaveRequests.map(request => (
            <div 
              key={request.id} 
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" 
              onClick={() => handleRowClick(request)}
            >
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
      
      <LeaveDetailsDialog
        request={selectedRequest}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        userRole="employee"
        canEditStatus={false}
        onEdit={handleEditRequest}
      />
      
      <EditLeaveRequestDialog
        request={editRequest}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
};
