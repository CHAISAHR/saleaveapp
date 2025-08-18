import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: () => void;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface NewEmployeeData {
  name: string;
  surname: string;
  email: string;
  department: string;
  role: string;
  manager_email: string;
  start_date: string;
  gender: string;
}

export const AddEmployeeDialog = ({ open, onOpenChange, onEmployeeAdded }: AddEmployeeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<NewEmployeeData>({
    name: '',
    surname: '',
    email: '',
    department: '',
    role: 'employee',
    manager_email: '',
    start_date: '',
    gender: ''
  });

  // Fetch departments on component mount
  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${apiConfig.endpoints.departments}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.filter((dept: Department) => dept.is_active));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback departments
      setDepartments([
        { id: 1, name: 'Human Resources', is_active: true },
        { id: 2, name: 'Finance', is_active: true },
        { id: 3, name: 'Information Technology', is_active: true },
        { id: 4, name: 'Operations', is_active: true },
        { id: 5, name: 'Marketing', is_active: true },
        { id: 6, name: 'Sales', is_active: true }
      ]);
    }
  };

  const handleInputChange = (field: keyof NewEmployeeData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.surname || !formData.email || !formData.department || !formData.start_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userResponse = await fetch(`${apiConfig.endpoints.users}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          department: formData.department,
          role: formData.role,
          manager_email: formData.manager_email || null,
          hire_date: formData.start_date,
          gender: formData.gender
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Failed to create user account');
      }

      // Create initial leave balance for the new employee
      const currentYear = new Date().getFullYear();
      const balanceResponse = await fetch(`${apiConfig.endpoints.balance}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          EmployeeEmail: formData.email,
          EmployeeName: `${formData.name} ${formData.surname}`,
          Department: formData.department,
          Year: currentYear,
          Start_date: formData.start_date,
          Manager: formData.manager_email || '',
          // Initialize with default values
          Broughtforward: 0,
          Annual: 25, // Default annual leave allocation
          AccumulatedLeave: 0,
          AnnualUsed: 0,
          Forfeited: 0,
          Annual_leave_adjustments: 0,
          SickBroughtforward: 0,
          Sick: 30, // Default sick leave allocation
          SickUsed: 0,
          Maternity: 90,
          MaternityUsed: 0,
          Parental: 10,
          ParentalUsed: 0,
          Family: 5,
          FamilyUsed: 0,
          Adoption: 90,
          AdoptionUsed: 0,
          Study: 5,
          StudyUsed: 0,
          Wellness: 2,
          WellnessUsed: 0,
          Status: 'Active'
        })
      });

      if (!balanceResponse.ok) {
        const errorData = await balanceResponse.json();
        console.warn('Failed to create leave balance, but user was created:', errorData.message);
      }

      toast({
        title: "Employee Added",
        description: `${formData.name} ${formData.surname} has been successfully added to the system.`,
      });

      // Reset form
      setFormData({
        name: '',
        surname: '',
        email: '',
        department: '',
        role: 'employee',
        manager_email: '',
        start_date: '',
        gender: ''
      });

      onEmployeeAdded();
      onOpenChange(false);

    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">First Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="surname">Last Name *</Label>
              <Input
                id="surname"
                type="text"
                value={formData.surname}
                onChange={(e) => handleInputChange('surname', e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager_email">Manager Email (Optional)</Label>
            <Input
              id="manager_email"
              type="email"
              value={formData.manager_email}
              onChange={(e) => handleInputChange('manager_email', e.target.value)}
              placeholder="Enter manager's email address"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding Employee..." : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};