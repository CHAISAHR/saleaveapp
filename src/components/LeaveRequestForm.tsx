
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Send, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";

export const LeaveRequestForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    detail: "",
    startDate: "",
    endDate: "",
    leaveType: "annual"
  });

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
          description: `Your ${formData.leaveType} leave request has been submitted successfully. Working days: ${result.workingDays}`,
        });

        // Reset form
        setFormData({
          title: "",
          detail: "",
          startDate: "",
          endDate: "",
          leaveType: "annual"
        });
        setAttachments(null);
        
        // Reset file input
        const fileInput = document.getElementById('attachments') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get today's date in YYYY-MM-DD format for minimum date (allowing past dates now)
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Submit Leave Request
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
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="paternity">Paternity Leave</SelectItem>
                  <SelectItem value="study">Study Leave</SelectItem>
                  <SelectItem value="compassionate">Compassionate Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
};
