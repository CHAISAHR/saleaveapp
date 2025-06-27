import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { balanceService } from "@/services/balanceService";

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

interface EditBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBalance: EmployeeBalance | null;
  onFieldChange: (field: keyof EmployeeBalance, value: string) => void;
  onSave: () => void;
}

export const EditBalanceDialog = ({
  open,
  onOpenChange,
  selectedBalance,
  onFieldChange,
  onSave
}: EditBalanceDialogProps) => {
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

  if (!selectedBalance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Balance</DialogTitle>
          <DialogDescription>
            Modify all leave balance fields for {selectedBalance?.EmployeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee Name</Label>
              <Input
                value={selectedBalance.EmployeeName}
                onChange={(e) => onFieldChange('EmployeeName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Employee Email</Label>
              <Input
                value={selectedBalance.EmployeeEmail}
                onChange={(e) => onFieldChange('EmployeeEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={selectedBalance.Department}
                onChange={(e) => onFieldChange('Department', e.target.value)}
                placeholder="Enter department name"
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
                  onChange={(e) => onFieldChange('Broughtforward', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Annual Allocated (Legacy)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedBalance.Annual}
                  onChange={(e) => onFieldChange('Annual', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Accumulated Leave (1.667/month)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedBalance.AccumulatedLeave}
                  onChange={(e) => onFieldChange('AccumulatedLeave', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Annual Used</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedBalance.AnnualUsed}
                  onChange={(e) => onFieldChange('AnnualUsed', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Forfeited</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedBalance.Forfeited}
                  onChange={(e) => onFieldChange('Forfeited', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Annual Adjustments</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedBalance.Annual_leave_adjustments}
                  onChange={(e) => onFieldChange('Annual_leave_adjustments', e.target.value)}
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
                        onChange={(e) => onFieldChange(key as keyof EmployeeBalance, e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Used</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={selectedBalance[usedKey as keyof EmployeeBalance] as number}
                        onChange={(e) => onFieldChange(usedKey as keyof EmployeeBalance, e.target.value)}
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
                  onChange={(e) => onFieldChange('Manager', e.target.value)}
                  placeholder="Enter manager email"
                />
              </div>
              <div className="space-y-2">
                <Label>Contract Termination Date</Label>
                <Input
                  type="date"
                  value={selectedBalance.Contract_termination_date || ''}
                  onChange={(e) => onFieldChange('Contract_termination_date', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Comments</Label>
              <Textarea
                value={selectedBalance.Comment || ''}
                onChange={(e) => onFieldChange('Comment', e.target.value)}
                placeholder="General comments about this employee's leave balance"
              />
            </div>
            <div className="space-y-2 mt-4">
              <Label>Annual Leave Adjustment Comments</Label>
              <Textarea
                value={selectedBalance.Annual_leave_adjustment_comments || ''}
                onChange={(e) => onFieldChange('Annual_leave_adjustment_comments', e.target.value)}
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
            <div className="text-xs text-blue-600 mt-2 space-y-1">
              <p>Current Balance Formula: Brought Forward + Accumulated Leave - Annual Used - Forfeited - Adjustments</p>
              {selectedBalance.Contract_termination_date && (
                <p>Termination Balance Formula: Brought Forward - Annual Used - Forfeited - Adjustments + Accumulated Leave (days worked/total days in year * 20)</p>
              )}
              {selectedBalance.Contract_termination_date && balanceService.hasTerminationDatePassed(selectedBalance.Contract_termination_date) && (
                <p className="text-orange-600">Note: Termination date has passed - using prorated accumulation for termination balance</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
