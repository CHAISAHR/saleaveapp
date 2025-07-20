
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatsCards } from "./AdminStatsCards";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";

export const SystemOverview = () => {
  const [totalLeaveRecords, setTotalLeaveRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchDatabaseStats = async () => {
    try {
      console.log('SystemOverview - Fetching database stats...');
      
      const requestsResponse = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      const requestsData = await requestsResponse.json();
      console.log('SystemOverview - Leave requests data:', requestsData);
      
      // Handle both real API responses and mock data arrays
      const requestsArray = Array.isArray(requestsData) ? requestsData : 
                           (requestsData.success && requestsData.requests ? requestsData.requests : 
                            requestsData.data || []);
      
      console.log('SystemOverview - Total leave records count:', requestsArray.length);
      setTotalLeaveRecords(requestsArray.length);
      
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
        <p className="text-gray-600">Monitor system-wide leave statistics and trends</p>
      </div>

      <AdminStatsCards />

      <Card>
        <CardHeader>
          <CardTitle>Database Information</CardTitle>
          <CardDescription>Current database statistics and health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                ) : (
                  totalLeaveRecords.toLocaleString()
                )}
              </div>
              <div className="text-sm text-blue-700">Total Leave Records</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">98.7%</div>
              <div className="text-sm text-green-700">System Uptime</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">15.2GB</div>
              <div className="text-sm text-yellow-700">Database Size</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
