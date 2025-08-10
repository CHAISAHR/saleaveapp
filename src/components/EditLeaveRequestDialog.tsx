import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { calculateWorkingDays } from "@/lib/utils";
import { apiConfig } from "@/config/apiConfig";

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
  workingDays?: number;
  days?: number;
}

interface EditLeaveRequestDialogProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditLeaveRequestDialog = ({ request, isOpen, onClose, onSuccess }: EditLeaveRequestDialogProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    leaveType: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyHolidays, setCompanyHolidays] = useState<Date[]>([]);

  // Initialize form data when request changes
  useEffect(() => {
    if (request) {
      const title = request.Title || request.title || "";
      const description = request.Detail || request.description || "";
      const leaveType = request.LeaveType || request.type || "";
      const startDateStr = request.StartDate || request.startDate;
      const endDateStr = request.EndDate || request.endDate;

      setFormData({
        title,
        description,
        leaveType,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
      });
    }
  }, [request]);

  // Fetch company holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        const response = await fetch(`${apiConfig.endpoints.holiday}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const holidays = data.holidays.map((h: any) => new Date(h.date));
          setCompanyHolidays(holidays);
        }
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };
    fetchHolidays();
  }, []);

  const leaveTypes = [
    { value: "annual", label: "Annual Leave" },
    { value: "sick", label: "Sick Leave" },
    { value: "maternity", label: "Maternity Leave" },
    { value: "parental", label: "Parental Leave" },
    { value: "family", label: "Family Leave" },
    { value: "adoption", label: "Adoption Leave" },
    { value: "study", label: "Study Leave" },
    { value: "wellness", label: "Wellness Leave" }
  ];

  // South African public holidays for 2025
  const publicHolidays = [
    new Date(2025, 0, 1),   // New Year's Day
    new Date(2025, 2, 21),  // Human Rights Day
    new Date(2025, 3, 18),  // Good Friday
    new Date(2025, 3, 21),  // Family Day
    new Date(2025, 3, 27),  // Freedom Day
    new Date(2025, 4, 1),   // Workers' Day
    new Date(2025, 5, 16),  // Youth Day
    new Date(2025, 7, 9),   // National Women's Day
    new Date(2025, 8, 24),  // Heritage Day
    new Date(2025, 11, 16), // Day of Reconciliation
    new Date(2025, 11, 25), // Christmas Day
    new Date(2025, 11, 26), // Day of Goodwill
  ];

  const calculateWorkingDaysForLeave = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    return calculateWorkingDays(formData.startDate, formData.endDate, publicHolidays, companyHolidays, false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!request) return;
    
    const leaveId = request.LeaveID || request.id;
    if (!leaveId) return;

    // Validation
    if (!formData.title || !formData.description || !formData.leaveType || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.startDate >= formData.endDate) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const authToken = localStorage.getItem('auth_token');
      const workingDays = calculateWorkingDaysForLeave();

      const requestData = {
        title: formData.title,
        detail: formData.description,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        leaveType: formData.leaveType,
        workingDays
      };

      const response = await fetch(`${apiConfig.endpoints.leave}/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast({
          title: "Request updated",
          description: "Your leave request has been updated and sent to your manager for re-approval.",
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update leave request');
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update leave request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const workingDays = calculateWorkingDaysForLeave();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Leave Request</DialogTitle>
          <DialogDescription>
            Update your leave request details. Changes will require manager re-approval.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Editing this request will reset its status to "Pending" and require manager re-approval.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Leave Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of your leave"
                required
              />
            </div>

            <div>
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select value={formData.leaveType} onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      disabled={(date) => !formData.startDate || date < formData.startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <strong>Working Days:</strong> {workingDays} days
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide details about your leave request"
                className="min-h-[100px]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Updating..." : "Update Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};