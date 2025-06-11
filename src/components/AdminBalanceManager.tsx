
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export const AdminBalanceManager = () => {
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<EmployeeBalance | null>(null);
  const [adjustmentComment, setAdjustmentComment] = useState("");

  // Mock data - in real app this would come from API
  const [balances, setBalances] = useState<EmployeeBalance[]>([
    {
      BalanceID: 1,
      EmployeeName: "John Smith",
      EmployeeEmail: "john.smith@company.com",
      Department: "Marketing",
      Year: 2025,
      Broughtforward: 5,
      Annual: 20,
      AnnualUsed: 8,
      Forfeited: 0,
      Annual_leave_adjustments: 0,
      SickUsed: 2,
      FamilyUsed: 1,
      StudyUsed: 0,
      Current_leave_balance: 17,
      Manager: "sarah.johnson@company.com"
    },
    {
      BalanceID: 2,
      EmployeeName: "Emily Davis",
      EmployeeEmail: "emily.davis@company.com",
      Department: "Marketing",
      Year: 2025,
      Broughtforward: 3,
      Annual: 20,
      AnnualUsed: 12,
      Forfeited: 0,
      Annual_leave_adjustments: 0,
      SickUsed: 4,
      FamilyUsed: 1,
      StudyUsed: 2,
      Current_leave_balance: 11,
      Manager: "sarah.johnson@company.com"
    }
  ]);

  const handleEditBalance = (balance: EmployeeBalance) => {
    setSelectedBalance({ ...balance });
    setShowEditDialog(true);
  };

  const handleSaveBalance = () => {
    if (!selectedBalance) return;

    // Calculate new current balance
    const newCurrentBalance = 
      selectedBalance.Broughtforward + 
      selectedBalance.Annual - 
      selectedBalance.AnnualUsed - 
      selectedBalance.Forfeited - 
      selectedBalance.Annual_leave_adjustments;

    const updatedBalance = {
      ...selectedBalance,
      Current_leave_balance: Number(newCurrentBalance.toFixed(1))
    };

    setBalances(prev => prev.map(b => 
      b.BalanceID === updatedBalance.BalanceID ? updatedBalance : b
    ));

    console.log('Balance updated:', updatedBalance);
    console.log('Adjustment comment:', adjustmentComment);

    toast({
      title: "Balance Updated",
      description: `${selectedBalance.EmployeeName}'s leave balance has been updated.`,
    });

    setShowEditDialog(false);
    setSelectedBalance(null);
    setAdjustmentComment("");
  };

  const handleFieldChange = (field: keyof EmployeeBalance, value: string) => {
    if (!selectedBalance) return;
    
    const numericValue = parseFloat(value) || 0;
    setSelectedBalance(prev => prev ? {
      ...prev,
      [field]: numericValue
    } : null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Leave Balances</h2>
          <p className="text-gray-600">View and manage employee leave balances</p>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add New Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Year Balances (2025)</CardTitle>
          <CardDescription>
            Annual leave balance = Brought forward + Annual (1.6667/month) - Used - Forfeited - Adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Brought Forward</TableHead>
                <TableHead>Annual Allocated</TableHead>
                <TableHead>Annual Used</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Sick Used</TableHead>
                <TableHead>Family Used</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>{balance.Broughtforward}</TableCell>
                  <TableCell>{balance.Annual}</TableCell>
                  <TableCell>{balance.AnnualUsed}</TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {balance.Current_leave_balance}
                  </TableCell>
                  <TableCell>{balance.SickUsed}</TableCell>
                  <TableCell>{balance.FamilyUsed}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditBalance(balance)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Leave Balance</DialogTitle>
            <DialogDescription>
              Modify the leave balance for {selectedBalance?.EmployeeName}
            </DialogDescription>
          </DialogHeader>

          {selectedBalance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brought Forward</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedBalance.Broughtforward}
                    onChange={(e) => handleFieldChange('Broughtforward', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Allocated</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedBalance.Annual}
                    onChange={(e) => handleFieldChange('Annual', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Used</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedBalance.AnnualUsed}
                    onChange={(e) => handleFieldChange('AnnualUsed', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forfeited</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedBalance.Forfeited}
                    onChange={(e) => handleFieldChange('Forfeited', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Leave Adjustments</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedBalance.Annual_leave_adjustments}
                    onChange={(e) => handleFieldChange('Annual_leave_adjustments', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sick Used</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedBalance.SickUsed}
                    onChange={(e) => handleFieldChange('SickUsed', e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Calculated Balance</h4>
                <p className="text-blue-700">
                  Current Balance: {(
                    selectedBalance.Broughtforward + 
                    selectedBalance.Annual - 
                    selectedBalance.AnnualUsed - 
                    selectedBalance.Forfeited - 
                    selectedBalance.Annual_leave_adjustments
                  ).toFixed(1)} days
                </p>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Comment</Label>
                <Textarea
                  placeholder="Reason for balance adjustment..."
                  value={adjustmentComment}
                  onChange={(e) => setAdjustmentComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBalance}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
