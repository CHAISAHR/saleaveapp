
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon } from "lucide-react";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";

export const CurrentlyOnLeaveTable = () => {
  const [currentlyOnLeave, setCurrentlyOnLeave] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchCurrentlyOnLeave = async () => {
    try {
      const response = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      const requestsData = await response.json();
      console.log('CurrentlyOnLeave - Raw data:', requestsData);
      
      // Handle both real API responses and mock data arrays
      const requestsArray = Array.isArray(requestsData) ? requestsData : 
                           (requestsData.success && requestsData.requests ? requestsData.requests : 
                            requestsData.data || []);
      
      console.log('CurrentlyOnLeave - Requests array:', requestsArray);
      
      const today = new Date();
      
      // Filter for approved requests that are currently active
      const activeLeave = requestsArray.filter(request => {
        const startDate = new Date(request.StartDate || request.startDate);
        const endDate = new Date(request.EndDate || request.endDate);
        const status = request.Status || request.status;
        return status === 'approved' && 
               startDate <= today && 
               endDate >= today;
      });

      console.log('CurrentlyOnLeave - Active leave:', activeLeave);

      // Calculate days remaining for each
      const leaveWithDaysRemaining = activeLeave.map(leave => {
        const endDate = new Date(leave.EndDate || leave.endDate);
        const todayTime = today.getTime();
        const endTime = endDate.getTime();
        const daysRemaining = Math.ceil((endTime - todayTime) / (1000 * 60 * 60 * 24));
        
        return {
          ...leave,
          daysRemaining: Math.max(0, daysRemaining),
          employeeName: leave.EmployeeName || leave.employeeName || leave.Requester || leave.requester,
          leaveType: leave.LeaveType || leave.leaveType,
          startDate: leave.StartDate || leave.startDate,
          endDate: leave.EndDate || leave.endDate
        };
      });

      console.log('CurrentlyOnLeave - Final data:', leaveWithDaysRemaining);
      setCurrentlyOnLeave(leaveWithDaysRemaining);
    } catch (error) {
      console.error('Error fetching currently on leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentlyOnLeave();
  }, []);

  if (loading) {
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
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leave data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <span>Staff Currently on Leave</span>
        </CardTitle>
        <CardDescription>Employees currently on approved leave today ({currentlyOnLeave.length})</CardDescription>
      </CardHeader>
      <CardContent>
        {currentlyOnLeave.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No staff currently on leave</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentlyOnLeave.map((staff) => (
                  <TableRow key={staff.LeaveID}>
                    <TableCell className="font-medium">{staff.Requester}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {staff.LeaveType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(staff.StartDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(staff.EndDate).toLocaleDateString()}
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
        )}
      </CardContent>
    </Card>
  );
};
