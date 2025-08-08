import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Settings, Clock, Calendar as CalendarIcon, MapPin, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from '@/config/apiConfig';

interface HolidayCalendarProps {
  userRole?: 'employee' | 'manager' | 'admin' | 'country_director';
}

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  description: string;
  office_status: string;
}

export const HolidayCalendar = ({
  userRole = 'employee'
}: HolidayCalendarProps) => {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: undefined as Date | undefined,
    type: "public",
    description: "",
    office_status: "closed"
  });

  // Get authorization headers
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch holidays from backend
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(apiConfig.endpoints.holiday, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      } else {
        console.error('Failed to fetch holidays');
        // Fallback to default South African holidays
        setHolidays(getDefaultHolidays());
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      // Fallback to default South African holidays
      setHolidays(getDefaultHolidays());
    } finally {
      setLoading(false);
    }
  };

  // Default South African holidays as fallback
  const getDefaultHolidays = () => [
    {
      id: 1,
      name: "New Year's Day",
      date: "2025-01-01",
      type: "public",
      description: "New Year's Day",
      office_status: "closed"
    },
    {
      id: 2,
      name: "Human Rights Day",
      date: "2025-03-21",
      type: "public",
      description: "Human Rights Day",
      office_status: "closed"
    },
    {
      id: 3,
      name: "Good Friday",
      date: "2025-04-18",
      type: "public",
      description: "Good Friday",
      office_status: "closed"
    },
    {
      id: 4,
      name: "Family Day",
      date: "2025-04-21",
      type: "public",
      description: "Family Day",
      office_status: "closed"
    },
    {
      id: 5,
      name: "Freedom Day",
      date: "2025-04-27",
      type: "public",
      description: "Freedom Day",
      office_status: "closed"
    },
    {
      id: 6,
      name: "Workers' Day",
      date: "2025-05-01",
      type: "public",
      description: "Workers' Day",
      office_status: "closed"
    },
    {
      id: 7,
      name: "Youth Day",
      date: "2025-06-16",
      type: "public",
      description: "Youth Day",
      office_status: "closed"
    },
    {
      id: 8,
      name: "National Women's Day",
      date: "2025-08-09",
      type: "public",
      description: "National Women's Day",
      office_status: "closed"
    },
    {
      id: 9,
      name: "Heritage Day",
      date: "2025-09-24",
      type: "public",
      description: "Heritage Day",
      office_status: "closed"
    },
    {
      id: 10,
      name: "Day of Reconciliation",
      date: "2025-12-16",
      type: "public",
      description: "Day of Reconciliation",
      office_status: "closed"
    },
    {
      id: 11,
      name: "Christmas Day",
      date: "2025-12-25",
      type: "public",
      description: "Christmas Day",
      office_status: "closed"
    },
    {
      id: 12,
      name: "Day of Goodwill",
      date: "2025-12-26",
      type: "public",
      description: "Day of Goodwill",
      office_status: "closed"
    }
  ];

  // Load holidays on component mount
  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(apiConfig.endpoints.holiday, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newHoliday.name,
          date: format(newHoliday.date, 'yyyy-MM-dd'),
          type: newHoliday.type,
          description: newHoliday.description,
          office_status: newHoliday.office_status,
          is_recurring: false
        })
      });

      if (response.ok) {
        await fetchHolidays();
        resetForm();
        toast({
          title: "Holiday Added",
          description: `${newHoliday.name} has been added to the holiday calendar.`,
        });
      } else {
        throw new Error('Failed to add holiday');
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: "Error",
        description: "Failed to add holiday",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditHoliday = async () => {
    if (!editingHoliday || !newHoliday.name || !newHoliday.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${apiConfig.endpoints.holiday}/${editingHoliday.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newHoliday.name,
          date: format(newHoliday.date, 'yyyy-MM-dd'),
          type: newHoliday.type,
          description: newHoliday.description,
          office_status: newHoliday.office_status,
          is_recurring: false
        })
      });

      if (response.ok) {
        await fetchHolidays();
        resetForm();
        toast({
          title: "Holiday Updated",
          description: "Holiday has been updated successfully.",
        });
      } else {
        throw new Error('Failed to update holiday');
      }
    } catch (error) {
      console.error('Error updating holiday:', error);
      toast({
        title: "Error",
        description: "Failed to update holiday",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId: number, holidayName: string) => {
    if (!confirm(`Are you sure you want to delete "${holidayName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${apiConfig.endpoints.holiday}/${holidayId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await fetchHolidays();
        toast({
          title: "Holiday Deleted",
          description: `${holidayName} has been deleted successfully.`,
        });
      } else {
        throw new Error('Failed to delete holiday');
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setNewHoliday({
      name: holiday.name,
      date: new Date(holiday.date),
      type: holiday.type,
      description: holiday.description,
      office_status: holiday.office_status
    });
    setShowHolidayForm(true);
  };

  const resetForm = () => {
    setNewHoliday({
      name: "",
      date: undefined,
      type: "public",
      description: "",
      office_status: "closed"
    });
    setEditingHoliday(null);
    setShowHolidayForm(false);
  };

  const publicHolidays = holidays.filter(holiday => holiday.type === 'public');
  const upcomingHolidays = holidays.filter(holiday => new Date(holiday.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  const getHolidayType = (type: string) => {
    switch (type) {
      case 'public':
        return {
          variant: 'default' as const,
          label: 'Public Holiday'
        };
      case 'company':
        return {
          variant: 'secondary' as const,
          label: 'Company Holiday'
        };
      default:
        return {
          variant: 'outline' as const,
          label: 'Other'
        };
    }
  };

  const getOfficeStatus = (status: string) => {
    switch (status) {
      case 'closed':
        return {
          color: 'text-red-600',
          label: 'Office Closed'
        };
      case 'optional':
        return {
          color: 'text-blue-600',
          label: 'Optional Attendance'
        };
      default:
        return {
          color: 'text-green-600',
          label: 'Office Open'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Holiday Calendar</h2>
          <p className="text-gray-600">Public holidays and office closure dates</p>
        </div>
        <div className="flex space-x-2">
          {userRole === 'admin' && (
            <Dialog open={showHolidayForm} onOpenChange={(open) => {
              if (!open) resetForm();
              setShowHolidayForm(open);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</DialogTitle>
                  <DialogDescription>
                    {editingHoliday ? 'Update the holiday information.' : 'Create a new company holiday or public holiday entry.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Holiday Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., New Year's Day"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newHoliday.date ? format(newHoliday.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newHoliday.date}
                          onSelect={(date) => setNewHoliday(prev => ({ ...prev, date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Holiday Type</Label>
                      <Select value={newHoliday.type} onValueChange={(value) => setNewHoliday(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public Holiday</SelectItem>
                          <SelectItem value="company">Company Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Office Status</Label>
                      <Select value={newHoliday.office_status} onValueChange={(value) => setNewHoliday(prev => ({ ...prev, office_status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="closed">Office Closed</SelectItem>
                          <SelectItem value="optional">Optional Attendance</SelectItem>
                          <SelectItem value="open">Office Open</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the holiday"
                      value={newHoliday.description}
                      onChange={(e) => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={editingHoliday ? handleEditHoliday : handleAddHoliday} disabled={loading}>
                      {loading ? (editingHoliday ? "Updating..." : "Adding...") : (editingHoliday ? "Update Holiday" : "Add Holiday")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" className="flex items-center space-x-2" onClick={fetchHolidays}>
            <Settings className="h-4 w-4" />
            <span>Refresh Holidays</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Public Holidays Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5" />
                    <span>Public Holidays and Office Closures</span>
                  </CardTitle>
                  <CardDescription>Public holidays that exclude leave calculations</CardDescription>
                </div>
                {userRole === 'admin' && (
                  <Badge variant="outline" className="text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    Admin View
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading holidays...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Status</TableHead>
                      {userRole === 'admin' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map(holiday => {
                      const holidayDate = new Date(holiday.date);
                      const statusInfo = getOfficeStatus(holiday.office_status);
                      return (
                        <TableRow key={holiday.id}>
                          <TableCell className="font-medium">{holiday.name}</TableCell>
                          <TableCell>
                            {holidayDate.toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            {holidayDate.toLocaleDateString('en-ZA', {
                              weekday: 'long'
                            })}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </TableCell>
                          {userRole === 'admin' && (
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(holiday)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Holidays */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Upcoming Holidays</span>
              </CardTitle>
              <CardDescription>Next {upcomingHolidays.length} holidays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingHolidays.map(holiday => {
                const typeInfo = getHolidayType(holiday.type);
                const statusInfo = getOfficeStatus(holiday.office_status);
                return <div key={holiday.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                          <p className="text-sm text-gray-600">{holiday.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <CalendarIcon className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className={`text-xs ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                        <Badge variant={typeInfo.variant} className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </div>
                    </div>;
              })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holiday Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Holiday Policy</CardTitle>
          <CardDescription>Important information about company holidays</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Public Holidays</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Office is closed on these days</li>
                <li>• No leave deduction required</li>
                <li>• Excluded from leave calculations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company Holidays</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Additional days designated by company</li>
                <li>• May include office closure days</li>
                <li>• Advance notice provided</li>
                <li>• Optional attendance events specified</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Leave Calculation</h4>
            <p className="text-sm text-blue-700">
              When calculating leave days, weekends and public holidays are automatically excluded. 
              Only working days are counted towards your leave balance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
