
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { apiConfig, makeApiRequest } from "@/config/apiConfig";

interface DepartmentStats {
  department: string;
  pending: number;
  approved: number;
  rejected: number;
}

interface TimeSeriesData {
  date: string;
  pending: number;
  approved: number;
  rejected: number;
}

interface PendingData {
  name: string;
  value: number;
  color: string;
}

export const AdminCharts = () => {
  const [pendingLeavesByDepartment, setPendingLeavesByDepartment] = useState<PendingData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchChartData = async () => {
    try {
      // Fetch requests data
      const requestsResponse = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      // Fetch users data for department info
      const usersResponse = await makeApiRequest(`${apiConfig.endpoints.users}`, {
        headers: getAuthHeaders()
      });

      const requestsData = await requestsResponse.json();
      const usersData = await usersResponse.json();

      console.log('AdminCharts - Requests data:', requestsData);
      console.log('AdminCharts - Users data:', usersData);

      // Handle both real API responses and mock data arrays
      const requestsArray = Array.isArray(requestsData) ? requestsData : 
                           (requestsData.success && requestsData.requests ? requestsData.requests : 
                            requestsData.data || []);
      const usersArray = Array.isArray(usersData) ? usersData : 
                        (usersData.success && usersData.data ? usersData.data : 
                         usersData.data || []);

        // Create department mapping from users table
        const departmentMap = {};
        usersArray.forEach(user => {
          // Handle different field naming conventions
          const email = user.email || user.Email || user.EmployeeEmail;
          const department = user.department || user.Department;
          if (email && department) {
            departmentMap[email] = department;
          }
        });

        // Group requests by department for pie chart
        const departmentStats: Record<string, DepartmentStats> = {};
        
        requestsArray.forEach((request: any) => {
          const department = departmentMap[request.Requester] || 'Unknown';
          
          if (!departmentStats[department]) {
            departmentStats[department] = {
              department,
              pending: 0,
              approved: 0,
              rejected: 0
            };
          }
          
          if (request.Status === 'pending') {
            departmentStats[department].pending++;
          }
        });

        // Create time series data by grouping requests by month from beginning of year
        const timeStats: Record<string, TimeSeriesData> = {};
        const currentYear = new Date().getFullYear();
        
        // Initialize all months from January to current month
        for (let month = 0; month < 12; month++) {
          const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
          const monthName = new Date(currentYear, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          timeStats[monthKey] = {
            date: monthName,
            pending: 0,
            approved: 0,
            rejected: 0
          };
        }
        
        requestsArray.forEach((request: any) => {
          // Extract date from submission timestamp - handle different date formats
          const submissionDate = request.SubmissionDate || request.submission_date || request.created_at;
          if (!submissionDate) return;
          
          const date = new Date(submissionDate);
          if (date.getFullYear() !== currentYear) return; // Only current year data
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (timeStats[monthKey]) {
            const status = request.Status?.toLowerCase() || 'pending';
            if (status === 'pending' || status === 'approved' || status === 'rejected') {
              timeStats[monthKey][status as keyof Omit<TimeSeriesData, 'date'>]++;
            }
          }
        });

        // Get monthly data in chronological order, only up to current month
        const currentMonth = new Date().getMonth();
        const sortedTimeData = Object.keys(timeStats)
          .sort()
          .slice(0, currentMonth + 1) // Only show months up to current month
          .map(key => timeStats[key]);
        
        setTimeSeriesData(sortedTimeData);

        // Create pie chart data for pending requests by department
        const pendingData: PendingData[] = Object.values(departmentStats)
          .filter((dept: DepartmentStats) => dept.pending > 0)
          .map((dept: DepartmentStats, index: number) => ({
            name: dept.department,
            value: dept.pending,
            color: colors[index % colors.length]
          }));

        setPendingLeavesByDepartment(pendingData);
        
        console.log('AdminCharts - Final pending by department data:', pendingData);
        console.log('AdminCharts - Final time series data:', sortedTimeData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Charts...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loading Charts...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Leaves by Department - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Pending Leaves by Department</span>
          </CardTitle>
          <CardDescription>Current pending leave requests breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingLeavesByDepartment.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No pending requests by department</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pendingLeavesByDepartment}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pendingLeavesByDepartment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Status Over Time - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Leave Status Over Time</span>
          </CardTitle>
          <CardDescription>Monthly leave request trends from beginning of year</CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No time series data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    name="Pending"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Approved"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rejected" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                    name="Rejected"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
