import { useState } from "react";
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
import { Users, Calendar as CalendarIcon, Database, Settings, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AdminBalanceManager } from "./AdminBalanceManager";

interface AdminDashboardProps {
  currentUser: any;
  activeView?: 'dashboard' | 'system' | 'admin' | 'balances';
}

export const AdminDashboard = ({ currentUser, activeView = 'dashboard' }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidays, setHolidays] = useState([
    {
      id: 1,
      name: "New Year's Day",
      date: "2024-01-01",
      type: "public",
      description: "National public holiday",
      officeStatus: "closed"
    },
    {
      id: 2,
      name: "Company Summer Picnic",
      date: "2024-08-15",
      type: "company",
      description: "Annual company event",
      officeStatus: "optional"
    }
  ]);

  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: undefined as Date | undefined,
    type: "public",
    description: "",
    officeStatus: "closed"
  });

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const holiday = {
      id: holidays.length + 1,
      name: newHoliday.name,
      date: format(newHoliday.date, 'yyyy-MM-dd'),
      type: newHoliday.type,
      description: newHoliday.description,
      officeStatus: newHoliday.officeStatus
    };

    setHolidays(prev => [...prev, holiday]);
    setNewHoliday({
      name: "",
      date: undefined,
      type: "public",
      description: "",
      officeStatus: "closed"
    });
    setShowHolidayForm(false);

    toast({
      title: "Holiday Added",
      description: `${holiday.name} has been added to the holiday calendar.`,
    });
  };

  const handleDeleteHoliday = (holidayId: number, holidayName: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
    toast({
      title: "Holiday Removed",
      description: `${holidayName} has been removed from the calendar.`,
    });
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
              <Button className="bg-blue-600 hover:bg-blue-700">
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
                    <Select value={newHoliday.officeStatus} onValueChange={(value) => setNewHoliday(prev => ({ ...prev, officeStatus: value }))}>
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
                  <Button onClick={handleAddHoliday}>
                    Add Holiday
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
                      <span className={holiday.officeStatus === 'closed' ? 'text-red-600' : 'text-blue-600'}>
                        {holiday.officeStatus === 'closed' ? 'Office Closed' : 'Optional'}
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">System administration and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
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
                <p className="text-sm text-gray-600">Holidays Managed</p>
                <p className="text-2xl font-bold text-gray-900">{holidays.length}</p>
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
                <p className="text-sm text-gray-600">Database Health</p>
                <p className="text-2xl font-bold text-gray-900">98%</p>
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
                <p className="text-sm text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-gray-900">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <CalendarIcon className="h-6 w-6" />
              <span>Manage Holidays</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span>User Management</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Database className="h-6 w-6" />
              <span>Database Tools</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
