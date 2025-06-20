
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon } from "lucide-react";

const currentlyOnLeaveData = [
  { id: 1, employee: 'John Smith', department: 'Ops', type: 'Annual', startDate: '2024-06-10', endDate: '2024-06-20', daysRemaining: 3 },
  { id: 2, employee: 'Sarah Wilson', department: 'Ops', type: 'Sick', startDate: '2024-06-15', endDate: '2024-06-17', daysRemaining: 1 },
  { id: 3, employee: 'Mike Johnson', department: 'Finance', type: 'Study', startDate: '2024-06-12', endDate: '2024-06-19', daysRemaining: 2 },
  { id: 4, employee: 'Lisa Chen', department: 'AT', type: 'Family', startDate: '2024-06-16', endDate: '2024-06-16', daysRemaining: 0 },
  { id: 5, employee: 'David Brown', department: 'TB', type: 'Annual', startDate: '2024-06-14', endDate: '2024-06-21', daysRemaining: 4 },
];

export const CurrentlyOnLeaveTable = () => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <span>Staff Currently on Leave</span>
        </CardTitle>
        <CardDescription>Employees currently on approved leave today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentlyOnLeaveData.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.employee}</TableCell>
                  <TableCell>{staff.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {staff.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(staff.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(staff.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={staff.daysRemaining === 0 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {staff.daysRemaining} days
                    </Badge>
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
