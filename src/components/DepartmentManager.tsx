
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const DepartmentManager = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: ""
  });

  // Get authorization headers
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch departments from backend
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/departments', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      } else {
        throw new Error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Set default departments if backend is not available
      setDepartments([
        { id: 1, name: 'Hr & Ops', description: 'HR department managing personnel and policies', is_active: true, created_at: '', updated_at: '' },
        { id: 2, name: 'Access to Medicines', description: 'IT department managing technology and systems', is_active: true, created_at: '', updated_at: '' },
        { id: 3, name: 'Finance', description: 'Finance department managing company finances', is_active: true, created_at: '', updated_at: '' },
        { id: 4, name: 'Assistive Technologies', description: 'Marketing department managing company promotion', is_active: true, created_at: '', updated_at: '' },
        { id: 5, name: 'SHF', description: 'Sales department managing customer relationships', is_active: true, created_at: '', updated_at: '' },
        { id: 6, name: 'TB', description: 'Operations department managing daily activities', is_active: true, created_at: '', updated_at: '' },
        { id: 7, name: 'HIV SS, Prep,& SRMNH', description: 'Legal department managing compliance and contracts', is_active: true, created_at: '', updated_at: '' },
        { id: 8, name: 'Cancer', description: 'Cervical Cancer', is_active: true, created_at: '', updated_at: '' },
        { id: 9, name: 'Global', description: 'Cervical Cancer', is_active: true, created_at: '', updated_at: '' },
        { id: 10, name: 'FCDO', description: 'Cervical Cancer', is_active: true, created_at: '', updated_at: '' },
        { id: 11, name: 'Other', description: 'Administration department managing office operations', is_active: true, created_at: '', updated_at: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a department name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/departments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newDepartment)
      });

      if (response.ok) {
        await fetchDepartments();
        setNewDepartment({ name: "", description: "" });
        setShowDepartmentForm(false);

        toast({
          title: "Department Added",
          description: `${newDepartment.name} has been added successfully.`,
        });
      } else {
        throw new Error('Failed to add department');
      }
    } catch (error) {
      console.error('Error adding department:', error);
      
      // Add to local state if backend is not available
      const newDept: Department = {
        id: Math.max(...departments.map(d => d.id), 0) + 1,
        name: newDepartment.name,
        description: newDepartment.description,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setDepartments(prev => [...prev, newDept]);
      setNewDepartment({ name: "", description: "" });
      setShowDepartmentForm(false);

      toast({
        title: "Department Added",
        description: `${newDepartment.name} has been added locally.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a department name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/departments/${editingDepartment.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editingDepartment.name,
          description: editingDepartment.description
        })
      });

      if (response.ok) {
        await fetchDepartments();
        setEditingDepartment(null);

        toast({
          title: "Department Updated",
          description: `${editingDepartment.name} has been updated successfully.`,
        });
      } else {
        throw new Error('Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      
      // Update local state if backend is not available
      setDepartments(prev => prev.map(dept => 
        dept.id === editingDepartment.id ? editingDepartment : dept
      ));
      setEditingDepartment(null);

      toast({
        title: "Department Updated",
        description: `${editingDepartment.name} has been updated locally.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: number, departmentName: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/departments/${departmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await fetchDepartments();

        toast({
          title: "Department Deleted",
          description: `${departmentName} has been deleted successfully.`,
        });
      } else {
        throw new Error('Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      
      // Remove from local state if backend is not available
      setDepartments(prev => prev.filter(dept => dept.id !== departmentId));

      toast({
        title: "Department Deleted",
        description: `${departmentName} has been deleted locally.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="text-gray-600">Manage company departments and their descriptions</p>
        </div>
        <Dialog open={showDepartmentForm} onOpenChange={setShowDepartmentForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>
                Create a new department for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">Department Name *</Label>
                <Input
                  id="dept-name"
                  placeholder="e.g., Engineering"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dept-description">Description</Label>
                <Textarea
                  id="dept-description"
                  placeholder="Brief description of the department..."
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDepartmentForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDepartment} disabled={loading}>
                  {loading ? "Adding..." : "Add Department"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>All Departments</span>
          </CardTitle>
          <CardDescription>Manage department names and descriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading departments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {department.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        department.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {department.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingDepartment(department)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDepartment(department.id, department.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information.
            </DialogDescription>
          </DialogHeader>
          {editingDepartment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dept-name">Department Name *</Label>
                <Input
                  id="edit-dept-name"
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dept-description">Description</Label>
                <Textarea
                  id="edit-dept-description"
                  value={editingDepartment.description || ''}
                  onChange={(e) => setEditingDepartment(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingDepartment(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditDepartment} disabled={loading}>
                  {loading ? "Updating..." : "Update Department"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
