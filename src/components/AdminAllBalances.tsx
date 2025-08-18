import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { balanceService } from "@/services/balanceService";
import { YearRolloverDialog } from "./YearRolloverDialog";
import { AdminAllBalancesHeader } from "./admin/AdminAllBalancesHeader";
import { AdminAllBalancesTable } from "./admin/AdminAllBalancesTable";
import { EditBalanceDialog } from "./admin/EditBalanceDialog";
import { WarningDialogs } from "./admin/WarningDialogs";
import { AddEmployeeDialog } from "./admin/AddEmployeeDialog";
import { apiConfig } from "@/config/apiConfig";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";

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
  Wellness: number;
  WellnessUsed: number;
  Current_leave_balance: number;
  Leave_balance_previous_month: number;
  Contract_termination_date?: string;
  termination_balance?: number;
  Comment?: string;
  Annual_leave_adjustment_comments?: string;
  Manager: string;
  Modified: string;
  Start_date?: string; // Employee start date for prorated calculations
}

export const AdminAllBalances = () => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<EmployeeBalance | null>(null);
  const [showRolloverDialog, setShowRolloverDialog] = useState(false);
  const [showRolloverWarning, setShowRolloverWarning] = useState(false);
  const [showForfeitWarning, setShowForfeitWarning] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [balances, setBalances] = useState<EmployeeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchBalances = async () => {
    try {
      const response = await fetch(`${apiConfig.endpoints.balance}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.balances) {
          setBalances(data.balances);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch balances",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch balances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  // Check if current date is after July 31st
  const isAfterJuly31 = () => {
    const currentDate = new Date();
    const july31 = new Date(currentDate.getFullYear(), 6, 31); // July is month 6 (0-indexed)
    return currentDate > july31;
  };

  const calculateCurrentBalance = (balance: EmployeeBalance) => {
    return balanceService.calculateCurrentBalance(balance, 'annual', balance.Start_date);
  };

  // Updated termination balance calculation using new formula
  const calculateTerminationBalance = (balance: EmployeeBalance) => {
    if (!balance.Contract_termination_date) return null;
    
    return balanceService.calculateTerminationBalance(balance, balance.Contract_termination_date);
  };

  const getEmployeeStatus = (balance: EmployeeBalance) => {
    return balanceService.getEmployeeStatus(balance.Contract_termination_date);
  };

  const handleRolloverWarning = () => {
    setShowRolloverWarning(true);
  };

  const confirmRollover = () => {
    setShowRolloverWarning(false);
    setShowRolloverDialog(true);
  };

  const handleForfeitWarning = () => {
    setShowForfeitWarning(true);
  };

  const confirmForfeit = async () => {
    setShowForfeitWarning(false);
    
    try {
      // Call the new manual forfeit API endpoint
      const response = await fetch(`${apiConfig.endpoints.leave}/manual-forfeit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          year: currentYear
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refresh the balances from the backend to get the updated data
        await fetchBalances();
        
        toast({
          title: "Leave Forfeited",
          description: `${result.message}`,
        });
      } else {
        throw new Error('Failed to forfeit leave');
      }
    } catch (error) {
      console.error('Error forfeiting leave:', error);
      toast({
        title: "Error",
        description: "Failed to forfeit leave. Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleForfeitedChange = async (balanceId: number, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const balance = balances.find(b => b.BalanceID === balanceId);
    if (!balance) return;

    const updatedBalance = { 
      ...balance, 
      Forfeited: numericValue, 
      Modified: new Date().toISOString() 
    };

    try {
      const response = await fetch(`${apiConfig.endpoints.balance}/update-field`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          BalanceID: balanceId,
          field: 'Forfeited',
          value: numericValue
        })
      });

      if (response.ok) {
        setBalances(prev => prev.map(balance => 
          balance.BalanceID === balanceId ? updatedBalance : balance
        ));
      } else {
        throw new Error('Failed to update forfeited amount');
      }
    } catch (error) {
      console.error('Error updating forfeited amount:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save forfeited amount. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentChange = async (balanceId: number, value: string) => {
    const balance = balances.find(b => b.BalanceID === balanceId);
    if (!balance) return;

    const updatedBalance = { 
      ...balance, 
      Department: value, 
      Modified: new Date().toISOString() 
    };

    try {
      const response = await fetch(`${apiConfig.endpoints.balance}/update-field`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          BalanceID: balanceId,
          field: 'Department',
          value: value
        })
      });

      if (response.ok) {
        setBalances(prev => prev.map(balance => 
          balance.BalanceID === balanceId ? updatedBalance : balance
        ));
      } else {
        throw new Error('Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save department change. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManagerChange = async (balanceId: number, value: string) => {
    const balance = balances.find(b => b.BalanceID === balanceId);
    if (!balance) return;

    const updatedBalance = { 
      ...balance, 
      Manager: value, 
      Modified: new Date().toISOString() 
    };

    try {
      const response = await fetch(`${apiConfig.endpoints.balance}/update-field`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          BalanceID: balanceId,
          field: 'Manager',
          value: value
        })
      });

      if (response.ok) {
        setBalances(prev => prev.map(balance => 
          balance.BalanceID === balanceId ? updatedBalance : balance
        ));
      } else {
        throw new Error('Failed to update manager');
      }
    } catch (error) {
      console.error('Error updating manager:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save manager change. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadCSV = () => {
    const headers = [
      'BalanceID', 'EmployeeName', 'EmployeeEmail', 'Department', 'Status', 'Year',
      'Broughtforward', 'Annual', 'AccumulatedLeave', 'AnnualUsed', 'Forfeited', 'Annual_leave_adjustments',
      'SickBroughtforward', 'Sick', 'SickUsed', 'Maternity', 'MaternityUsed',
      'Parental', 'ParentalUsed', 'Family', 'FamilyUsed', 'Adoption', 'AdoptionUsed',
      'Study', 'StudyUsed', 'Wellness', 'WellnessUsed',
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
        balance.Wellness,
        balance.WellnessUsed,
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

  const handleSave = async () => {
    if (!selectedBalance) return;

    // Calculate new current balance using the updated formula
    const newCurrentBalance = calculateCurrentBalance(selectedBalance);
    
    // Calculate termination balance if termination date is set using the corrected formula
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

    console.log('Attempting to save balance:', {
      balanceId: updatedBalance.BalanceID,
      employeeName: updatedBalance.EmployeeName,
      endpoint: `${apiConfig.endpoints.balance}/update-full`,
      authToken: localStorage.getItem('auth_token') ? 'Present' : 'Missing'
    });

    try {
      // Save to backend database
      const response = await fetch(`${apiConfig.endpoints.balance}/update-full`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedBalance)
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        // Update local state only after successful backend save
        setBalances(prev => prev.map(b => 
          b.BalanceID === updatedBalance.BalanceID ? updatedBalance : b
        ));

        toast({
          title: "Balance Updated",
          description: `${selectedBalance.EmployeeName}'s leave balance has been saved to the database.`,
        });

        setShowEditDialog(false);
        setSelectedBalance(null);
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Detailed error saving balance:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        balanceId: selectedBalance.BalanceID,
        endpoint: `${apiConfig.endpoints.balance}/update-full`
      });
      
      toast({
        title: "Save Failed",
        description: `Failed to save balance changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (field: keyof EmployeeBalance, value: string) => {
    if (!selectedBalance) return;
    
    const numericFields = [
      'Broughtforward', 'Annual', 'AccumulatedLeave', 'AnnualUsed', 'Forfeited', 'Annual_leave_adjustments',
      'SickBroughtforward', 'Sick', 'SickUsed', 'Maternity', 'MaternityUsed',
      'Parental', 'ParentalUsed', 'Family', 'FamilyUsed', 'Adoption', 'AdoptionUsed',
      'Study', 'StudyUsed', 'Wellness', 'WellnessUsed', 'termination_balance',
      'Current_leave_balance', 'Leave_balance_previous_month', 'Year'
    ];

    const finalValue = numericFields.includes(field as string) ? parseFloat(value) || 0 : value;
    
    setSelectedBalance(prev => prev ? {
      ...prev,
      [field]: finalValue
    } : null);
  };

  const handleRolloverComplete = () => {
    toast({
      title: "Data Refreshed",
      description: "Employee balances have been updated after rollover.",
    });
  };

  const handleAddEmployee = () => {
    setShowAddEmployeeDialog(true);
  };

  // Apply sorting to balances
  const { sortedData: sortedBalances, sortConfig, handleSort } = useSorting(
    balances,
    'EmployeeName', // Default sort by employee name
    'asc' // Alphabetical order
  );

  // Apply pagination to sorted data
  const {
    paginatedData: displayBalances,
    pagination,
    goToPage,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
    totalPages,
    startIndex,
    endIndex,
  } = usePagination(sortedBalances, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading balances...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminAllBalancesHeader
        isAfterJuly31={isAfterJuly31()}
        onRolloverWarning={handleRolloverWarning}
        onForfeitWarning={handleForfeitWarning}
        onDownloadCSV={downloadCSV}
        onAddEmployee={handleAddEmployee}
      />

      <AdminAllBalancesTable
        balances={displayBalances}
        totalBalances={balances.length}
        pagination={{
          currentPage: pagination.page,
          totalPages,
          startIndex,
          endIndex,
          totalItems: balances.length,
          onPageChange: goToPage,
          onFirst: goToFirst,
          onLast: goToLast,
          onNext: goToNext,
          onPrevious: goToPrevious,
          hasNext,
          hasPrevious,
        }}
        sorting={{
          sortConfig,
          onSort: handleSort,
        }}
        calculateCurrentBalance={calculateCurrentBalance}
        calculateTerminationBalance={calculateTerminationBalance}
        getEmployeeStatus={getEmployeeStatus}
        onForfeitedChange={handleForfeitedChange}
        onDepartmentChange={handleDepartmentChange}
        onManagerChange={handleManagerChange}
        onEdit={handleEdit}
      />

      <WarningDialogs
        showRolloverWarning={showRolloverWarning}
        showForfeitWarning={showForfeitWarning}
        isAfterJuly31={isAfterJuly31()}
        onRolloverWarningChange={setShowRolloverWarning}
        onForfeitWarningChange={setShowForfeitWarning}
        onConfirmRollover={confirmRollover}
        onConfirmForfeit={confirmForfeit}
      />

      <EditBalanceDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        selectedBalance={selectedBalance}
        onFieldChange={handleFieldChange}
        onSave={handleSave}
      />

      <YearRolloverDialog
        open={showRolloverDialog}
        onOpenChange={setShowRolloverDialog}
        currentYear={currentYear}
        onRolloverComplete={handleRolloverComplete}
      />

      <AddEmployeeDialog
        open={showAddEmployeeDialog}
        onOpenChange={setShowAddEmployeeDialog}
        onEmployeeAdded={fetchBalances}
      />
    </div>
  );
};