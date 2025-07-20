
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar as CalendarIcon, Database, Settings } from "lucide-react";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";

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
      console.log('AdminStatsCards - Starting to fetch stats...');
      
      // Fetch employee count from balances
      const balanceResponse = await makeApiRequest(`${apiConfig.endpoints.balance}`, {
        headers: getAuthHeaders()
      });

      const balanceData = await balanceResponse.json();
      console.log('AdminStatsCards - Balance response:', balanceData);
      
      // Handle both real API responses and mock data arrays
      const balanceArray = Array.isArray(balanceData) ? balanceData : 
                          (balanceData.success && balanceData.data ? balanceData.data : 
                           balanceData.data || []);
      
      console.log('AdminStatsCards - Balance array:', balanceArray);
      
      // Handle different field naming conventions for department
      const uniqueDepartments = [...new Set(balanceArray.map(b => 
        b.Department || b.department || 'Unknown'
      ).filter(dept => dept !== 'Unknown'))];
      
      console.log('AdminStatsCards - Unique departments:', uniqueDepartments);
      
      setStats(prev => ({
        ...prev,
        totalEmployees: balanceArray.length,
        departments: uniqueDepartments.length
      }));

      // Fetch requests data
      const requestsResponse = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      const requestsData = await requestsResponse.json();
      console.log('AdminStatsCards - Requests response:', requestsData);
      
      // Handle both real API responses and mock data arrays
      const requestsArray = Array.isArray(requestsData) ? requestsData : 
                           (requestsData.success && requestsData.requests ? requestsData.requests : 
                            requestsData.data || []);
      
      console.log('AdminStatsCards - Requests array:', requestsArray);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Handle different status and date field naming conventions
      const activeRequests = requestsArray.filter(r => {
        const status = (r.Status || r.status || '').toLowerCase();
        return status === 'pending';
      }).length;
      
      const monthlyRequests = requestsArray.filter(r => {
        // Handle different date field names
        const dateField = r.Created || r.SubmissionDate || r.submission_date || r.created_at;
        if (!dateField) return false;
        
        const requestDate = new Date(dateField);
        return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
      }).length;

      console.log('AdminStatsCards - Active requests:', activeRequests);
      console.log('AdminStatsCards - Monthly requests:', monthlyRequests);

      setStats(prev => ({
        ...prev,
        activeRequests,
        monthlyRequests
      }));

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
