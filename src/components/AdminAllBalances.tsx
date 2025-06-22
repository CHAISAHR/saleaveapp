
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, Users, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";
import { ExcelUploader } from "./admin/ExcelUploader";
import * as XLSX from 'xlsx';

interface EmployeeBalance {
  BalanceID: number;
  EmployeeName: string;
  EmployeeEmail: string;
  Department: string;
  Year: number;
  Broughtforward: number;
  Annual: number;
  AnnualUsed: number;
  Forfeited: number;
  Annual_leave_adjustments: number;
  SickUsed: number;
  FamilyUsed: number;
  StudyUsed: number;
  Current_leave_balance: number;
  Manager: string;
}

export const AdminAllBalances = () => {
  const { toast } = useToast();
  const [balances, setBalances] = useState<EmployeeBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Helper function to safely convert to number
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely format numbers
  const safeToFixed = (value: any, decimals: number = 1): string => {
    return safeNumber(value).toFixed(decimals);
  };

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchBalances = async () => {
    try {
      setLoading(true);
      console.log('Fetching balances from:', `${apiConfig.endpoints.balance}/`);
      
      const response = await fetch(`${apiConfig.endpoints.balance}/`, {
        headers: getAuthHeaders()
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Balances data received:', data);
        
        // Sanitize the data to ensure all numeric fields are proper numbers
        const sanitizedBalances = (data.balances || []).map((balance: any) => ({
          ...balance,
          Broughtforward: safeNumber(balance.Broughtforward),
          Annual: safeNumber(balance.Annual),
          AnnualUsed: safeNumber(balance.AnnualUsed),
          Forfeited: safeNumber(balance.Forfeited),
          Annual_leave_adjustments: safeNumber(balance.Annual_leave_adjustments),
          SickUsed: safeNumber(balance.SickUsed),
          FamilyUsed: safeNumber(balance.FamilyUsed),
          StudyUsed: safeNumber(balance.StudyUsed),
          Current_leave_balance: safeNumber(balance.Current_leave_balance)
        }));
        
        setBalances(sanitizedBalances);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch balances:', errorText);
        throw new Error(`Failed to fetch balances: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: "Error",
        description: "Failed to load employee balances. Please check if the server is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const downloadBalances = () => {
    const wsData = [
      [
        'Employee Name',
        'Email',
        'Department',
        'Year',
        'Brought Forward',
        'Annual Allocated',
        'Annual Used',
        'Forfeited',
        'Adjustments',
        'Sick Used',
        'Family Used',
        'Study Used',
        'Current Balance',
        'Manager'
      ],
      ...balances.map(balance => [
        balance.EmployeeName,
        balance.EmployeeEmail,
        balance.Department,
        balance.Year,
        safeNumber(balance.Broughtforward),
        safeNumber(balance.Annual),
        safeNumber(balance.AnnualUsed),
        safeNumber(balance.Forfeited),
        safeNumber(balance.Annual_leave_adjustments),
        safeNumber(balance.SickUsed),
        safeNumber(balance.FamilyUsed),
        safeNumber(balance.StudyUsed),
        safeNumber(balance.Current_leave_balance),
        balance.Manager || ''
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Balances');
    XLSX.writeFile(wb, `employee_balances_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Download Complete",
      description: "Employee balances have been downloaded as Excel file.",
    });
  };

  const totalEmployees = balances.length;
  const totalCurrentBalance = balances.reduce((sum, b) => sum + safeNumber(b.Current_leave_balance), 0);
  const avgBalance = totalEmployees > 0 ? safeToFixed(totalCurrentBalance / totalEmployees) : '0';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Employee Balances</h2>
          <p className="text-gray-600">View and manage all employee leave balances</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={downloadBalances}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
          <Button 
            onClick={() => setShowBulkUpload(true)}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Leave Days</p>
                <p className="text-2xl font-bold text-gray-900">{safeToFixed(totalCurrentBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Balance</p>
                <p className="text-2xl font-bold text-gray-900">{avgBalance} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Leave Balances ({new Date().getFullYear()})</CardTitle>
          <CardDescription>Current year leave balance overview for all employees</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading balances...</div>
          ) : balances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No employee balances found. This could mean:</p>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>No balances have been created yet</li>
                <li>The server is not running</li>
                <li>Database connection issues</li>
              </ul>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Brought Forward</TableHead>
                  <TableHead>Annual</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Sick Used</TableHead>
                  <TableHead>Manager</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.BalanceID}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{balance.EmployeeName}</div>
                        <div className="text-xs text-gray-500">{balance.EmployeeEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{balance.Department}</TableCell>
                    <TableCell>{safeNumber(balance.Broughtforward)}</TableCell>
                    <TableCell>{safeNumber(balance.Annual)}</TableCell>
                    <TableCell>{safeNumber(balance.AnnualUsed)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={safeNumber(balance.Current_leave_balance) < 5 ? "destructive" : "default"}
                        className="font-medium"
                      >
                        {safeNumber(balance.Current_leave_balance)} days
                      </Badge>
                    </TableCell>
                    <TableCell>{safeNumber(balance.SickUsed)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {balance.Manager || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Employee Balances</DialogTitle>
            <DialogDescription>
              Upload multiple employee leave balances via Excel file
            </DialogDescription>
          </DialogHeader>
          <ExcelUploader 
            type="balances" 
            onUploadComplete={() => {
              fetchBalances();
              setShowBulkUpload(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
