import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XCircle } from "lucide-react";

interface RejectReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  actionType: 'reject' | 'cancel';
  requestTitle?: string;
}

const rejectionReasons = [
  { value: "operational", label: "Operational reasons" },
  { value: "staff_retracting", label: "Staff retracting leave" },
  { value: "other", label: "Other (specify below)" }
];

export const RejectReasonDialog = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  requestTitle
}: RejectReasonDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const reasonLabel = rejectionReasons.find(r => r.value === selectedReason)?.label || selectedReason;
      const fullReason = additionalComments 
        ? `${reasonLabel}. Additional comments: ${additionalComments}`
        : reasonLabel;
      
      await onConfirm(fullReason);
      handleClose();
    } catch (error) {
      console.error(`Error ${actionType}ing leave:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setAdditionalComments("");
    setIsSubmitting(false);
    onClose();
  };

  const isValid = selectedReason && (selectedReason !== "other" || additionalComments.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            {actionType === 'reject' ? 'Reject Leave Request' : 'Cancel Approved Leave'}
          </DialogTitle>
          <DialogDescription>
            {requestTitle && (
              <span className="font-medium">{requestTitle}</span>
            )}
            <br />
            Please provide a reason for {actionType === 'reject' ? 'rejecting' : 'cancelling'} this leave request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for {actionType === 'reject' ? 'rejection' : 'cancellation'}</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {rejectionReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedReason === "other" || selectedReason) && (
            <div>
              <Label htmlFor="comments">
                {selectedReason === "other" ? "Please specify" : "Additional comments (optional)"}
              </Label>
              <Textarea
                id="comments"
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder={selectedReason === "other" 
                  ? "Please provide details..." 
                  : "Any additional information..."}
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Processing..." : `${actionType === 'reject' ? 'Reject' : 'Cancel'} Leave`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};