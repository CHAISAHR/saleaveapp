import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Send, Paperclip, X, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";

interface LeaveRequestFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: any;
}

export const LeaveRequestForm = ({ isOpen, onClose, currentUser }: LeaveRequestFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    title: "",
    detail: "",
    startDate: "",
    endDate: "",
    leaveType: "Annual",
    approvalManager: ""
  });

  // Calculate working days between dates
  const calculateWorkingDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('detail', formData.detail);
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('leaveType', formData.leaveType);
      submitData.append('approvalManager', formData.approvalManager);

      // Add attachments if any
      if (attachments) {
        for (let i = 0; i < attachments.length; i++) {
          submitData.append('attachments', attachments[i]);
        }
      }

      const authToken = localStorage.getItem('auth_token');
      const response = await fetch(`${apiConfig.baseURL}/api/leave/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Leave Request Submitted",
          description: `Your ${formData.leaveType} leave request has been submitted successfully. Working days: ${result.workingDays || calculatedDays}`,
        });

        // Reset form
        setFormData({
          title: "",
          detail: "",
          startDate: "",
          endDate: "",
          leaveType: "Annual",
          approvalManager: ""
        });
        setAttachments(null);
        setCalculatedDays(0);
        
        // Reset file input
        const fileInput = document.getElementById('attachments') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Close modal if it's a modal
        if (onClose) {
          onClose();
        }
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Submit leave request error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit leave request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Recalculate days when dates change
      if (field === 'startDate' || field === 'endDate') {
        const days = calculateWorkingDays(
          field === 'startDate' ? value : updated.startDate,
          field === 'endDate' ? value : updated.endDate
        );
        setCalculatedDays(days);
      }
      
      return updated;
    });
  };

  // Allow historic dates (1 year back) for the minimum date
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  const formContent = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Submit Leave Request
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Request time off for annual leave, sick days, or other approved leave types. You can submit requests for past dates if needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Leave Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Annual Leave, Sick Day"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select value={formData.leaveType} onValueChange={(value) => handleInputChange('leaveType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Maternity">Maternity</SelectItem>
                  <SelectItem value="Parental">Parental</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Adoption">Adoption</SelectItem>
                  <SelectItem value="Study">Study</SelectItem>
                  <SelectItem value="Wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                min={minDate}
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                min={formData.startDate || minDate}
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Working Days Calculation Display */}
          {calculatedDays > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Working days requested: {calculatedDays}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="approvalManager">Approval Manager</Label>
            <Input
              id="approvalManager"
              placeholder="Manager email (optional - will use default if empty)"
              value={formData.approvalManager}
              onChange={(e) => handleInputChange('approvalManager', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail">Description</Label>
            <Textarea
              id="detail"
              placeholder="Provide additional details about your leave request..."
              value={formData.detail}
              onChange={(e) => handleInputChange('detail', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments (Optional)
            </Label>
            <Input
              id="attachments"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setAttachments(e.target.files)}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500">
              Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB per file)
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Leave Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // If isOpen is provided, render as a modal
  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise render as a regular component
  return formContent;
};