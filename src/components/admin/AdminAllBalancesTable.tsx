
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { BalanceCalculations } from "@/services/balance/balanceCalculations";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";

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
  Start_date?: string;
  start_date?: string;
  Comment?: string;
  Annual_leave_adjustment_comments?: string;
  Manager: string;
  Modified: string;
}

interface AdminAllBalancesTableProps {
  balances: EmployeeBalance[];
  totalBalances?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onFirst: () => void;
    onLast: () => void;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  sorting?: {
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: string) => void;
  };
  calculateCurrentBalance: (balance: EmployeeBalance) => number;
  calculateTerminationBalance: (balance: EmployeeBalance) => number | null;
  getEmployeeStatus: (balance: EmployeeBalance) => string;
  onForfeitedChange: (balanceId: number, value: string) => void;
  onDepartmentChange: (balanceId: number, value: string) => void;
  onManagerChange: (balanceId: number, value: string) => void;
  onEdit: (balance: EmployeeBalance) => void;
  onDelete: (balance: EmployeeBalance) => void;
}

export const AdminAllBalancesTable = ({
  balances,
  totalBalances,
  pagination,
  sorting,
  calculateCurrentBalance,
  calculateTerminationBalance,
  getEmployeeStatus,
  onForfeitedChange,
  onDepartmentChange,
  onManagerChange,
  onEdit,
  onDelete
}: AdminAllBalancesTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Leave Balances</CardTitle>
        {pagination && totalBalances && (
          <p className="text-sm text-muted-foreground">
            Showing {pagination.startIndex}-{pagination.endIndex} of {totalBalances} employees
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead 
                  sortKey="BalanceID" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Balance ID
                </SortableTableHead>
                <SortableTableHead 
                  sortKey="EmployeeName" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Employee Name
                </SortableTableHead>
                <SortableTableHead 
                  sortKey="EmployeeEmail" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Employee Email
                </SortableTableHead>
                <SortableTableHead 
                  sortKey="Department" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Department
                </SortableTableHead>
                <SortableTableHead 
                  sortKey="Status" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Status
                </SortableTableHead>
                <SortableTableHead 
                  sortKey="Year" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Year
                </SortableTableHead>
                <SortableTableHead 
                  sortKey="Broughtforward" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Brought Forward
                </SortableTableHead>
                <SortableTableHead 
                  sortKey="Annual" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Annual
                </SortableTableHead>
                <TableHead>Accumulated Leave</TableHead>
                <SortableTableHead 
                  sortKey="AnnualUsed" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Annual Used
                </SortableTableHead>
                <TableHead>Forfeited</TableHead>
                <SortableTableHead 
                  sortKey="Annual_leave_adjustments" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Annual Adjustments
                </SortableTableHead>
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
                <TableHead>Current Balance</TableHead>
                <TableHead>Previous Month</TableHead>
                <SortableTableHead 
                  sortKey="Contract_termination_date" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Contract Term Date
                </SortableTableHead>
                <TableHead>Termination Balance</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Adjustment Comments</TableHead>
                <SortableTableHead 
                  sortKey="Manager" 
                  currentSortKey={sorting?.sortConfig?.key} 
                  currentSortDirection={sorting?.sortConfig?.direction} 
                  onSort={sorting?.onSort || (() => {})}
                >
                  Manager
                </SortableTableHead>
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
                  <TableCell>{Number(balance.Broughtforward).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Annual).toFixed(3)}</TableCell>
                   <TableCell className="font-medium text-purple-600">
                     {BalanceCalculations.calculateAccumulatedLeave(new Date(), balance.Contract_termination_date, balance.Start_date || balance.start_date).toFixed(3)}
                   </TableCell>
                  <TableCell>{Number(balance.AnnualUsed).toFixed(3)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={balance.Forfeited}
                      onChange={(e) => onForfeitedChange(balance.BalanceID, e.target.value)}
                      className="w-20 h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>{Number(balance.Annual_leave_adjustments).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.SickBroughtforward).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Sick).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.SickUsed).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Maternity).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.MaternityUsed).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Parental).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.ParentalUsed).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Family).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.FamilyUsed).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Adoption).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.AdoptionUsed).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Study).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.StudyUsed).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.Wellness).toFixed(3)}</TableCell>
                  <TableCell>{Number(balance.WellnessUsed).toFixed(3)}</TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {calculateCurrentBalance(balance).toFixed(3)}
                  </TableCell>
                  <TableCell>{Number(balance.Leave_balance_previous_month).toFixed(3)}</TableCell>
                  <TableCell>
                    {balance.Contract_termination_date ? 
                      new Date(balance.Contract_termination_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="font-medium text-orange-600">
                    {calculateTerminationBalance(balance)?.toFixed(3) || '-'}
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
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => onEdit(balance)}
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => onDelete(balance)}
                         className="text-destructive hover:text-destructive"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {pagination && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              totalItems={pagination.totalItems}
              onPageChange={pagination.onPageChange}
              onFirst={pagination.onFirst}
              onLast={pagination.onLast}
              onNext={pagination.onNext}
              onPrevious={pagination.onPrevious}
              hasNext={pagination.hasNext}
              hasPrevious={pagination.hasPrevious}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
