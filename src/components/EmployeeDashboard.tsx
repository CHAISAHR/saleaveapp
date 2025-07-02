
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeaveBalanceGrid } from "@/components/LeaveBalanceGrid";
import { LeaveStatsCards } from "@/components/LeaveStatsCards";
import { LeaveRequestsList } from "@/components/LeaveRequestsList";

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
  // Sample leave balances with correct units
  const leaveBalances = [{
    type: 'Annual',
    used: 8,
    total: 20,
    accrued: 12.5,
    unit: 'days',
    broughtForward: 5,
    balance: 9.5 // Calculated balance: broughtForward + accrued - used
  }, {
    type: 'Sick',
    used: 3,
    total: 36,
    accrued: 36,
    unit: 'days',
    balance: 33
  }, {
    type: 'Maternity',
    used: 0,
    total: 3,
    accrued: 3,
    unit: 'months',
    balance: 3
  }, {
    type: 'Parental',
    used: 0,
    total: 4,
    accrued: 4,
    unit: 'weeks',
    balance: 4
  }, {
    type: 'Family',
    used: 1,
    total: 3,
    accrued: 3,
    unit: 'days',
    balance: 2
  }, {
    type: 'Adoption',
    used: 0,
    total: 4,
    accrued: 4,
    unit: 'weeks',
    balance: 4
  }, {
    type: 'Study',
    used: 2,
    total: 6,
    accrued: 6,
    unit: 'days',
    balance: 4
  }, {
    type: 'Wellness',
    used: 0,
    total: 2,
    accrued: 2,
    unit: 'days',
    balance: 2
  }];

  // Sample leave requests
  const leaveRequests = [{
    id: 1,
    title: "Family Vacation",
    type: "Annual",
    startDate: "2024-07-15",
    endDate: "2024-07-19",
    days: 5,
    status: "approved",
    submittedDate: "2024-06-15",
    description: "Summer vacation with family"
  }, {
    id: 2,
    title: "Medical Appointment",
    type: "Sick",
    startDate: "2024-06-20",
    endDate: "2024-06-20",
    days: 1,
    status: "pending",
    submittedDate: "2024-06-18",
    description: "Regular health check-up"
  }, {
    id: 3,
    title: "Conference Attendance",
    type: "Study",
    startDate: "2024-08-10",
    endDate: "2024-08-12",
    days: 3,
    status: "rejected",
    submittedDate: "2024-06-10",
    description: "Professional development conference"
  }];

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

        <LeaveBalanceGrid leaveBalances={leaveBalances} />
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
