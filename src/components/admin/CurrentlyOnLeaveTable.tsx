
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
      // Fetch both leave requests and users data
      const [requestsResponse, usersResponse] = await Promise.all([
        makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
          headers: getAuthHeaders()
        }),
        makeApiRequest(`${apiConfig.endpoints.users}`, {
          headers: getAuthHeaders()
        })
      ]);

      const requestsData = await requestsResponse.json();
      const usersData = await usersResponse.json();
      
      console.log('CurrentlyOnLeave - Raw requests data:', requestsData);
      console.log('CurrentlyOnLeave - Raw users data:', usersData);
      
      // Handle both real API responses and mock data arrays
      const requestsArray = Array.isArray(requestsData) ? requestsData : 
                           (requestsData.success && requestsData.requests ? requestsData.requests : 
                            requestsData.data || []);
      
      const usersArray = Array.isArray(usersData) ? usersData : 
                        (usersData.success && usersData.data ? usersData.data : 
                         usersData.data || []);
      
      // Create email to name mapping
      const emailToNameMap = {};
      usersArray.forEach(user => {
        const email = user.email || user.Email;
        const name = user.name || user.Name;
        if (email && name) {
          emailToNameMap[email] = name;
        }
      });
      
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
        // Simple date difference calculation: (endDate - todayDate) + 1
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const daysDifference = Math.floor((endDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = daysDifference + 1;
        const requesterEmail = leave.Requester || leave.requester;
        
        return {
          ...leave,
          daysRemaining: Math.max(0, daysRemaining),
          employeeName: emailToNameMap[requesterEmail] || requesterEmail,
          employeeEmail: requesterEmail,
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
                {currentlyOnLeave.map((staff) => {
                  // Function to get leave type color
                  const getLeaveTypeVariant = (leaveType) => {
                    switch (leaveType?.toLowerCase()) {
                      case 'annual leave':
                      case 'annual':
                        return 'default';
                      case 'sick leave':
                      case 'sick':
                        return 'destructive';
                      case 'maternity leave':
                      case 'maternity':
                        return 'secondary';
                      case 'parental leave':
                      case 'parental':
                        return 'outline';
                      case 'study leave':
                      case 'study':
                        return 'default';
                      case 'family responsibility':
                      case 'family':
                        return 'secondary';
                      default:
                        return 'outline';
                    }
                  };

                  // Function to get days remaining color
                  const getDaysRemainingVariant = (days) => {
                    if (days === 0) return 'destructive';
                    if (days <= 3) return 'secondary';
                    return 'default';
                  };

                  return (
                    <TableRow key={staff.LeaveID || staff.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{staff.employeeName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getLeaveTypeVariant(staff.leaveType)}
                          className="text-xs font-medium animate-fade-in"
                        >
                          {staff.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(staff.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(staff.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getDaysRemainingVariant(staff.daysRemaining)}
                          className="text-xs font-medium animate-fade-in hover-scale"
                        >
                          {staff.daysRemaining} {staff.daysRemaining === 1 ? 'day' : 'days'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
