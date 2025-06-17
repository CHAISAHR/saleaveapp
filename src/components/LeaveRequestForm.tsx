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
import { CalendarIcon, Info, AlertTriangle, Upload, X, FileText, Users } from "lucide-react";
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
    useAlternativeManager: false,
    alternativeManager: "",
    alternativeManagerReason: "",
  });

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Mock list of available managers - in real app this would come from API
  const availableManagers = [
    { email: "john.smith@company.com", name: "John Smith", department: "Operations" },
    { email: "sarah.jones@company.com", name: "Sarah Jones", department: "HR" },
    { email: "mike.wilson@company.com", name: "Mike Wilson", department: "Finance" },
    { email: "lisa.brown@company.com", name: "Lisa Brown", department: "IT" },
    { email: "david.taylor@company.com", name: "David Taylor", department: "Marketing" },
  ];

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

  // Check if document attachment is required for sick leave
  const requiresDocumentAttachment = () => {
    if (formData.leaveType === 'sick') {
      const workingDays = calculateWorkingDays();
      return workingDays >= 2;
    }
    return false;
  };

  // Handle file upload
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

  // Remove attached file
  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sendEmailNotifications = async (requestData: any) => {
    try {
      // Determine who to send to - alternative manager or default manager
      const approverEmail = formData.useAlternativeManager && formData.alternativeManager 
        ? formData.alternativeManager 
        : `${currentUser.department.toLowerCase()}.manager@company.com`;

      const approverName = formData.useAlternativeManager && formData.alternativeManager
        ? availableManagers.find(m => m.email === formData.alternativeManager)?.name || formData.alternativeManager
        : "Manager";
      
      // Send email to approver (manager or alternative manager)
      console.log(`Email sent to ${formData.useAlternativeManager ? 'alternative ' : ''}manager (${approverEmail}):
        Subject: New Leave Request - ${requestData.title}
        
        Dear ${approverName},
        
        A new leave request has been submitted and requires your approval:
        ${formData.useAlternativeManager ? `\n⚠️ ALTERNATIVE APPROVAL: You have been designated as the alternative approver for this request.\nReason: ${formData.alternativeManagerReason}\n` : ''}
        
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
        ${requestData.attachedFiles && requestData.attachedFiles.length > 0 ? `\n📎 ATTACHED DOCUMENTS: ${requestData.attachedFiles.map((f: File) => f.name).join(', ')}` : ''}
        
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
          ${formData.useAlternativeManager ? `Alternative Manager: ${approverName} (${approverEmail})` : `Manager: ${approverEmail}`}
          ${formData.useAlternativeManager ? `Alternative Manager Reason: ${formData.alternativeManagerReason}` : ''}
          
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
        ${formData.useAlternativeManager ? `\n📋 Alternative Approver: ${approverName} (${approverEmail})` : ''}
        ${formData.useAlternativeManager ? `\nReason for Alternative Approver: ${formData.alternativeManagerReason}` : ''}
        ${requestData.requiresHRApproval ? '\n⚠️ Note: This request requires HR approval due to insufficient balance' : ''}
        ${requestData.requiresMedicalCert ? '\n📄 Action Required: Please forward medical certificate to HR' : ''}
        ${requestData.attachedFiles && requestData.attachedFiles.length > 0 ? `\n📎 Documents Attached: ${requestData.attachedFiles.map((f: File) => f.name).join(', ')}` : ''}
        
        You will receive an email notification once your ${formData.useAlternativeManager ? 'alternative ' : ''}manager reviews your request.
        
        Best regards,
        Leave Management System`);
      
      // Log to leave_taken table with alternative manager information
      const leaveRecord = {
        Title: requestData.title,
        Detail: requestData.description,
        StartDate: requestData.startDate,
        EndDate: requestData.endDate,
        LeaveType: selectedLeaveType?.label,
        Requester: currentUser.email,
        Approver: formData.useAlternativeManager ? null : approverEmail,
        AlternativeApprover: formData.useAlternativeManager ? formData.alternativeManager : null,
        ApproverReason: formData.useAlternativeManager ? formData.alternativeManagerReason : null,
        Status: 'pending',
        workingDays: requestData.workingDays,
        Created: new Date().toISOString(),
        requiresHRApproval: requestData.requiresHRApproval,
        attachedFiles: requestData.attachedFiles ? requestData.attachedFiles.map((f: File) => ({ name: f.name, size: f.size, type: f.type })) : []
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

    // Validate alternative manager fields if enabled
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

    // Check if document attachment is required for sick leave
    if (requiresDocumentAttachment() && attachedFiles.length === 0) {
      toast({
        title: "Document Required",
        description: "Please attach supporting documents for sick leave of 2 or more days.",
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
      requiresMedicalCert,
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
    };

    console.log("Leave request submitted:", requestData);

    // Send email notifications
    await sendEmailNotifications(requestData);

    let toastMessage = `Your ${selectedLeaveType?.label.toLowerCase()} request for ${workingDays} working day${workingDays > 1 ? 's' : ''} has been submitted for approval.`;
    
    if (formData.useAlternativeManager) {
      const altManagerName = availableManagers.find(m => m.email === formData.alternativeManager)?.name || formData.alternativeManager;
      toastMessage += ` Request sent to alternative manager: ${altManagerName}.`;
    }
    
    if (requiresHRApproval) {
      toastMessage += " This request requires HR approval due to insufficient balance.";
    }
    
    if (requiresMedicalCert) {
      toastMessage += " Please forward medical certificate to HR.";
    }

    if (attachedFiles.length > 0) {
      toastMessage += ` ${attachedFiles.length} document${attachedFiles.length > 1 ? 's' : ''} attached.`;
    }

    toast({
      title: "Request Submitted",
      description: toastMessage,
    });

    // Reset form
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

          {/* Alternative Manager Section */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base text-blue-800">Manager Approval Options</CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                If your regular manager is unavailable, you can assign an alternative manager to approve this request.
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
                <Label htmlFor="useAlternativeManager" className="text-sm font-medium text-blue-800">
                  Use Alternative Manager
                </Label>
              </div>

              {formData.useAlternativeManager && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-300">
                  <div className="space-y-2">
                    <Label htmlFor="alternativeManager">Alternative Manager *</Label>
                    <Select value={formData.alternativeManager} onValueChange={(value) => setFormData(prev => ({ ...prev, alternativeManager: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select alternative manager" />
                      </SelectTrigger>
                      <SelectContent>
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

          {/* Document Upload Section for Sick Leave */}
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

              {/* Display attached files */}
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

              {/* Document Attachment Alert */}
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
