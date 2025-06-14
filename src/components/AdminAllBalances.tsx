import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, Plus, Download, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { balanceService } from "@/services/balanceService";
import { YearRolloverDialog } from "./YearRolloverDialog";

interface EmployeeBalance {
  BalanceID: number;
  EmployeeName: string;
  EmployeeEmail: string;
  Department: string;
  Status: string;
  Year: number;
  Broughtforward: number;
  Annual: number;
  AccumulatedLeave: number;
  AnnualUsed: number;
  Forfeited: number;
  Annual_leave_adjustments: number;
  SickBroughtforward: number;
  Sick: number;
  SickUsed: number;
  Maternity: number;
  MaternityUsed: number;
  Parental: number;
  ParentalUsed: number;
  Family: number;
  FamilyUsed: number;
  Adoption: number;
  AdoptionUsed: number;
  Study: number;
  StudyUsed: number;
  Mentalhealth: number;
  MentalhealthUsed: number;
  PowerAppsId?: string;
  Current_leave_balance: number;
  Leave_balance_previous_month: number;
  Contract_termination_date?: string;
  termination_balance?: number;
  Comment?: string;
  Annual_leave_adjustment_comments?: string;
  Manager: string;
  Modified: string;
}

export const AdminAllBalances = () => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<EmployeeBalance | null>(null);
  const [showRolloverDialog, setShowRolloverDialog] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  // Mock data - in real app this would come from API
  const [balances, setBalances] = useState<EmployeeBalance[]>([
    {
      BalanceID: 1,
      EmployeeName: "John Smith",
      EmployeeEmail: "john.smith@company.com",
      Department: "Marketing",
      Status: "Active",
      Year: 2025,
      Broughtforward: 5,
      Annual: 20,
      AccumulatedLeave: 20.0, // 12 months * 1.667
      AnnualUsed: 8,
      Forfeited: 0,
      Annual_leave_adjustments: 0,
      SickBroughtforward: 2,
      Sick: 36,
      SickUsed: 2,
      Maternity: 90,
      MaternityUsed: 0,
      Parental: 20,
      ParentalUsed: 0,
      Family: 3,
      FamilyUsed: 1,
      Adoption: 20,
      AdoptionUsed: 0,
      Study: 6,
      StudyUsed: 0,
      Mentalhealth: 2,
      MentalhealthUsed: 0,
      PowerAppsId: "PA001",
      Current_leave_balance: 17,
      Leave_balance_previous_month: 15.5,
      Manager: "sarah.johnson@company.com",
      Modified: "2024-12-11T10:00:00Z"
    },
    {
      BalanceID: 2,
      EmployeeName: "Emily Davis",
      EmployeeEmail: "emily.davis@company.com",
      Department: "Marketing",
      Status: "Active",
      Year: 2025,
      Broughtforward: 3,
      Annual: 20,
      AccumulatedLeave: 13.3, // 8 months * 1.667 (terminated)
      AnnualUsed: 12,
      Forfeited: 0,
      Annual_leave_adjustments: 0,
      SickBroughtforward: 5,
      Sick: 36,
      SickUsed: 4,
      Maternity: 90,
      MaternityUsed: 0,
      Parental: 20,
      ParentalUsed: 0,
      Family: 3,
      FamilyUsed: 1,
      Adoption: 20,
      AdoptionUsed: 0,
      Study: 6,
      StudyUsed: 2,
      Mentalhealth: 2,
      MentalhealthUsed: 0,
      PowerAppsId: "PA002",
      Current_leave_balance: 11,
      Leave_balance_previous_month: 13.5,
      Contract_termination_date: "2024-12-01",
      Manager: "sarah.johnson@company.com",
      Modified: "2024-12-11T10:00:00Z"
    }
  ]);

  const calculateCurrentBalance = (balance: EmployeeBalance) => {
    return balanceService.calculateAnnualLeaveBalance(balance);
  };

  const calculateTerminationBalance = (balance: EmployeeBalance) => {
    if (!balance.Contract_termination_date) return null;
    return balanceService.calculateTerminationBalance(balance, balance.Contract_termination_date);
  };

  const getEmployeeStatus = (balance: EmployeeBalance) => {
    return balanceService.getEmployeeStatus(balance.Contract_termination_date);
  };

  const downloadCSV = () => {
    const headers = [
      'BalanceID', 'EmployeeName', 'EmployeeEmail', 'Department', 'Status', 'Year',
      'Broughtforward', 'Annual', 'AccumulatedLeave', 'AnnualUsed', 'Forfeited', 'Annual_leave_adjustments',
      'SickBroughtforward', 'Sick', 'SickUsed', 'Maternity', 'MaternityUsed',
      'Parental', 'ParentalUsed', 'Family', 'FamilyUsed', 'Adoption', 'AdoptionUsed',
      'Study', 'StudyUsed', 'Mentalhealth', 'MentalhealthUsed', 'PowerAppsId',
      'Current_leave_balance', 'Leave_balance_previous_month', 'Contract_termination_date',
      'termination_balance', 'Comment', 'Annual_leave_adjustment_comments', 'Manager', 'Modified'
    ];
    
    const csvContent = [
      headers.join(','),
      ...balances.map(balance => [
        balance.BalanceID,
        `"${balance.EmployeeName}"`,
        balance.EmployeeEmail,
        balance.Department,
        getEmployeeStatus(balance),
        balance.Year,
        balance.Broughtforward,
        balance.Annual,
        balance.AccumulatedLeave,
        balance.AnnualUsed,
        balance.Forfeited,
        balance.Annual_leave_adjustments,
        balance.SickBroughtforward,
        balance.Sick,
        balance.SickUsed,
        balance.Maternity,
        balance.MaternityUsed,
        balance.Parental,
        balance.ParentalUsed,
        balance.Family,
        balance.FamilyUsed,
        balance.Adoption,
        balance.AdoptionUsed,
        balance.Study,
        balance.StudyUsed,
        balance.Mentalhealth,
        balance.MentalhealthUsed,
        balance.PowerAppsId || '',
        calculateCurrentBalance(balance),
        balance.Leave_balance_previous_month,
        balance.Contract_termination_date || '',
        calculateTerminationBalance(balance) || '',
        `"${balance.Comment || ''}"`,
        `"${balance.Annual_leave_adjustment_comments || ''}"`,
        balance.Manager,
        balance.Modified
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employee_balances_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Downloaded",
      description: "Employee balances data has been exported successfully.",
    });
  };

  const handleEdit = (balance: EmployeeBalance) => {
    setSelectedBalance({ ...balance });
    setShowEditDialog(true);
  };

  const handleSave = () => {
    if (!selectedBalance) return;

    // Calculate new current balance using the updated formula
    const newCurrentBalance = calculateCurrentBalance(selectedBalance);
    
    // Calculate termination balance if termination date is set
    const newTerminationBalance = calculateTerminationBalance(selectedBalance);

    // Update status based on termination date
    const newStatus = getEmployeeStatus(selectedBalance);

    const updatedBalance = {
      ...selectedBalance,
      Status: newStatus,
      Current_leave_balance: newCurrentBalance,
      termination_balance: newTerminationBalance,
      Modified: new Date().toISOString()
    };

    setBalances(prev => prev.map(b => 
      b.BalanceID === updatedBalance.BalanceID ? updatedBalance : b
    ));

    console.log('Balance updated:', updatedBalance);

    toast({
      title: "Balance Updated",
      description: `${selectedBalance.EmployeeName}'s leave balance has been updated.`,
    });

    setShowEditDialog(false);
    setSelectedBalance(null);
  };

  const handleFieldChange = (field: keyof EmployeeBalance, value: string) => {
    if (!selectedBalance) return;
    
    const numericFields = [
      'Broughtforward', 'Annual', 'AccumulatedLeave', 'AnnualUsed', 'Forfeited', 'Annual_leave_adjustments',
      'SickBroughtforward', 'Sick', 'SickUsed', 'Maternity', 'MaternityUsed',
      'Parental', 'ParentalUsed', 'Family', 'FamilyUsed', 'Adoption', 'AdoptionUsed',
      'Study', 'StudyUsed', 'Mentalhealth', 'MentalhealthUsed', 'termination_balance',
      'Current_leave_balance', 'Leave_balance_previous_month', 'Year'
    ];

    const finalValue = numericFields.includes(field as string) ? parseFloat(value) || 0 : value;
    
    setSelectedBalance(prev => prev ? {
      ...prev,
      [field]: finalValue
    } : null);
  };

  const handleRolloverComplete = () => {
    // Refresh balances data after rollover
    toast({
      title: "Data Refreshed",
      description: "Employee balances have been updated after rollover.",
    });
    // In real implementation, this would refetch data from API
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Employee Balances</h2>
          <p className="text-gray-600">View and edit leave balances for all employees</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowRolloverDialog(true)}
            variant="default"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Year Rollover
          </Button>
          <Button onClick={downloadCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add New Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Leave Balances ({currentYear})</CardTitle>
          <CardDescription>
            Complete leave balance information for all employees. Annual leave formula: Brought Forward + Accumulated Leave - Annual Used - Forfeited - Adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Balance ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Employee Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Brought Forward</TableHead>
                  <TableHead>Annual</TableHead>
                  <TableHead>Accumulated Leave</TableHead>
                  <TableHead>Annual Used</TableHead>
                  <TableHead>Forfeited</TableHead>
                  <TableHead>Annual Adjustments</TableHead>
                  <TableHead>Sick BF</TableHead>
                  <TableHead>Sick</TableHead>
                  <TableHead>Sick Used</TableHead>
                  <TableHead>Maternity</TableHead>
                  <TableHead>Maternity Used</TableHead>
                  <TableHead>Parental</TableHead>
                  <TableHead>Parental Used</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Family Used</TableHead>
                  <TableHead>Adoption</TableHead>
                  <TableHead>Adoption Used</TableHead>
                  <TableHead>Study</TableHead>
                  <TableHead>Study Used</TableHead>
                  <TableHead>Mental Health</TableHead>
                  <TableHead>Mental Health Used</TableHead>
                  <TableHead>PowerApps ID</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Previous Month</TableHead>
                  <TableHead>Contract Term Date</TableHead>
                  <TableHead>Termination Balance</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Adjustment Comments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.BalanceID}>
                    <TableCell className="font-medium">{balance.BalanceID}</TableCell>
                    <TableCell>{balance.EmployeeName}</TableCell>
                    <TableCell>{balance.EmployeeEmail}</TableCell>
                    <TableCell>{balance.Department}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getEmployeeStatus(balance) === 'Inactive' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getEmployeeStatus(balance)}
                      </span>
                    </TableCell>
                    <TableCell>{balance.Year}</TableCell>
                    <TableCell>{balance.Broughtforward}</TableCell>
                    <TableCell>{balance.Annual}</TableCell>
                    <TableCell className="font-medium text-purple-600">{balance.AccumulatedLeave}</TableCell>
                    <TableCell>{balance.AnnualUsed}</TableCell>
                    <TableCell>{balance.Forfeited}</TableCell>
                    <TableCell>{balance.Annual_leave_adjustments}</TableCell>
                    <TableCell>{balance.SickBroughtforward}</TableCell>
                    <TableCell>{balance.Sick}</TableCell>
                    <TableCell>{balance.SickUsed}</TableCell>
                    <TableCell>{balance.Maternity}</TableCell>
                    <TableCell>{balance.MaternityUsed}</TableCell>
                    <TableCell>{balance.Parental}</TableCell>
                    <TableCell>{balance.ParentalUsed}</TableCell>
                    <TableCell>{balance.Family}</TableCell>
                    <TableCell>{balance.FamilyUsed}</TableCell>
                    <TableCell>{balance.Adoption}</TableCell>
                    <TableCell>{balance.AdoptionUsed}</TableCell>
                    <TableCell>{balance.Study}</TableCell>
                    <TableCell>{balance.StudyUsed}</TableCell>
                    <TableCell>{balance.Mentalhealth}</TableCell>
                    <TableCell>{balance.MentalhealthUsed}</TableCell>
                    <TableCell>{balance.PowerAppsId || '-'}</TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {calculateCurrentBalance(balance)}
                    </TableCell>
                    <TableCell>{balance.Leave_balance_previous_month}</TableCell>
                    <TableCell>
                      {balance.Contract_termination_date ? 
                        new Date(balance.Contract_termination_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {calculateTerminationBalance(balance) || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[100px] truncate" title={balance.Comment}>
                        {balance.Comment || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[100px] truncate" title={balance.Annual_leave_adjustment_comments}>
                        {balance.Annual_leave_adjustment_comments || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(balance)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Balance</DialogTitle>
            <DialogDescription>
              Modify all leave balance fields for {selectedBalance?.EmployeeName}
            </DialogDescription>
          </DialogHeader>

          {selectedBalance && (
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee Name</Label>
                  <Input
                    value={selectedBalance.EmployeeName}
                    onChange={(e) => handleFieldChange('EmployeeName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee Email</Label>
                  <Input
                    value={selectedBalance.EmployeeEmail}
                    onChange={(e) => handleFieldChange('EmployeeEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={selectedBalance.Department}
                    onChange={(e) => handleFieldChange('Department', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status (Auto-calculated)</Label>
                  <Input
                    value={getEmployeeStatus(selectedBalance)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Annual Leave */}
              <div>
                <h4 className="font-medium mb-3">Annual Leave</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Brought Forward</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedBalance.Broughtforward}
                      onChange={(e) => handleFieldChange('Broughtforward', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Allocated (Legacy)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedBalance.Annual}
                      onChange={(e) => handleFieldChange('Annual', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Accumulated Leave (1.667/month)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedBalance.AccumulatedLeave}
                      onChange={(e) => handleFieldChange('AccumulatedLeave', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Used</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedBalance.AnnualUsed}
                      onChange={(e) => handleFieldChange('AnnualUsed', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Forfeited</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedBalance.Forfeited}
                      onChange={(e) => handleFieldChange('Forfeited', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Adjustments</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedBalance.Annual_leave_adjustments}
                      onChange={(e) => handleFieldChange('Annual_leave_adjustments', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Other Leave Types */}
              <div>
                <h4 className="font-medium mb-3">Other Leave Types</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'Sick', usedKey: 'SickUsed', label: 'Sick Leave' },
                    { key: 'Family', usedKey: 'FamilyUsed', label: 'Family Leave' },
                    { key: 'Study', usedKey: 'StudyUsed', label: 'Study Leave' },
                    { key: 'Maternity', usedKey: 'MaternityUsed', label: 'Maternity Leave' },
                    { key: 'Parental', usedKey: 'ParentalUsed', label: 'Parental Leave' },
                    { key: 'Adoption', usedKey: 'AdoptionUsed', label: 'Adoption Leave' },
                    { key: 'Mentalhealth', usedKey: 'MentalhealthUsed', label: 'Mental Health Leave' }
                  ].map(({ key, usedKey, label }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Allocated</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={selectedBalance[key as keyof EmployeeBalance] as number}
                            onChange={(e) => handleFieldChange(key as keyof EmployeeBalance, e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Used</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={selectedBalance[usedKey as keyof EmployeeBalance] as number}
                            onChange={(e) => handleFieldChange(usedKey as keyof EmployeeBalance, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Fields */}
              <div>
                <h4 className="font-medium mb-3">Additional Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Manager</Label>
                    <Input
                      value={selectedBalance.Manager}
                      onChange={(e) => handleFieldChange('Manager', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract Termination Date</Label>
                    <Input
                      type="date"
                      value={selectedBalance.Contract_termination_date || ''}
                      onChange={(e) => handleFieldChange('Contract_termination_date', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Comments</Label>
                  <Textarea
                    value={selectedBalance.Comment || ''}
                    onChange={(e) => handleFieldChange('Comment', e.target.value)}
                    placeholder="General comments about this employee's leave balance"
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Annual Leave Adjustment Comments</Label>
                  <Textarea
                    value={selectedBalance.Annual_leave_adjustment_comments || ''}
                    onChange={(e) => handleFieldChange('Annual_leave_adjustment_comments', e.target.value)}
                    placeholder="Comments about annual leave adjustments"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Calculated Balances</h4>
                <div className="grid grid-cols-2 gap-4 text-blue-700">
                  <p>
                    Current Annual Leave Balance: {calculateCurrentBalance(selectedBalance)} days
                  </p>
                  {selectedBalance.Contract_termination_date && (
                    <p>
                      Termination Balance: {calculateTerminationBalance(selectedBalance)} days
                    </p>
                  )}
                  <p>
                    Employee Status: {getEmployeeStatus(selectedBalance)}
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Formula: Brought Forward + Accumulated Leave - Annual Used - Forfeited - Adjustments
                  {selectedBalance.Contract_termination_date && balanceService.hasTerminationDatePassed(selectedBalance.Contract_termination_date) && (
                    <>
                      <br />
                      <span className="text-orange-600">Note: Termination date has passed - using termination balance instead of current accumulation</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <YearRolloverDialog
        open={showRolloverDialog}
        onOpenChange={setShowRolloverDialog}
        currentYear={currentYear}
        onRolloverComplete={handleRolloverComplete}
      />
    </div>
  );
};
