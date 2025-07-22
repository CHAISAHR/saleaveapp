
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeaveBalanceGrid } from "@/components/LeaveBalanceGrid";
import { LeaveStatsCards } from "@/components/LeaveStatsCards";
import { LeaveRequestsList } from "@/components/LeaveRequestsList";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";
import { useToast } from "@/hooks/use-toast";

interface EmployeeDashboardProps {
  onNewRequest: () => void;
  currentUser: any;
  activeView?: 'requests' | 'balance';
}

export const EmployeeDashboard = ({
  onNewRequest,
  currentUser,
  activeView = 'requests'
}: EmployeeDashboardProps) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await makeApiRequest(`${apiConfig.endpoints.leave}/requests`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        console.log('Current user email:', currentUser.email);
        
        // Ensure data is an array - handle both direct array and wrapped response
        const dataArray = Array.isArray(data) ? data : (data.requests || data.data || []);
        console.log('Data array:', dataArray);
        
        const userRequests = dataArray.filter((request: any) => 
          request.Requester === currentUser.email
        );
        console.log('Filtered user requests:', userRequests);
        
        // Transform API data to match component expectations
        const transformedRequests = userRequests.map((request: any) => ({
          id: request.LeaveID,
          title: request.Title,
          type: request.LeaveType,
          startDate: new Date(request.StartDate).toLocaleDateString(),
          endDate: new Date(request.EndDate).toLocaleDateString(),
          days: request.workingDays,
          status: request.Status,
          submittedDate: new Date(request.Created).toLocaleDateString(),
          description: request.Detail
        }));
        
        console.log('Transformed requests:', transformedRequests);
        setLeaveRequests(transformedRequests);
      } else {
        console.error('Failed to fetch leave requests');
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [currentUser.email]);

  if (activeView === 'balance') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leave Balance</h2>
            <p className="text-gray-600">Track your available leave days</p>
          </div>
          <Button onClick={onNewRequest} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        <LeaveBalanceGrid userEmail={currentUser.email} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Leave Requests</h2>
            <p className="text-gray-600">Manage and track your leave applications</p>
          </div>
          <Button onClick={onNewRequest} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Leave Requests</h2>
          <p className="text-gray-600">Manage and track your leave applications</p>
        </div>
        <Button onClick={onNewRequest} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <LeaveStatsCards leaveRequests={leaveRequests} />
      <LeaveRequestsList leaveRequests={leaveRequests} />
    </div>
  );
};
