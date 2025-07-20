
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiConfig, makeApiRequest } from "@/config/apiConfig";

interface DepartmentStats {
  department: string;
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
  const [departmentData, setDepartmentData] = useState<DepartmentStats[]>([]);
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

      // Fetch balance data for department info
      const balanceResponse = await makeApiRequest(`${apiConfig.endpoints.balance}`, {
        headers: getAuthHeaders()
      });

      if (requestsResponse.ok && balanceResponse.ok) {
        const requestsData = await requestsResponse.json();
        const balanceData = await balanceResponse.json();

        // Create department mapping
        const departmentMap = {};
        balanceData.forEach(balance => {
          departmentMap[balance.EmployeeEmail] = balance.Department;
        });

        // Group requests by department and status
        const departmentStats: Record<string, DepartmentStats> = {};
        
        requestsData.forEach((request: any) => {
          const department = departmentMap[request.Requester] || 'Unknown';
          
          if (!departmentStats[department]) {
            departmentStats[department] = {
              department,
              pending: 0,
              approved: 0,
              rejected: 0
            };
          }
          
          departmentStats[department][request.Status as keyof Omit<DepartmentStats, 'department'>]++;
        });

        const departmentArray = Object.values(departmentStats);
        setDepartmentData(departmentArray);

        // Create pie chart data for pending requests
        const pendingData: PendingData[] = departmentArray
          .filter((dept: DepartmentStats) => dept.pending > 0)
          .map((dept: DepartmentStats, index: number) => ({
            name: dept.department,
            value: dept.pending,
            color: colors[index % colors.length]
          }));

        setPendingLeavesByDepartment(pendingData);
      }
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

      {/* Department Status - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Department Status</span>
          </CardTitle>
          <CardDescription>Leave requests status by department</CardDescription>
        </CardHeader>
        <CardContent>
          {departmentData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No department data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pending" fill="#ffc658" />
                  <Bar dataKey="approved" fill="#82ca9d" />
                  <Bar dataKey="rejected" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
