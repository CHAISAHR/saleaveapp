
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Edit, Trash2, AlertCircle, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DepartmentManager } from "@/components/DepartmentManager";
import { apiConfig } from "@/config/apiConfig";

interface AdminPanelProps {
  currentUser: any;
}

interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  role: 'employee' | 'manager' | 'admin';
  hire_date: string;
  is_active: boolean;
  manager_email?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export const AdminPanel = ({ currentUser }: AdminPanelProps) => {
  console.log('AdminPanel rendering started', { currentUser });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUserForm, setShowUserForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);

  console.log('AdminPanel state:', { 
    showUserForm, 
    usersCount: users.length, 
    departmentsCount: departments.length, 
    loading, 
    backendError 
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    department: "",
    role: "employee",
    password: "",
    manager_email: ""
  });

  // Check if we have a valid token
  const hasValidToken = () => {
    const authToken = localStorage.getItem('auth_token');
    const isValid = authToken && authToken !== 'null' && authToken !== '';
    console.log('Token validation:', { authToken: authToken ? 'exists' : 'missing', isValid });
    return isValid;
  };

  // Get authorization headers
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    console.log('Getting auth headers:', { hasToken: !!authToken });
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch departments from backend
  const fetchDepartments = async () => {
    console.log('Fetching departments...');
    try {
      const response = await fetch(apiConfig.endpoints.departments, {
        headers: getAuthHeaders()
      });

      console.log('Departments fetch response:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const data = await response.json();
        console.log('Departments data received:', data);
        setDepartments(data.departments || []);
      } else {
        console.log('Using default departments due to fetch failure');
        // Set default departments if backend is not available
        setDepartments([
        { id: 1, name: 'HR & Ops', description: 'HR department managing personnel and policies', is_active: true},
        { id: 2, name: 'Access to Medicines', description: 'IT department managing technology and systems', is_active: true},
        { id: 3, name: 'Finance', description: 'Finance department managing company finances', is_active: true},
        { id: 4, name: 'Assistive Technologies', description: 'AT department', is_active: true},
        { id: 5, name: 'SHF', description: 'Sales department managing customer relationships', is_active: true},
        { id: 6, name: 'TB', description: 'Operations department managing daily activities', is_active: true},
        { id: 7, name: 'HIV SS, Prep,& SRMNH', description: 'HIV team', is_active: true},
        { id: 8, name: 'Cancer', description: 'Cervical Cancer', is_active: true},
        { id: 9, name: 'Global', description: 'Global Team', is_active: true},
        { id: 10, name: 'FCDO', description: 'FCDO', is_active: true},
        { id: 11, name: 'Malaria', description: 'Malaria team', is_active: true},
        { id: 12, name: 'Other', description: 'Any other team', is_active: true}
        ]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Set default departments
      setDepartments([
        { id: 1, name: 'HR & Ops', description: 'HR department managing personnel and policies', is_active: true},
        { id: 2, name: 'Access to Medicines', description: 'IT department managing technology and systems', is_active: true},
        { id: 3, name: 'Finance', description: 'Finance department managing company finances', is_active: true},
        { id: 4, name: 'Assistive Technologies', description: 'AT department', is_active: true},
        { id: 5, name: 'SHF', description: 'Sales department managing customer relationships', is_active: true},
        { id: 6, name: 'TB', description: 'Operations department managing daily activities', is_active: true},
        { id: 7, name: 'HIV SS, Prep,& SRMNH', description: 'HIV team', is_active: true},
        { id: 8, name: 'Cancer', description: 'Cervical Cancer', is_active: true},
        { id: 9, name: 'Global', description: 'Global Team', is_active: true},
        { id: 10, name: 'FCDO', description: 'FCDO', is_active: true},
        { id: 11, name: 'Malaria', description: 'Malaria team', is_active: true},
        { id: 12, name: 'Other', description: 'Any other team', is_active: true}
      ]);
    }
  };

  // Fetch users from backend
  const fetchUsers = async () => {
    console.log('fetchUsers called');
    
    if (!hasValidToken()) {
      console.log('No valid token, showing auth toast');
      toast({
        title: "Authentication Required",
        description: "Please log in to access user management.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting user fetch...');
      setLoading(true);
      setBackendError(false);
      
      const endpoint = apiConfig.endpoints.users;
      console.log('Fetching from endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      });

      console.log('Users fetch response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', { 
          success: data.success, 
          usersCount: data.users?.length || 0,
          users: data.users 
        });
        setUsers(data.users || []);
      } else if (response.status === 401) {
        console.log('401 error - session expired');
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
      } else {
        console.log('Non-401 error response:', await response.text());
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setBackendError(true);
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        console.log('Network error detected');
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please ensure the server is running.",
          variant: "destructive",
        });
      } else {
        console.log('Other error:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  // Load users and departments on component mount
  useEffect(() => {
    console.log('AdminPanel useEffect triggered');
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.department || !newUser.password) {
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
        description: "Please log in to add users.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${apiConfig.endpoints.auth}/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          department: newUser.department,
          password: newUser.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // If user role is not employee, update it
        if (newUser.role !== 'employee') {
          await handleUpdateUserRole(data.userId, newUser.role);
        }

        // If manager is specified, update it
        if (newUser.manager_email) {
          await handleUpdateUserManager(data.userId, newUser.manager_email);
        }

        // Refresh users list
        await fetchUsers();

        // Reset form
        setNewUser({
          name: "",
          email: "",
          department: "",
          role: "employee",
          password: "",
          manager_email: ""
        });
        setShowUserForm(false);

        toast({
          title: "User Added",
          description: `${newUser.name} has been added to the system.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please ensure the server is running.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add user",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`${apiConfig.endpoints.users}/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole as 'employee' | 'manager' | 'admin' } : user
        ));

        const user = users.find(u => u.id === userId);
        toast({
          title: "Role Updated",
          description: `${user?.name}'s role has been updated to ${newRole}.`,
        });
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserManager = async (userId: number, managerEmail: string) => {
    try {
      const response = await fetch(`${apiConfig.endpoints.users}/${userId}/manager`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ manager_email: managerEmail })
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, manager_email: managerEmail } : user
        ));

        const user = users.find(u => u.id === userId);
        const manager = users.find(u => u.email === managerEmail);
        toast({
          title: "Manager Updated",
          description: `${user?.name}'s manager has been updated to ${manager?.name}.`,
        });
      } else {
        throw new Error('Failed to update user manager');
      }
    } catch (error) {
      console.error('Error updating user manager:', error);
      toast({
        title: "Error",
        description: "Failed to update user manager",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    // For now, just show a message that this feature is not implemented
    toast({
      title: "Feature Not Available",
      description: "User deletion will be implemented in a future update.",
      variant: "destructive",
    });
  };

  console.log('AdminPanel about to render, backendError:', backendError);

  // Show backend connection error if applicable
  if (backendError) {
    console.log('Rendering backend error screen');
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage users, roles, and reporting relationships</p>
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
                  <li>The backend server is running</li>
                  <li>You have a valid authentication token</li>
                  <li>The database is properly configured</li>
                </ul>
                <Button 
                  onClick={fetchUsers} 
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

  const managers = users.filter(user => user.role === 'manager' || user.role === 'admin');
  const activeDepartments = departments.filter(dept => dept.is_active);

  console.log('Rendering main AdminPanel content');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Administration Panel</h2>
          <p className="text-gray-600">Manage users, departments, and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
              <p className="text-gray-600">Manage users, roles, and reporting relationships</p>
            </div>
            <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={loading || !hasValidToken()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account and assign their role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., John Smith"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.smith@company.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={newUser.department} onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager (Optional)</Label>
                    <Select value={newUser.manager_email || "none"} onValueChange={(value) => setNewUser(prev => ({ ...prev, manager_email: value === "none" ? "" : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.email}>
                            {manager.name} ({manager.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowUserForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser} disabled={loading}>
                      {loading ? "Adding..." : "Add User"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Managers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'manager').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'employee').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.manager_email || "none"}
                            onValueChange={(value) => handleUpdateUserManager(user.id, value === "none" ? "" : value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="No Manager" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Manager</SelectItem>
                              {managers.filter(m => m.email !== user.email).map((manager) => (
                                <SelectItem key={manager.id} value={manager.email}>
                                  {manager.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.hire_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={user.email === currentUser.email}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
