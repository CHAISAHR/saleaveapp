
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar as CalendarIcon, Database, Settings } from "lucide-react";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";

export const AdminStatsCards = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRequests: 0,
    monthlyRequests: 0,
    departments: 0
  });

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      console.error('[AdminStatsCards] No auth token found');
      return null;
    }
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchStats = async () => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      console.error('[AdminStatsCards] Cannot get auth headers, skipping stats fetch');
      return;
    }

    try {
      console.log('AdminStatsCards - Starting to fetch stats...');
      
      // Fetch user count from users endpoint (authoritative source)
      try {
        console.log('AdminStatsCards - Fetching users data from:', `${apiConfig.endpoints.users}`);
        const usersResponse = await makeApiRequest(`${apiConfig.endpoints.users}`, {
          headers: authHeaders
        });
        
        const usersData = await usersResponse.json();
        console.log('AdminStatsCards - Users response:', usersData);
        
        const usersArray = Array.isArray(usersData) ? usersData : 
                         (usersData.success && usersData.users ? usersData.users : 
                          usersData.data || []);
        
        console.log('AdminStatsCards - Users array:', usersArray);
        console.log('AdminStatsCards - Users count:', usersArray.length);
        
        if (usersArray.length > 0) {
          console.log('AdminStatsCards - Sample user record:', usersArray[0]);
          
          const userDepartments = usersArray.map(u => 
            u.Department || u.department || u.dept || null
          ).filter(dept => dept && dept !== 'Unknown' && dept.trim() !== '');
          
          const uniqueUserDepartments = [...new Set(userDepartments)];
          
          console.log('AdminStatsCards - User departments:', userDepartments);
          console.log('AdminStatsCards - Unique departments:', uniqueUserDepartments);
          
          setStats(prev => ({
            ...prev,
            totalUsers: usersArray.length,
            departments: uniqueUserDepartments.length
          }));
          
          console.log('AdminStatsCards - Set users:', usersArray.length, 'departments:', uniqueUserDepartments.length);
        }
        
      } catch (usersError) {
        console.error('AdminStatsCards - Error fetching users data:', usersError);
        // Fallback to balance data for user count
        console.log('AdminStatsCards - Trying balance endpoint as fallback...');
        
        try {
          const balanceResponse = await makeApiRequest(`${apiConfig.endpoints.balance}`, {
            headers: authHeaders
          });
          
          const balanceData = await balanceResponse.json();
          console.log('AdminStatsCards - Balance fallback data:', balanceData);
          
          const balanceArray = Array.isArray(balanceData) ? balanceData : 
                              (balanceData.success && balanceData.data ? balanceData.data : 
                               balanceData.data || balanceData.balances || []);
          
          console.log('AdminStatsCards - Balance array from fallback:', balanceArray);
          
          if (balanceArray.length > 0) {
            const departments = balanceArray.map(b => {
              const dept = b.Department || b.department || b.dept || b.Department_Name || b.departmentName || null;
              return dept;
            }).filter(dept => dept && dept !== 'Unknown' && dept.trim() !== '');
            
            const uniqueDepartments = [...new Set(departments)];
            
            setStats(prev => ({
              ...prev,
              totalUsers: balanceArray.length,
              departments: uniqueDepartments.length
            }));
            
            console.log('AdminStatsCards - Fallback: Set users:', balanceArray.length, 'departments:', uniqueDepartments.length);
          }
        } catch (balanceError) {
          console.error('AdminStatsCards - Balance fallback also failed:', balanceError);
        }
      }

      // Fetch requests data
      const requestsResponse = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: authHeaders
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
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
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
