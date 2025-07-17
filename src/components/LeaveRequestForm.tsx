import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Send } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiConfig } from '@/config/apiConfig';

interface LeaveRequestFormProps {
  currentUser: {
    name: string;
    email: string;
    department: string;
    role: string;
  };
  onRequestSubmitted?: () => void;
}

interface UserBalance {
  EmployeeName: string;
  EmployeeEmail: string;
  Department: string;
  Manager?: string;
  AnnualLeave: number;
  SickLeave: number;
  StudyLeave: number;
  Maternity: number;
  AccumulatedLeave: number;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ 
  currentUser, 
  onRequestSubmitted 
}) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerInfo, setManagerInfo] = useState<{ name: string; email: string } | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Fetch user's balance and manager info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return;

        // Fetch user's balance which should include manager info
        const balanceResponse = await fetch(`${apiConfig.endpoints.balance}/user`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserBalance(balanceData.balance);
          
          // Set manager info if available
          if (balanceData.balance?.Manager) {
            setManagerInfo({ 
              name: balanceData.balance.Manager, 
              email: balanceData.balance.Manager 
            });
          } else {
            // Fallback: use a default manager email pattern
            const managerEmail = `manager@${currentUser.department.toLowerCase().replace(/\s+/g, '')}.com`;
            setManagerInfo({ 
              name: `${currentUser.department} Manager`, 
              email: managerEmail 
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Set a fallback manager
        setManagerInfo({ 
          name: `${currentUser.department} Manager`, 
          email: `manager@${currentUser.department.toLowerCase().replace(/\s+/g, '')}.com`
        });
      }
    };

    fetchUserData();
  }, [currentUser.email, currentUser.department]);

  // Fetch company holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return;

        const response = await fetch(`${apiConfig.endpoints.holiday}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setHolidays(data.holidays || []);
        }
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };

    fetchHolidays();
  }, []);

  const calculateWorkingDays = (start: Date, end: Date): number => {
    if (!start || !end) return 0;
    
    let workingDays = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
      
      // Check if current date is a company holiday
      const isHoliday = holidays.some(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate.toDateString() === currentDate.toDateString();
      });
      
      if (!isWeekend && !isHoliday) {
        workingDays++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  const getAvailableBalance = (type: string): number => {
    if (!userBalance) return 0;
    
    switch (type) {
      case 'annual':
        return userBalance.AnnualLeave || 0;
      case 'sick':
        return userBalance.SickLeave || 0;
      case 'study':
        return userBalance.StudyLeave || 0;
      case 'maternity':
        return userBalance.Maternity || 0;
      case 'accumulated':
        return userBalance.AccumulatedLeave || 0;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !leaveType || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    const workingDays = calculateWorkingDays(startDate, endDate);
    const availableBalance = getAvailableBalance(leaveType);

    if (workingDays > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You have ${availableBalance} days available for ${leaveType} leave, but requested ${workingDays} working days.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const authToken = localStorage.getItem('auth_token');
      
      const requestData = {
        employee_name: currentUser.name,
        employee_email: currentUser.email,
        department: currentUser.department,
        leave_type: leaveType,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        working_days: workingDays,
        reason: reason,
        manager_email: managerInfo?.email || '',
        status: 'pending'
      };

      const response = await fetch(`${apiConfig.endpoints.leave}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast({
          title: "Leave Request Submitted",
          description: `Your ${leaveType} leave request for ${workingDays} working days has been submitted for approval.`,
        });

        // Reset form
        setStartDate(undefined);
        setEndDate(undefined);
        setLeaveType('');
        setReason('');

        // Notify parent component
        onRequestSubmitted?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission Failed", 
        description: error instanceof Error ? error.message : "Failed to submit leave request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const workingDays = startDate && endDate ? calculateWorkingDays(startDate, endDate) : 0;
  const availableBalance = getAvailableBalance(leaveType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Submit Leave Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Manager Info Display */}
          {managerInfo && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-blue-900">
                Request will be sent to: {managerInfo.name} ({managerInfo.email})
              </Label>
            </div>
          )}

          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type *</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Leave ({getAvailableBalance('annual')} days available)</SelectItem>
                <SelectItem value="sick">Sick Leave ({getAvailableBalance('sick')} days available)</SelectItem>
                <SelectItem value="study">Study Leave ({getAvailableBalance('study')} days available)</SelectItem>
                <SelectItem value="maternity">Maternity Leave ({getAvailableBalance('maternity')} days available)</SelectItem>
                <SelectItem value="accumulated">Accumulated Leave ({getAvailableBalance('accumulated')} days available)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
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
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < (startDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Working Days Calculation */}
          {startDate && endDate && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Working Days:</span>
                <span className="text-lg font-bold text-blue-600">{workingDays}</span>
              </div>
              {leaveType && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Available Balance:</span>
                  <span className={cn(
                    "text-sm font-medium",
                    availableBalance >= workingDays ? "text-green-600" : "text-red-600"
                  )}>
                    {availableBalance} days
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !startDate || !endDate || !leaveType || !reason.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
