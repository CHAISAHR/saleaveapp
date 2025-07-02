
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit } from "lucide-react";

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

interface AdminAllBalancesTableProps {
  balances: EmployeeBalance[];
  calculateCurrentBalance: (balance: EmployeeBalance) => number;
  calculateTerminationBalance: (balance: EmployeeBalance) => number | null;
  getEmployeeStatus: (balance: EmployeeBalance) => string;
  onForfeitedChange: (balanceId: number, value: string) => void;
  onDepartmentChange: (balanceId: number, value: string) => void;
  onManagerChange: (balanceId: number, value: string) => void;
  onEdit: (balance: EmployeeBalance) => void;
}

export const AdminAllBalancesTable = ({
  balances,
  calculateCurrentBalance,
  calculateTerminationBalance,
  getEmployeeStatus,
  onForfeitedChange,
  onDepartmentChange,
  onManagerChange,
  onEdit
}: AdminAllBalancesTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Leave Balances</CardTitle>
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
                <TableHead>Wellness</TableHead>
                <TableHead>Wellness Used</TableHead>
                <TableHead>PowerApps ID</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Previous Month</TableHead>
                <TableHead>Contract Term Date</TableHead>
                <TableHead>Termination Balance</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Adjustment Comments</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => (
                <TableRow key={balance.BalanceID}>
                  <TableCell className="font-medium">{balance.BalanceID}</TableCell>
                  <TableCell>{balance.EmployeeName}</TableCell>
                  <TableCell>{balance.EmployeeEmail}</TableCell>
                  <TableCell>
                    <Input
                      value={balance.Department}
                      onChange={(e) => onDepartmentChange(balance.BalanceID, e.target.value)}
                      className="w-24 h-8 text-sm"
                      placeholder="Dept"
                    />
                  </TableCell>
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
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={balance.Forfeited}
                      onChange={(e) => onForfeitedChange(balance.BalanceID, e.target.value)}
                      className="w-20 h-8 text-sm"
                    />
                  </TableCell>
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
                  <TableCell>{balance.Wellness}</TableCell>
                  <TableCell>{balance.WellnessUsed}</TableCell>
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
                    <Input
                      value={balance.Manager}
                      onChange={(e) => onManagerChange(balance.BalanceID, e.target.value)}
                      className="w-32 h-8 text-sm"
                      placeholder="Manager email"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(balance)}
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
  );
};
