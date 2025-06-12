
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Info, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export const LeaveRequestForm = ({ isOpen, onClose, currentUser }: LeaveRequestFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    leaveType: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    isHalfDay: false,
  });

  const leaveTypes = [
    { 
      value: "annual", 
      label: "Annual Leave", 
      description: "Vacation and personal time off",
      balance: 12,
      total: 20
    },
    { 
      value: "sick", 
      label: "Sick Leave", 
      description: "Medical appointments and illness",
      balance: 33,
      total: 36
    },
    { 
      value: "maternity", 
      label: "Maternity Leave", 
      description: "Childbirth and recovery period",
      balance: 90,
      total: 90
    },
    { 
      value: "parental", 
      label: "Parental Leave", 
      description: "Caring for newborn or adopted child",
      balance: 20,
      total: 20
    },
    { 
      value: "family", 
      label: "Family Leave", 
      description: "Caring for family members",
      balance: 2,
      total: 3
    },
    { 
      value: "adoption", 
      label: "Adoption Leave", 
      description: "Adopting a child",
      balance: 20,
      total: 20
    },
    { 
      value: "study", 
      label: "Study Leave", 
      description: "Professional development and training",
      balance: 4,
      total: 6
    },
    { 
      value: "wellness", 
      label: "Wellness Leave", 
      description: "Mental health and wellbeing",
      balance: 2,
      total: 2
    }
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

  const selectedLeaveType = leaveTypes.find(type => type.value === formData.leaveType);

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const isPublicHoliday = (date: Date) => {
    return publicHolidays.some(holiday => 
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
    );
  };

  const calculateWorkingDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    let workingDays = 0;
    const currentDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate) && !isPublicHoliday(currentDate)) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // If it's a half day request, deduct 0.5 from the working days
    return formData.isHalfDay ? Math.max(0, workingDays - 0.5) : workingDays;
  };

  const getCalendarDays = () => {
    if (formData.startDate && formData.endDate) {
      const timeDiff = formData.endDate.getTime() - formData.startDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      return dayDiff > 0 ? dayDiff : 0;
    }
    return 0;
  };

  // Check if balance is insufficient
  const isBalanceInsufficient = () => {
    if (!selectedLeaveType) return false;
    const workingDays = calculateWorkingDays();
    return selectedLeaveType.balance < workingDays;
  };

  // Check if sick leave requires medical certificate
  const requiresMedicalCertificate = () => {
    if (formData.leaveType === 'sick') {
      const workingDays = calculateWorkingDays();
      return workingDays > 1;
    }
    return false;
  };

  const sendEmailNotifications = async (requestData: any) => {
    try {
      // Send email to manager
      const managerEmail = `${currentUser.department.toLowerCase()}.manager@company.com`;
      
      console.log(`Email sent to manager (${managerEmail}):
        Subject: New Leave Request - ${requestData.title}
        
        Dear Manager,
        
        A new leave request has been submitted and requires your approval:
        
        Employee: ${requestData.submittedBy}
        Email: ${currentUser.email}
        Department: ${currentUser.department}
        
        Leave Details:
        - Type: ${selectedLeaveType?.label}
        - Title: ${requestData.title}
        - Dates: ${requestData.startDate} to ${requestData.endDate}
        - Working Days: ${requestData.workingDays}
        - Description: ${requestData.description}
        ${requestData.requiresHRApproval ? '\n⚠️ REQUIRES HR APPROVAL: Insufficient leave balance' : ''}
        ${requestData.requiresMedicalCert ? '\n📄 REQUIRES: Medical certificate to be forwarded to HR' : ''}
        
        Please log into the leave management system to review and approve this request.
        
        Best regards,
        Leave Management System`);
      
      // Send email to HR if required
      if (requestData.requiresHRApproval) {
        console.log(`Email sent to HR (hr@company.com):
          Subject: Leave Request Requires HR Approval - ${requestData.title}
          
          Dear HR Team,
          
          A leave request has been submitted that requires HR approval due to insufficient leave balance:
          
          Employee: ${requestData.submittedBy}
          Email: ${currentUser.email}
          Department: ${currentUser.department}
          Manager: ${managerEmail}
          
          Leave Details:
          - Type: ${selectedLeaveType?.label}
          - Available Balance: ${selectedLeaveType?.balance} days
          - Requested: ${requestData.workingDays} days
          - Shortfall: ${requestData.workingDays - (selectedLeaveType?.balance || 0)} days
          
          Please review this request for final approval after manager approval.
          
          Best regards,
          Leave Management System`);
      }
      
      // Send confirmation email to employee
      console.log(`Email sent to employee (${currentUser.email}):
        Subject: Leave Request Submitted - ${requestData.title}
        
        Dear ${currentUser.name},
        
        Your leave request has been successfully submitted and is pending approval.
        
        Request Details:
        - Type: ${selectedLeaveType?.label}
        - Dates: ${requestData.startDate} to ${requestData.endDate}
        - Working Days: ${requestData.workingDays}
        - Status: Pending Approval
        ${requestData.requiresHRApproval ? '\n⚠️ Note: This request requires HR approval due to insufficient balance' : ''}
        ${requestData.requiresMedicalCert ? '\n📄 Action Required: Please forward medical certificate to HR' : ''}
        
        You will receive an email notification once your manager reviews your request.
        
        Best regards,
        Leave Management System`);
      
      // Log to leave_taken table
      const leaveRecord = {
        Title: requestData.title,
        Detail: requestData.description,
        StartDate: requestData.startDate,
        EndDate: requestData.endDate,
        LeaveType: selectedLeaveType?.label,
        Requester: currentUser.email,
        Status: 'pending',
        workingDays: requestData.workingDays,
        Created: new Date().toISOString(),
        requiresHRApproval: requestData.requiresHRApproval
      };
      
      console.log('Leave record to be created:', leaveRecord);
      
    } catch (error) {
      console.error('Failed to send email notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.leaveType || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const workingDays = calculateWorkingDays();
    const requiresHRApproval = isBalanceInsufficient();
    const requiresMedicalCert = requiresMedicalCertificate();
    
    const requestData = {
      ...formData,
      workingDays,
      submittedBy: currentUser.name,
      submittedDate: new Date().toISOString(),
      status: 'pending',
      requiresHRApproval,
      requiresMedicalCert
    };

    console.log("Leave request submitted:", requestData);

    // Send email notifications
    await sendEmailNotifications(requestData);

    let toastMessage = `Your ${selectedLeaveType?.label.toLowerCase()} request for ${workingDays} working day${workingDays > 1 ? 's' : ''} has been submitted for approval.`;
    
    if (requiresHRApproval) {
      toastMessage += " This request requires HR approval due to insufficient balance.";
    }
    
    if (requiresMedicalCert) {
      toastMessage += " Please forward medical certificate to HR.";
    }

    toast({
      title: "Request Submitted",
      description: toastMessage,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Leave Request</DialogTitle>
          <DialogDescription>
            Fill out the form below to request time off. Your manager will be notified automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Summer Vacation"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select value={formData.leaveType} onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.balance} days available</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
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

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    disabled={(date) => date < (formData.startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              id="halfDay"
              checked={formData.isHalfDay}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isHalfDay: checked }))}
            />
            <Label htmlFor="halfDay" className="text-sm font-medium">
              Half Day Request
            </Label>
          </div>

          {/* Validation Alerts */}
          {selectedLeaveType && formData.startDate && formData.endDate && (
            <div className="space-y-3">
              {/* Insufficient Balance Alert */}
              {isBalanceInsufficient() && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>HR Approval Required:</strong> Your available balance ({selectedLeaveType.balance} days) is less than the requested days ({calculateWorkingDays()} days). This request will be forwarded to HR for final approval after manager approval.
                  </AlertDescription>
                </Alert>
              )}

              {/* Medical Certificate Alert */}
              {requiresMedicalCertificate() && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Medical Certificate Required:</strong> For sick leave exceeding 1 day, please forward a medical certificate to HR.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {formData.startDate && formData.endDate && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Leave Days Summary</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Calendar Days:</span>
                      <span className="font-medium text-blue-800">{getCalendarDays()} day{getCalendarDays() > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Working Days Applied:</span>
                      <span className="font-medium text-blue-800">
                        {calculateWorkingDays()} day{calculateWorkingDays() > 1 ? 's' : ''}
                        {formData.isHalfDay && " (Half Day)"}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded mt-2">
                    Working days exclude weekends and South African public holidays. 
                    {formData.isHalfDay && " Half-day requests count as 0.5 days per working day selected."}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about your leave request..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {selectedLeaveType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedLeaveType.label} Information</CardTitle>
                <CardDescription>{selectedLeaveType.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <span>Available Balance:</span>
                  <span className="font-medium">{selectedLeaveType.balance} of {selectedLeaveType.total} days</span>
                </div>
                
                {selectedLeaveType.value === 'annual' && (
                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                    <strong>Reminder:</strong> Annual leave expires 6 months after the leave year ends.
                  </div>
                )}
                
                {selectedLeaveType.value === 'sick' && calculateWorkingDays() > 3 && (
                  <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    <strong>Note:</strong> Medical certificate required for sick leave exceeding 3 consecutive working days.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
