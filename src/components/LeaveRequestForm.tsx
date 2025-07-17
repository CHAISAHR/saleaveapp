import { useState, useEffect } from "react";
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
import { CalendarIcon, Info, AlertTriangle, Upload, X, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { calculateWorkingDays } from "@/lib/utils";
import { apiConfig } from "@/config/apiConfig";

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export const LeaveRequestForm = ({ isOpen, onClose, currentUser }: LeaveRequestFormProps) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    leaveType: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    isHalfDay: false,
    useAlternativeManager: false,
    alternativeManager: "",
    alternativeManagerReason: "",
  });

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<Date[]>([]);
  const [managerInfo, setManagerInfo] = useState<{ name: string; email: string } | null>(null);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);

  // Fetch manager info based on current user's department
  useEffect(() => {
    const fetchManagerInfo = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return;

        // Fetch all users to find department manager
        const usersResponse = await fetch(`${apiConfig.endpoints.users}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          
          // Find managers in the same department as current user
          const departmentManagers = usersData.users?.filter((u: any) => 
            u.department === currentUser.department && 
            (u.role === 'manager' || u.role === 'admin') &&
            u.email !== currentUser.email // Don't include self
          ) || [];
          
          // Set the first department manager as the default manager
          if (departmentManagers.length > 0) {
            const primaryManager = departmentManagers[0];
            console.log('Found department manager:', primaryManager);
            setManagerInfo({ 
              name: primaryManager.name, 
              email: primaryManager.email 
            });
          } else {
            console.log('No manager found for department:', currentUser.department);
            // Fallback to admin if no department manager found
            const adminUsers = usersData.users?.filter((u: any) => u.role === 'admin') || [];
            if (adminUsers.length > 0) {
              setManagerInfo({ 
                name: adminUsers[0].name, 
                email: adminUsers[0].email 
              });
            }
          }
          
          // Set available managers (all users with manager or admin role)
          const allManagers = usersData.users?.filter((u: any) => 
            (u.role === 'manager' || u.role === 'admin') &&
            u.email !== currentUser.email
          ) || [];
          setAvailableManagers(allManagers);
        }
      } catch (error) {
        console.error('Failed to fetch manager info:', error);
      }
    };

    fetchManagerInfo();
  }, [currentUser.email, currentUser.department]);

  // Fetch company holidays on component mount
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(`${apiConfig.endpoints.holiday}`);
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
    { 
      value: "annual", 
      label: "Annual Leave", 
      description: "Vacation and personal time off",
      balance: 12,
      total: 20,
      unit: "days"
    },
    { 
      value: "sick", 
      label: "Sick Leave", 
      description: "Medical appointments and illness",
      balance: 33,
      total: 36,
      unit: "days"
    },
    { 
      value: "maternity", 
      label: "Maternity Leave", 
      description: "Childbirth and recovery period (for women)",
      balance: 3,
      total: 3,
      unit: "months"
    },
    { 
      value: "parental", 
      label: "Parental Leave", 
      description: "Caring for newborn or adopted child",
      balance: 4,
      total: 4,
      unit: "weeks"
    },
    { 
      value: "family", 
      label: "Family Leave", 
      description: "Caring for family members",
      balance: 2,
      total: 3,
      unit: "days"
    },
    { 
      value: "adoption", 
      label: "Adoption Leave", 
      description: "Adopting a child",
      balance: 4,
      total: 4,
      unit: "weeks"
    },
    { 
      value: "study", 
      label: "Study Leave", 
      description: "Professional development and training",
      balance: 4,
      total: 6,
      unit: "days"
    },
    { 
      value: "wellness", 
      label: "Wellness Leave", 
      description: "Mental health and wellbeing",
      balance: 2,
      total: 2,
      unit: "days"
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

  const isCompanyHoliday = (date: Date) => {
    return companyHolidays.some(holiday => 
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
    );
  };

  const calculateWorkingDaysForLeave = () => {
    if (!formData.startDate || !formData.endDate || !selectedLeaveType) return 0;

    // For maternity leave (months), calculate in decimal months
    if (selectedLeaveType.unit === "months") {
      const startDate = formData.startDate;
      const endDate = formData.endDate;
      
      // Calculate the difference in months more precisely
      const yearDiff = endDate.getFullYear() - startDate.getFullYear();
      const monthDiff = endDate.getMonth() - startDate.getMonth();
      const dayDiff = endDate.getDate() - startDate.getDate();
      
      // Total months including partial months
      let totalMonths = yearDiff * 12 + monthDiff;
      
      // Add partial month based on days
      if (dayDiff > 0) {
        // Get days in the end month to calculate the fraction
        const daysInEndMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
        const daysFraction = (dayDiff + 1) / daysInEndMonth; // +1 to include the end date
        totalMonths += daysFraction;
      } else if (dayDiff === 0) {
        totalMonths += 1; // Include the full month when start and end are on same day
      }
      
      return Math.round(totalMonths * 10) / 10; // Round to 1 decimal place
    }
    
    if (selectedLeaveType.unit === "weeks") {
      const timeDiff = formData.endDate.getTime() - formData.startDate.getTime();
      const weeks = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));
      return weeks; // Return weeks for parental/adoption leave
    }

    // For day-based leave types, calculate working days
    return calculateWorkingDays(formData.startDate, formData.endDate, publicHolidays, companyHolidays, formData.isHalfDay);
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
    const requestedAmount = calculateWorkingDaysForLeave();
    return selectedLeaveType.balance < requestedAmount;
  };

  // Get the display text for leave duration based on type
  const getDisplayDuration = () => {
    const amount = calculateWorkingDaysForLeave();
    if (!selectedLeaveType) return "";
    
    const unit = selectedLeaveType.unit;
    const pluralUnit = unit === "day" ? "days" : unit === "week" ? "weeks" : unit === "month" ? "months" : unit;
    
    return `${amount} ${amount === 1 ? unit : pluralUnit}`;
  };

  const requiresDocumentAttachment = () => {
    if (formData.leaveType === 'sick') {
      const workingDays = calculateWorkingDaysForLeave();
      return workingDays >= 2;
    }
    return false;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const validFiles = newFiles.filter(file => {
        const isValidType = file.type === 'application/pdf' || 
                           file.type.startsWith('image/') ||
                           file.type === 'application/msword' ||
                           file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        
        if (!isValidType) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported file type. Please upload PDF, Word documents, or images.`,
            variant: "destructive",
          });
          return false;
        }
        
        if (!isValidSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 5MB limit.`,
            variant: "destructive",
          });
          return false;
        }
        
        return true;
      });
      
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sendEmailNotifications = async (requestData: any) => {
    try {
      const approverEmail = formData.useAlternativeManager && formData.alternativeManager 
        ? formData.alternativeManager 
        : managerInfo?.email;

      const approverName = formData.useAlternativeManager && formData.alternativeManager
        ? availableManagers.find(m => m.email === formData.alternativeManager)?.name || formData.alternativeManager
        : managerInfo?.name || "Manager";
      
      const managerEmailData = {
        to: approverEmail,
        cc: 'chaisahr@clintonhealthaccess.org',
        subject: `New Leave Request - ${requestData.title}`,
        body: `Dear ${approverName},
        
        A new leave request has been submitted and requires your approval:
        ${formData.useAlternativeManager ? `\n⚠️ ALTERNATIVE APPROVAL: You have been designated as the alternative approver for this request.\nReason: ${formData.alternativeManagerReason}\n` : ''}
        
        Employee: ${requestData.submittedBy}
        Email: ${currentUser.email}
        Department: ${currentUser.department}
        
        Leave Details:
        - Type: ${selectedLeaveType?.label}
        - Title: ${requestData.title}
        - Dates: ${requestData.startDate} to ${requestData.endDate}
        - Calendar Days: ${getCalendarDays()}
        - Duration Applied: ${getDisplayDuration()}
        - Description: ${requestData.description}
        ${requestData.requiresHRApproval ? '\n⚠️ REQUIRES HR APPROVAL: Insufficient leave balance' : ''}
        ${requestData.attachedFiles && requestData.attachedFiles.length > 0 ? `\n📎 ATTACHED DOCUMENTS: ${requestData.attachedFiles.map((f: File) => f.name).join(', ')}` : ''}
        
        Please log into the leave management system to review and approve this request.
        
        Best regards,
        HR`
      };

      console.log('Manager Email:', managerEmailData);
      
      const employeeEmailData = {
        to: currentUser.email,
        subject: `Leave Request Submitted - ${requestData.title}`,
        body: `Dear ${currentUser.name},
        
        Your leave request has been successfully submitted and is pending approval.
        
        Request Details:
        - Type: ${selectedLeaveType?.label}
        - Dates: ${requestData.startDate} to ${requestData.endDate}
        - Calendar Days: ${getCalendarDays()}
        - Duration Applied: ${getDisplayDuration()}
        - Status: Pending Approval
        ${formData.useAlternativeManager ? `\n📋 Alternative Approver: ${approverName} (${approverEmail})` : ''}
        
        You will receive an email notification once your ${formData.useAlternativeManager ? 'alternative ' : ''}manager reviews your request.
        
        Best regards,
        HR`
      };

      console.log('Employee Email:', employeeEmailData);
      
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

    if (requiresDocumentAttachment() && attachedFiles.length === 0) {
      toast({
        title: "Document Required",
        description: "Please attach supporting documents for sick leave of 2 or more days.",
        variant: "destructive",
      });
      return;
    }

    const leaveDuration = calculateWorkingDaysForLeave();
    const requiresHRApproval = isBalanceInsufficient();
    
    const requestData = {
      ...formData,
      workingDays: leaveDuration,
      submittedBy: currentUser.name,
      submittedDate: new Date().toISOString(),
      status: 'pending',
      requiresHRApproval,
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
    };

    console.log("Leave request submitted:", requestData);

    await sendEmailNotifications(requestData);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('detail', formData.description);
      formDataToSend.append('startDate', formData.startDate!.toISOString());
      formDataToSend.append('endDate', formData.endDate!.toISOString());
      formDataToSend.append('leaveType', selectedLeaveType?.label || '');
      formDataToSend.append('workingDays', leaveDuration.toString());
      
      attachedFiles.forEach((file, index) => {
        formDataToSend.append(`attachments`, file);
      });

      // Get token and validate it exists
      const authToken = localStorage.getItem('auth_token');
      console.log('Auth token present:', !!authToken);
      console.log('Auth token value (first 20 chars):', authToken?.substring(0, 20));
      
      if (!authToken || authToken === 'mock-admin-token' || authToken === 'mock-jwt-token') {
        console.error('Invalid or mock token detected:', authToken);
        toast({
          title: "Authentication Error",
          description: "Please log in again to submit leave requests.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${apiConfig.endpoints.leave}/request`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Leave request submission failed:', errorText);
        
        if (response.status === 403) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('manualUser');
          localStorage.removeItem('mockUser');
          // Optionally redirect to login
          window.location.reload();
          return;
        }
        
        throw new Error(`Failed to submit leave request: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Leave request submitted successfully:', result);

    } catch (error) {
      console.error('Failed to submit leave request:', error);
      toast({
        title: "Submission Failed",
        description: `Failed to submit leave request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
      return;
    }

    let toastMessage = `Your ${selectedLeaveType?.label.toLowerCase()} request for ${getDisplayDuration()} has been submitted for approval.`;
    
    if (formData.useAlternativeManager) {
      const altManagerName = availableManagers.find(m => m.email === formData.alternativeManager)?.name || formData.alternativeManager;
      toastMessage += ` Request sent to alternative manager: ${altManagerName}.`;
    }
    
    if (requiresHRApproval) {
      toastMessage += " This request requires HR approval due to insufficient balance.";
    }

    if (attachedFiles.length > 0) {
      toastMessage += ` ${attachedFiles.length} document${attachedFiles.length > 1 ? 's' : ''} attached.`;
    }

    toast({
      title: "Request Submitted",
      description: toastMessage,
    });

    setFormData({
      title: "",
      description: "",
      leaveType: "",
      startDate: undefined,
      endDate: undefined,
      isHalfDay: false,
      useAlternativeManager: false,
      alternativeManager: "",
      alternativeManagerReason: "",
    });
    setAttachedFiles([]);
    onClose();
  };

  if (!isOpen) return null;

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
                        <div className="text-xs text-gray-500">
                          {type.balance} {type.unit} available
                        </div>
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
                    disabled={(date) => date < (formData.startDate || new Date('1900-01-01'))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedLeaveType?.unit === "days" && (
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
          )}

          {/* Alternative Manager Section */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base text-purple-800">Manager Approval Options</CardTitle>
              </div>
              <CardDescription className="text-purple-700">
                {managerInfo ? (
                  <>Manager: <strong>{managerInfo.name}</strong> ({managerInfo.email})</>
                ) : (
                  "Loading manager information..."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select alternative manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select a manager</SelectItem>
                        {availableManagers.map((manager) => (
                          <SelectItem key={manager.email} value={manager.email}>
                            <div>
                              <div className="font-medium">{manager.name}</div>
                              <div className="text-xs text-gray-500">{manager.department} - {manager.email}</div>
                            </div>
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
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {requiresDocumentAttachment() && (
            <div className="space-y-3">
              <Label htmlFor="documents">Supporting Documents *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        Click to upload files
                      </span>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word documents, or images (max 5MB each)
                    </p>
                  </div>
                </div>
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Attached Files:</Label>
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedLeaveType && formData.startDate && formData.endDate && (
            <div className="space-y-3">
              {isBalanceInsufficient() && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>HR Approval Required:</strong> Your available balance ({selectedLeaveType.balance} {selectedLeaveType.unit}) is less than the requested duration ({getDisplayDuration()}). This request will be forwarded to HR for final approval after manager approval.
                  </AlertDescription>
                </Alert>
              )}

              {requiresDocumentAttachment() && (
                <Alert className="border-purple-200 bg-purple-50">
                  <Upload className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Document Required:</strong> Please attach supporting documents (medical certificate, doctor's note, etc.) for sick leave of 2 or more days.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {formData.startDate && formData.endDate && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Leave Duration Summary</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Calendar Days:</span>
                      <span className="font-medium text-green-800">{getCalendarDays()} day{getCalendarDays() > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Duration Applied:</span>
                      <span className="font-medium text-green-800">
                        {getDisplayDuration()}
                        {formData.isHalfDay && selectedLeaveType?.unit === "days" && " (Half Day)"}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 bg-green-100 p-2 rounded mt-2">
                    {selectedLeaveType?.unit === "days" && "Working days exclude weekends, South African public holidays, and company holidays."}
                    {selectedLeaveType?.unit === "months" && "Maternity leave is calculated in months (approximately 30 calendar days or 22 working days per month)."}
                    {selectedLeaveType?.unit === "weeks" && "Parental and adoption leave is calculated in weeks (5 working days per week)."}
                    {formData.isHalfDay && selectedLeaveType?.unit === "days" && " Half-day requests count as 0.5 days per working day selected."}
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
                  <span className="font-medium">
                    {selectedLeaveType.balance} of {selectedLeaveType.total} {selectedLeaveType.unit}
                  </span>
                </div>
                
                {selectedLeaveType.value === 'annual' && (
                  <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                    <strong>Policy Update:</strong> Annual leave must be used within the leave year. Unused leave may be forfeited based on company policy.
                  </div>
                )}
                
                {selectedLeaveType.value === 'maternity' && (
                  <div className="mt-2 text-xs text-pink-700 bg-pink-50 p-2 rounded">
                    <strong>Note:</strong> Maternity leave is allocated in months. Each month is equivalent to approximately 30 calendar days or 22 working days.
                  </div>
                )}

                {(selectedLeaveType.value === 'parental' || selectedLeaveType.value === 'adoption') && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                    <strong>Note:</strong> {selectedLeaveType.label} is allocated in weeks. Each week is equivalent to 5 working days.
                  </div>
                )}
                
                {selectedLeaveType.value === 'sick' && calculateWorkingDaysForLeave() > 3 && (
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
