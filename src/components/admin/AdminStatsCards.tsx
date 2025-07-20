
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar as CalendarIcon, Database, Settings } from "lucide-react";
import { apiConfig } from "@/config/apiConfig";

export const AdminStatsCards = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeRequests: 0,
    monthlyRequests: 0,
    departments: 0
  });

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchStats = async () => {
    try {
      // Fetch employee count from balances
      const balanceResponse = await fetch(`${apiConfig.endpoints.balance}`, {
        headers: getAuthHeaders()
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        const uniqueDepartments = [...new Set(balanceData.map(b => b.Department))];
        
        setStats(prev => ({
          ...prev,
          totalEmployees: balanceData.length,
          departments: uniqueDepartments.length
        }));
      }

      // Fetch requests data
      const requestsResponse = await fetch(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const activeRequests = requestsData.filter(r => r.Status === 'pending').length;
        const monthlyRequests = requestsData.filter(r => {
          const requestDate = new Date(r.Created);
          return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
        }).length;

        setStats(prev => ({
          ...prev,
          activeRequests,
          monthlyRequests
        }));
      }

    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRequests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Database className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyRequests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.departments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
