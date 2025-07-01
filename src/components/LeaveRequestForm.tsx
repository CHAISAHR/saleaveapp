import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/useUser";
import { balanceService } from "@/services/balanceService";
import { calculateWorkingDays } from "@/lib/utils";

const FormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  detail: z.string().min(10, {
    message: "Detail must be at least 10 characters.",
  }),
  date: z.object({
    from: z.date({
      required_error: "A start date is required.",
    }),
    to: z.date({
      required_error: "A end date is required.",
    }),
  }).refine(data => data.to >= data.from, {
    message: "End date must be after start date",
    path: ["to"],
  }),
  leaveType: z.string({
    required_error: "Please select a leave type.",
  }),
  attachments: z.array(z.instanceof(File)).optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
})

interface LeaveType {
  value: string;
  label: string;
  description: string;
  balance: number;
  total: number;
}

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export const LeaveRequestForm = ({ isOpen, onClose, currentUser }: LeaveRequestFormProps) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [balances, setBalances] = useState<{ [key: string]: number } | null>(null);
  const [workingDays, setWorkingDays] = useState<number>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (user?.email) {
        try {
          const balance = await balanceService.getEmployeeBalance(user.email);
          if (balance) {
            const leaveBalances = balanceService.getAllLeaveBalances(balance);
            setBalances(leaveBalances);
          }
        } catch (error) {
          console.error("Failed to fetch leave balances:", error);
          toast({
            variant: "destructive",
            title: "Failed to fetch leave balances.",
            description: "Please try again later.",
          });
        }
      }
    };

    fetchBalances();
  }, [user?.email, toast]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      detail: "",
      date: undefined,
      leaveType: "",
      attachments: [],
      terms: false,
    },
  })

  function onSubmit(values: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    setUploadProgress(0);

    const startDate = values.date?.from.toISOString().split('T')[0];
    const endDate = values.date?.to.toISOString().split('T')[0];
    const leaveType = values.leaveType;

    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a valid date range.",
      });
      setIsSubmitting(false);
      return;
    }

    if (!leaveType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a leave type.",
      });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("detail", values.detail);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("leaveType", leaveType);
    formData.append("workingDays", workingDays.toString());

    files.forEach((file) => {
      formData.append("attachments", file);
    });

    fetch("/api/leave/request", {
      method: "POST",
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to submit leave request');
        }
        return response.json();
      })
      .then((data) => {
        toast({
          title: "Success",
          description: data.message,
        });
        form.reset();
        setFiles([]);
        setWorkingDays(0);
        onClose();
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
        setUploadProgress(0);
      });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const leaveTypes = [
    { 
      value: "annual", 
      label: "Annual Leave", 
      description: "Regular vacation days",
      balance: balances?.annual || 0,
      total: 20
    },
    { 
      value: "sick", 
      label: "Sick Leave", 
      description: "Medical leave for illness",
      balance: balances?.sick || 0,
      total: 36
    },
    { 
      value: "family", 
      label: "Family Leave", 
      description: "Family responsibility leave",
      balance: balances?.family || 0,
      total: 3
    },
    { 
      value: "study", 
      label: "Study Leave", 
      description: "Educational purposes",
      balance: balances?.study || 0,
      total: 6
    },
    { 
      value: "wellness", 
      label: "Wellness Leave", 
      description: "Mental health and wellness",
      balance: balances?.wellness || 0,
      total: 2
    },
    { 
      value: "parental", 
      label: "Parental Leave", 
      description: "Parental responsibilities",
      balance: balances?.parental || 0,
      total: 20
    },
    { 
      value: "adoption", 
      label: "Adoption Leave", 
      description: "Adoption related leave",
      balance: balances?.adoption || 0,
      total: 20
    }
  ];

  useEffect(() => {
    if (form.watch("date")?.from && form.watch("date")?.to) {
      const start = form.watch("date")?.from.toISOString().split('T')[0];
      const end = form.watch("date")?.to.toISOString().split('T')[0];

      if (start && end) {
        calculateWorkingDays(start, end)
          .then(days => setWorkingDays(days))
          .catch(error => {
            console.error("Error calculating working days:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to calculate working days. Please try again.",
            });
            setWorkingDays(0);
          });
      }
    }
  }, [form.watch("date")?.from, form.watch("date")?.to, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-[750px] max-h-[90vh] overflow-y-auto">
        <CardContent className="p-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Leave Request Form</h2>
                <p className="text-muted-foreground">
                  Submit your leave request with all necessary details.
                </p>
              </div>
              <Separator />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Vacation in Bali" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your leave request a relevant title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="detail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detail</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Going on a family vacation to Bali. Will be back refreshed!"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Explain the reason for your leave request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value?.from ? (
                              field.value.to ? (
                                `${field.value.from?.toLocaleDateString()} - ${field.value.to?.toLocaleDateString()}`
                              ) : (
                                field.value.from?.toLocaleDateString()
                              )
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="border rounded-md overflow-hidden">
                          <div className="p-3">
                            <Calendar
                              mode="range"
                              defaultMonth={field.value?.from}
                              selected={field.value as DateRange | undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              numberOfMonths={2}
                              className="pointer-events-auto"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the start and end dates for your leave.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the appropriate type of leave.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("leaveType") && (
                <div className="rounded-md border p-4">
                  <div className="flex items-center space-x-4">
                    <CalendarIcon className="h-8 w-8 text-gray-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {leaveTypes.find(type => type.value === form.watch("leaveType"))?.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {leaveTypes.find(type => type.value === form.watch("leaveType"))?.description}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Available Balance</Label>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">
                          {leaveTypes.find(type => type.value === form.watch("leaveType"))?.balance} days
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Out of {leaveTypes.find(type => type.value === form.watch("leaveType"))?.total} days
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label>Days Requested</Label>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">
                          {workingDays} days
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Based on selected date range
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <Input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={handleFileChange}
                  className="mt-2"
                />
                <FormDescription>
                  Attach any relevant documents (max 5MB per file, 10 files max).
                </FormDescription>
                {files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Selected Files:</p>
                    <ul>
                      {files.map((file, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {file.name} ({Math.ceil(file.size / 1024)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 rounded-md border p-4">
                    <FormControl>
                      <Input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold">
                        Accept Terms and Conditions
                      </FormLabel>
                      <FormDescription>
                        I agree to the leave policy and understand the implications of
                        submitting this request.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Leave Request"}
                </Button>
              </div>
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Upload Progress:</p>
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
