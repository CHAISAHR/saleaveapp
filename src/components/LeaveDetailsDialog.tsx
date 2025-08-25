import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar, User, FileText, Edit, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { RejectReasonDialog } from "./RejectReasonDialog";
import { useEmployeeBalance } from "@/hooks/useEmployeeBalance";

interface LeaveRequest {
  LeaveID?: number;
  id?: number;
  Title?: string;
  title?: string;
  Detail?: string;
  description?: string;
  StartDate?: string;
  startDate?: string;
  EndDate?: string;
  endDate?: string;
  LeaveType?: string;
  type?: string;
  Requester?: string;
  requester?: string;
  Approver?: string;
  approver?: string;
  Status?: string;
  status?: string;
  workingDays?: number;
  days?: number;
  Created?: string;
  submittedDate?: string;
  Modified?: string;
  ModifiedBy?: string;
}

interface LeaveDetailsDialogProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'employee' | 'manager' | 'admin' | 'cd';
  onApprove?: (requestId: number, reason?: string) => Promise<void>;
  onReject?: (requestId: number, reason?: string) => Promise<void>;
  onCancel?: (requestId: number, reason?: string) => Promise<void>;
  canEditStatus?: boolean;
  onEdit?: (request: LeaveRequest) => void;
}

export const LeaveDetailsDialog = ({
  request,
  isOpen,
  onClose,
  userRole,
  onApprove,
  onReject,
  onCancel,
  canEditStatus = true,
  onEdit
}: LeaveDetailsDialogProps) => {
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Always call hooks before any conditional returns
  // Always call the hook with the same parameters to avoid React hooks error
  const { balance, loading: balanceLoading, error: balanceError } = useEmployeeBalance(
    request?.Requester || request?.requester || '', 
    request?.LeaveType || request?.type || ''
  );

  if (!request) return null;

  // Handle different data structure formats
  const leaveId = request.LeaveID || request.id;
  const title = request.Title || request.title;
  const detail = request.Detail || request.description;
  const startDate = request.StartDate || request.startDate;
  const endDate = request.EndDate || request.endDate;
  const leaveType = request.LeaveType || request.type;
  const requester = request.Requester || request.requester;
  const approver = request.Approver || request.approver;
  const status = (request.Status || request.status || '').toLowerCase();
  const days = request.workingDays || request.days;
  const created = request.Created || request.submittedDate;
  const modified = request.Modified;
  const modifiedBy = request.ModifiedBy;

  // Only show balance for non-employees
  const shouldShowBalance = userRole !== 'employee' && requester;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-lime-600">Approved</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'cancel') => {
    if (!leaveId) return;
    
    if (action === 'reject') {
      setShowRejectDialog(true);
      return;
    }
    
    if (action === 'cancel') {
      setShowCancelDialog(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (action === 'approve' && onApprove) {
        await onApprove(leaveId);
      }
      
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing leave:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} leave request. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectWithReason = async (reason: string) => {
    if (!leaveId || !onReject) return;
    
    try {
      await onReject(leaveId, reason);
      onClose();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast({
        title: "Error",
        description: "Failed to reject leave request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelWithReason = async (reason: string) => {
    if (!leaveId || !onCancel) return;
    
    try {
      await onCancel(leaveId, reason);
      onClose();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast({
        title: "Error",
        description: "Failed to cancel leave request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canApprove = userRole !== 'employee' && status === 'pending' && canEditStatus;
  const canReject = userRole !== 'employee' && status === 'pending' && canEditStatus;
  const canCancelApproved = userRole !== 'employee' && status === 'approved' && canEditStatus;
  
  // Check if employee can edit - only for pending requests where start date hasn't passed
  const canEmployeeEdit = () => {
    if (userRole !== 'employee' || status !== 'pending' || !onEdit) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day
    
    const leaveStartDate = new Date(startDate);
    leaveStartDate.setHours(0, 0, 0, 0);
    
    return leaveStartDate >= today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            Leave Request Details
          </DialogTitle>
          <DialogDescription>
            {leaveType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(status)}
                {getStatusBadge(status)}
              </div>
            </div>
            <div className="text-right">
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Requested by</div>
                  <div className="font-medium">{requester}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {days} working day{days !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Leave Balance - Show for managers/admins */}
              {shouldShowBalance && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Current {leaveType} Balance</div>
                    <div className="font-medium">
                      {balanceLoading ? (
                        <span className="text-muted-foreground">Loading...</span>
                      ) : balanceError ? (
                        <span className="text-destructive">Unable to load</span>
                      ) : (
                        <span className={balance !== null && balance < days ? "text-destructive" : ""}>
                          {balance !== null ? `${balance.toFixed(1)} days` : 'N/A'}
                          {balance !== null && balance < days && (
                            <span className="text-xs text-destructive ml-2">
                              (Insufficient balance)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {approver && (
                <div>
                  <div className="text-sm text-muted-foreground">Approved by</div>
                  <div className="font-medium">{approver}</div>
                </div>
              )}

              <div>
                <div className="text-sm text-muted-foreground">Submitted</div>
                <div className="font-medium">{formatDateTime(created)}</div>
              </div>

              {modified && (
                <div>
                  <div className="text-sm text-muted-foreground">Last modified</div>
                  <div className="font-medium">{formatDateTime(modified)}</div>
                  {modifiedBy && (
                    <div className="text-xs text-muted-foreground">by {modifiedBy}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {detail && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {detail}
              </div>
            </div>
          )}

        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {canEmployeeEdit() && (
              <Button
                onClick={() => onEdit!(request)}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Request
              </Button>
            )}
            
            {canApprove && (
              <Button
                onClick={() => handleAction('approve')}
                disabled={isSubmitting}
                className="bg-lime-600 hover:bg-lime-700 flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            
            {canReject && (
              <Button
                variant="destructive"
                onClick={() => handleAction('reject')}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            
            {canCancelApproved && (
              <Button
                variant="outline"
                onClick={() => handleAction('cancel')}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
          
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      
      <RejectReasonDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleRejectWithReason}
        actionType="reject"
        requestTitle={title}
      />
      
      <RejectReasonDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelWithReason}
        actionType="cancel"
        requestTitle={title}
      />
    </Dialog>
  );
};