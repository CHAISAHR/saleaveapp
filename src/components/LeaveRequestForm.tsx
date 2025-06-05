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
import { CalendarIcon, Info } from "lucide-react";
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

  const selectedLeaveType = leaveTypes.find(type => type.value === formData.leaveType);

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const timeDiff = formData.endDate.getTime() - formData.startDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      const totalDays = dayDiff > 0 ? dayDiff : 0;
      
      // If it's a half day request, divide by 2
      return formData.isHalfDay ? totalDays * 0.5 : totalDays;
    }
    return 0;
  };

  const getCalendarDays = () => {
    if (formData.startDate && formData.endDate) {
      const timeDiff = formData.endDate.getTime() - formData.startDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      return dayDiff > 0 ? dayDiff : 0;
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.leaveType || !formData.startDate || !formData.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const days = calculateDays();
    
    console.log("Leave request submitted:", {
      ...formData,
      days,
      submittedBy: currentUser.name,
      submittedDate: new Date().toISOString()
    });

    toast({
      title: "Request Submitted",
      description: `Your ${selectedLeaveType?.label.toLowerCase()} request for ${days} day${days > 1 ? 's' : ''} has been submitted for approval.`,
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
                      <span className="text-blue-600">Leave Days Applied:</span>
                      <span className="font-medium text-blue-800">
                        {calculateDays()} day{calculateDays() > 1 ? 's' : ''}
                        {formData.isHalfDay && " (Half Day)"}
                      </span>
                    </div>
                  </div>
                  {formData.isHalfDay && (
                    <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded mt-2">
                      Half-day requests count as 0.5 days per calendar day selected.
                    </div>
                  )}
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
                
                {selectedLeaveType.value === 'sick' && calculateDays() > 3 && (
                  <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    <strong>Note:</strong> Medical certificate required for sick leave exceeding 3 consecutive days.
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
