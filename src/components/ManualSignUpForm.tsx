import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { apiConfig } from '@/config/apiConfig';

interface ManualSignUpFormProps {
  onSignUp: (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
    gender: string;
  }) => void;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export const ManualSignUpForm: React.FC<ManualSignUpFormProps> = ({ onSignUp }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    department: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(apiConfig.endpoints.departments);
        if (response.ok) {
          const data = await response.json();
          const activeDepartments = data.departments?.filter((dept: Department) => dept.is_active) || [];
          // Sort departments alphabetically by name
          const sortedDepartments = activeDepartments.sort((a: Department, b: Department) => 
            a.name.localeCompare(b.name)
          );
          setDepartments(sortedDepartments);
        } else {
          // Use default departments if backend is not available
          const defaultDepartments = [
            { id: 1, name: 'HR & Operations', is_active: true},
            { id: 2, name: 'Access to Medicines', is_active: true},
            { id: 3, name: 'Finance', is_active: true},
            { id: 4, name: 'Assistive Technologies', is_active: true},
            { id: 5, name: 'SHF',is_active: true},
            { id: 6, name: 'TB',is_active: true},
            { id: 7, name: 'HIV Prevention', is_active: true},
            { id: 8, name: 'Cancer', is_active: true},
            { id: 9, name: 'Global', is_active: true},
            { id: 10, name: 'FCDO', is_active: true},
            { id: 11, name: 'Malaria', is_active: true},
            { id: 12, name: 'SRMNH', is_active: true},
            { id: 13, name: 'Pediatric and Adolescent HIV', is_active: true},
            { id: 14, name: 'Syphilis', is_active: true},
            { id: 15, name: 'Senior Leadership', is_active: true},
            { id: 16, name: 'Other', is_active: true}
          ];
          // Sort default departments alphabetically
          const sortedDefaultDepartments = defaultDepartments.sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          setDepartments(sortedDefaultDepartments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Use default departments if there's an error
        const defaultDepartments = [
          { id: 1, name: 'HR & Operations', is_active: true},
          { id: 2, name: 'Access to Medicines', is_active: true},
          { id: 3, name: 'Finance', is_active: true},
          { id: 4, name: 'Assistive Technologies', is_active: true},
          { id: 5, name: 'SHF',is_active: true},
          { id: 6, name: 'TB',is_active: true},
          { id: 7, name: 'HIV Prevention', is_active: true},
          { id: 8, name: 'Cancer', is_active: true},
          { id: 9, name: 'Global', is_active: true},
          { id: 10, name: 'FCDO', is_active: true},
          { id: 11, name: 'Malaria', is_active: true},
          { id: 12, name: 'SRMNH', is_active: true},
          { id: 13, name: 'Pediatric and Adolescent HIV', is_active: true},
          { id: 14, name: 'Syphilis', is_active: true},
          { id: 15, name: 'Other', is_active: true}
        ];
        // Sort default departments alphabetically
        const sortedDefaultDepartments = defaultDepartments.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setDepartments(sortedDefaultDepartments);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignUp(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">First Name *</Label>
          <Input
            id="signup-name"
            name="given-name"
            placeholder="Enter your first name"
            autoComplete="given-name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-surname">Last Name *</Label>
          <Input
            id="signup-surname"
            name="family-name"
            placeholder="Enter your last name"
            autoComplete="family-name"
            value={formData.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email *</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signup-department">Department *</Label>
          <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
            <SelectTrigger id="signup-department">
              <SelectValue placeholder="Select your department" />
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
          <Label htmlFor="signup-gender">Gender *</Label>
          <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
            <SelectTrigger id="signup-gender">
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password *</Label>
        <div className="relative">
          <Input
            id="signup-password"
            name="new-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            name="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" variant="blue">
        Sign Up
      </Button>
    </form>
  );
};
