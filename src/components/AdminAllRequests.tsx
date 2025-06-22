import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, FileText, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";
import { CSVUploader } from "./admin/CSVUploader";

interface LeaveRequest {
  LeaveID: number;
  Title: string;
  Detail: string;
  StartDate: string;
  EndDate: string;
  LeaveType: string;
  Requester: string;
  Approver?: string;
  Status: string;
  Created: string;
  workingDays: number;
  attachment_count: number;
}

export const AdminAllRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiConfig.baseURL}/api/leave/requests`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const downloadRequests = () => {
    const csvHeaders = [
      'Employee',
      'Title',
      'Detail',
      'Leave Type',
      'Start Date',
      'End Date',
      'Working Days',
      'Status',
      'Approver',
      'Submitted Date'
    ];

    const csvData = requests.map(request => [
      request.Requester,
      request.Title,
      request.Detail || '',
      request.LeaveType,
      new Date(request.StartDate).toLocaleDateString(),
      new Date(request.EndDate).toLocaleDateString(),
      request.workingDays,
      request.Status,
      request.Approver || '',
      new Date(request.Created).toLocaleDateString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Leave requests have been downloaded as CSV.",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getLeaveTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return 'default';
      case 'sick': return 'secondary';
      case 'maternity': return 'outline';
      case 'study': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Leave Requests</h2>
          <p className="text-gray-600">View and manage all employee leave requests</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={downloadRequests}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button 
            onClick={() => setShowBulkUpload(true)}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
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
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.Status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <User className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.Status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.Status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
          <CardDescription>Complete history of leave requests across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading requests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.LeaveID}>
                    <TableCell className="font-medium">{request.Requester}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.Title}</div>
                        {request.Detail && (
                          <div className="text-sm text-gray-500 truncate max-w-32">
                            {request.Detail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLeaveTypeBadgeVariant(request.LeaveType)}>
                        {request.LeaveType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(request.StartDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">to {new Date(request.EndDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {request.workingDays}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.Status)}>
                        {request.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {request.Approver || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(request.Created).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Leave Requests</DialogTitle>
            <DialogDescription>
              Upload multiple leave requests via CSV file
            </DialogDescription>
          </DialogHeader>
          <CSVUploader 
            type="requests" 
            onUploadComplete={() => {
              fetchRequests();
              setShowBulkUpload(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
