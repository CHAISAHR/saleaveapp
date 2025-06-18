import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calendar as CalendarIcon, Database, Settings, Plus, Edit, Trash2, AlertCircle, TrendingUp, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AdminBalanceManager } from "./AdminBalanceManager";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminDashboardProps {
  currentUser: any;
  activeView?: 'dashboard' | 'system' | 'admin' | 'balances';
  onViewChange?: (view: 'dashboard' | 'system' | 'admin' | 'balances') => void;
}

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  description: string;
  office_status: string;
}

export const AdminDashboard = ({ currentUser, activeView = 'dashboard', onViewChange }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);

  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: undefined as Date | undefined,
    type: "public",
    description: "",
    office_status: "closed"
  });

  // Updated sample data for visualizations
  const pendingLeavesByDepartment = [
    { name: 'Ops', value: 5, color: '#8884d8' },
    { name: 'Global', value: 8, color: '#82ca9d' },
    { name: 'Finance', value: 3, color: '#ffc658' },
    { name: 'Access', value: 6, color: '#ff7300' },
    { name: 'SHF', value: 4, color: '#8dd1e1' },
  ];

  const departmentData = [
    { department: 'Ops', pending: 5, approved: 15, rejected: 2 },
    { department: 'Global', pending: 8, approved: 22, rejected: 3 },
    { department: 'Finance', pending: 3, approved: 12, rejected: 1 },
    { department: 'Access', pending: 6, approved: 18, rejected: 2 },
    { department: 'SHF', pending: 4, approved: 10, rejected: 1 },
  ];

  const currentlyOnLeaveData = [
    { id: 1, employee: 'John Smith', department: 'Ops', type: 'Annual', startDate: '2024-06-10', endDate: '2024-06-20', daysRemaining: 3 },
    { id: 2, employee: 'Sarah Wilson', department: 'Ops', type: 'Sick', startDate: '2024-06-15', endDate: '2024-06-17', daysRemaining: 1 },
    { id: 3, employee: 'Mike Johnson', department: 'Finance', type: 'Study', startDate: '2024-06-12', endDate: '2024-06-19', daysRemaining: 2 },
    { id: 4, employee: 'Lisa Chen', department: 'AT', type: 'Family', startDate: '2024-06-16', endDate: '2024-06-16', daysRemaining: 0 },
    { id: 5, employee: 'David Brown', department: 'TB', type: 'Annual', startDate: '2024-06-14', endDate: '2024-06-21', daysRemaining: 4 },
  ];

  // Check if we have a valid token
  const hasValidToken = () => {
    const authToken = localStorage.getItem('auth_token');
    return authToken && authToken !== 'null' && authToken !== '';
  };

  // Get authorization headers
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken || authToken === 'null' || authToken === '') {
      throw new Error('No valid authentication token');
    }
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch holidays from backend
  const fetchHolidays = async () => {
    if (!hasValidToken()) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access holiday management.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setBackendError(false);
      
      const response = await fetch('http://localhost:3001/api/holiday', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      } else if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
      } else {
        throw new Error('Failed to fetch holidays');
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      setBackendError(true);
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please ensure the server is running on localhost:3001.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message === 'No valid authentication token') {
        toast({
          title: "Authentication Required",
          description: "Please log in to access holiday management.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load holidays",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load holidays on component mount
  useEffect(() => {
    if (activeView === 'admin') {
      fetchHolidays();
    }
  }, [activeView]);

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!hasValidToken()) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add holidays.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/holiday', {
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
        // Refresh holidays list
        await fetchHolidays();
        
        // Reset form
        setNewHoliday({
          name: "",
          date: undefined,
          type: "public",
          description: "",
          office_status: "closed"
        });
        setShowHolidayForm(false);

        toast({
          title: "Holiday Added",
          description: `${newHoliday.name} has been added to the holiday calendar.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add holiday');
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please ensure the server is running on localhost:3001.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message === 'No valid authentication token') {
        toast({
          title: "Authentication Required",
          description: "Please log in to add holidays.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add holiday",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = (holidayId: number, holidayName: string) => {
    // For now, just show a message that this feature is not implemented
    toast({
      title: "Feature Not Available",
      description: "Holiday deletion will be implemented in a future update.",
      variant: "destructive",
    });
  };

  const handleQuickAction = (action: string) => {
    if (onViewChange) {
      switch (action) {
        case 'holidays':
          onViewChange('admin');
          break;
        case 'users':
          // Navigate to user management - placeholder for now
          toast({
            title: "User Management",
            description: "User management feature coming soon.",
          });
          break;
        case 'database':
          onViewChange('system');
          break;
        default:
          break;
      }
    }
  };

  if (activeView === 'balances') {
    return <AdminBalanceManager />;
  }

  if (activeView === 'system') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
          <p className="text-gray-600">Monitor system-wide leave statistics and trends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">248</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Requests</p>
                  <p className="text-2xl font-bold text-gray-900">42</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Database className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departments</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Information</CardTitle>
            <CardDescription>Current database statistics and health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">2,847</div>
                <div className="text-sm text-blue-700">Total Leave Records</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">98.7%</div>
                <div className="text-sm text-green-700">System Uptime</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">15.2GB</div>
                <div className="text-sm text-yellow-700">Database Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeView === 'admin') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Holiday Management</h2>
            <p className="text-gray-600">Manage company holidays and office closure dates</p>
          </div>
          <Dialog open={showHolidayForm} onOpenChange={setShowHolidayForm}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                disabled={loading || !hasValidToken()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Holiday</DialogTitle>
                <DialogDescription>
                  Create a new company holiday or public holiday entry.
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
                  <Button variant="outline" onClick={() => setShowHolidayForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddHoliday} disabled={loading}>
                    {loading ? "Adding..." : "Add Holiday"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Existing Holidays</CardTitle>
            <CardDescription>Manage current holiday entries</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading holidays...</div>
            ) : (
              <div className="space-y-4">
                {holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                      <p className="text-sm text-gray-600">{holiday.description}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{new Date(holiday.date).toLocaleDateString()}</span>
                        <Badge variant={holiday.type === 'public' ? 'default' : 'secondary'}>
                          {holiday.type === 'public' ? 'Public' : 'Company'}
                        </Badge>
                        <span className={holiday.office_status === 'closed' ? 'text-red-600' : 'text-blue-600'}>
                          {holiday.office_status === 'closed' ? 'Office Closed' : 'Optional'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show backend connection error if there's an error
  if (backendError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Holiday Management</h2>
            <p className="text-gray-600">Manage company holidays and office closure dates</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Backend Connection Error</h3>
                <p className="text-sm text-gray-600">
                  Cannot connect to the backend server. Please ensure:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                  <li>The backend server is running on localhost:3001</li>
                  <li>You have a valid authentication token</li>
                  <li>The database is properly configured</li>
                </ul>
                <Button 
                  onClick={fetchHolidays} 
                  className="mt-4"
                  disabled={loading}
                >
                  {loading ? "Retrying..." : "Retry Connection"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">System administration and analytics</p>
      </div>

      {/* 2x2 Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leaves by Department - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Pending Leaves by Department</span>
            </CardTitle>
            <CardDescription>Current pending leave requests breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pendingLeavesByDepartment}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pendingLeavesByDepartment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Status - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Department Status</span>
            </CardTitle>
            <CardDescription>Leave requests status by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pending" fill="#ffc658" />
                  <Bar dataKey="approved" fill="#82ca9d" />
                  <Bar dataKey="rejected" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Staff Currently on Leave - Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Staff Currently on Leave</span>
            </CardTitle>
            <CardDescription>Employees currently on approved leave today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentlyOnLeaveData.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.employee}</TableCell>
                      <TableCell>{staff.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {staff.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(staff.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(staff.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={staff.daysRemaining === 0 ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {staff.daysRemaining} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
