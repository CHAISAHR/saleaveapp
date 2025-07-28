import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";
import { Loader2 } from "lucide-react";

interface ForfeitedLeave {
  EmployeeName: string;
  EmployeeEmail: string;
  Department: string;
  Broughtforward: number;
  Forfeited: number;
}

export const ForfeitedLeavesTable = () => {
  const [forfeitedLeaves, setForfeitedLeaves] = useState<ForfeitedLeave[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchForfeitedLeaves = async () => {
    try {
      console.log('ForfeitedLeavesTable - Fetching forfeited leaves...');
      
      const response = await makeApiRequest(`${apiConfig.endpoints.balance}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      console.log('ForfeitedLeavesTable - Balance data:', data);
      
      // Handle both real API responses and mock data arrays
      const balanceArray = Array.isArray(data) ? data : 
                          (data.success && data.data ? data.data : 
                           data.data || []);
      
      // Filter employees who have forfeited leave > 0
      const forfeitedData = balanceArray
        .filter((balance: any) => (balance.Forfeited || 0) > 0)
        .map((balance: any) => ({
          EmployeeName: balance.EmployeeName || balance.employee_name || 'Unknown',
          EmployeeEmail: balance.EmployeeEmail || balance.employee_email || '',
          Department: balance.Department || balance.department || 'Unknown',
          Broughtforward: balance.Broughtforward || balance.brought_forward || 0,
          Forfeited: balance.Forfeited || balance.forfeited || 0
        }));

      console.log('ForfeitedLeavesTable - Forfeited leaves:', forfeitedData);
      setForfeitedLeaves(forfeitedData);
      
    } catch (error) {
      console.error('Error fetching forfeited leaves:', error);
      setForfeitedLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForfeitedLeaves();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Forfeited Leaves</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading forfeited leaves...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forfeited Leaves</CardTitle>
        <p className="text-sm text-muted-foreground">
          Employees who have forfeited annual leave
        </p>
      </CardHeader>
      <CardContent>
        {forfeitedLeaves.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No forfeited leaves found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Brought Forward</TableHead>
                  <TableHead className="text-right">Forfeited Leave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forfeitedLeaves.map((employee, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {employee.EmployeeName}
                    </TableCell>
                    <TableCell>{employee.EmployeeEmail}</TableCell>
                    <TableCell>{employee.Department}</TableCell>
                    <TableCell className="text-right">
                      {employee.Broughtforward.toFixed(1)} days
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {employee.Forfeited.toFixed(1)} days
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};