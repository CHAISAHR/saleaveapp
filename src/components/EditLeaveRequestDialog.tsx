import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, AlertTriangle, Users } from "lucide-react";
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
  Approver?: string;
  approver?: string;
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
    useAlternativeManager: false,
    alternativeManager: "",
    alternativeManagerReason: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyHolidays, setCompanyHolidays] = useState<Date[]>([]);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [currentManager, setCurrentManager] = useState<{ name: string; email: string } | null>(null);

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
        useAlternativeManager: false,
        alternativeManager: "",
        alternativeManagerReason: "",
      });
    }
  }, [request]);

  // Fetch available managers and current manager info
  useEffect(() => {
    const fetchManagersAndCurrentManager = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return;

        // Fetch all users to get managers and current user's manager
        const usersResponse = await fetch(`${apiConfig.endpoints.users}/basic`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const allUsers = usersData.users || [];
          
          // Set available managers (users with manager or admin role)
          const managers = allUsers.filter((u: any) => 
            u.role === 'manager' || u.role === 'admin' || u.role === 'CD'
          );
          setAvailableManagers(managers);
          
          // Get the actual approver from the request
          if (request) {
            const approverEmail = request.Approver || request.approver;
            if (approverEmail) {
              // Find the approver in the users list
              const approver = allUsers.find((u: any) => u.email === approverEmail);
              if (approver) {
                setCurrentManager({ 
                  name: approver.name, 
                  email: approver.email 
                });
              } else {
                // If approver not found in users list, use the email
                setCurrentManager({ 
                  name: approverEmail, 
                  email: approverEmail 
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch managers:', error);
      }
    };

    if (isOpen && request) {
      fetchManagersAndCurrentManager();
    }
  }, [isOpen, request]);

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

    if (formData.useAlternativeManager) {
      if (!formData.alternativeManager || !formData.alternativeManagerReason.trim()) {
        toast({
          title: "Alternative Manager Required",
          description: "Please select an alternative manager and provide a reason.",
          variant: "destructive",
        });
        return;
      }
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
        // Send standardized leave type format
        leaveType: (() => {
          const standardizedTypes: Record<string, string> = {
            'annual': 'Annual', 'sick': 'Sick', 'maternity': 'Maternity',
            'parental': 'Parental', 'family': 'Family', 'adoption': 'Adoption',
            'study': 'Study', 'wellness': 'Wellness'
          };
          return standardizedTypes[formData.leaveType] || formData.leaveType;
        })(),
        workingDays,
        // Include alternative manager information if selected
        ...(formData.useAlternativeManager && formData.alternativeManager ? {
          alternativeApprover: formData.alternativeManager,
          approverReason: formData.alternativeManagerReason
        } : {})
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
        const successMessage = formData.useAlternativeManager 
          ? "Your leave request has been updated and sent to the alternative manager for approval."
          : "Your leave request has been updated and sent to your manager for re-approval.";
        
        toast({
          title: "Request updated",
          description: successMessage,
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

            {/* Manager Selection Section */}
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-800">Manager Selection</h4>
              </div>

              {currentManager && !formData.useAlternativeManager && (
                <div className="text-sm text-gray-600">
                  <p><strong>Current Manager:</strong> {currentManager.name} ({currentManager.email})</p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Switch
                  id="useAlternativeManager"
                  checked={formData.useAlternativeManager}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    useAlternativeManager: checked,
                    alternativeManager: checked ? prev.alternativeManager : "",
                    alternativeManagerReason: checked ? prev.alternativeManagerReason : ""
                  }))}
                />
                <Label htmlFor="useAlternativeManager" className="text-sm font-medium text-purple-800">
                  Use Alternative Manager
                </Label>
              </div>

              {formData.useAlternativeManager && (
                <div className="space-y-4 pl-6 border-l-2 border-purple-300">
                  <div className="space-y-2">
                    <Label htmlFor="alternativeManager">Alternative Manager *</Label>
                    <Select value={formData.alternativeManager || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, alternativeManager: value === "none" ? "" : value }))}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select alternative manager" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        <SelectItem value="none" disabled>Select a manager</SelectItem>
                        {availableManagers.map((manager) => (
                          <SelectItem key={manager.email} value={manager.email}>
                            {manager.name} ({manager.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternativeManagerReason">Reason for Alternative Manager *</Label>
                    <Textarea
                      id="alternativeManagerReason"
                      placeholder="e.g., Regular manager is on vacation, urgent approval needed, etc."
                      value={formData.alternativeManagerReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternativeManagerReason: e.target.value }))}
                      rows={2}
                      className="bg-white"
                    />
                  </div>
                </div>
              )}
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