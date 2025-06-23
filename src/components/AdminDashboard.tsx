
import { AdminBalanceManager } from "./AdminBalanceManager";
import { AdminCharts } from "./admin/AdminCharts";
import { CurrentlyOnLeaveTable } from "./admin/CurrentlyOnLeaveTable";
import { HolidayManagement } from "./admin/HolidayManagement";
import { SystemOverview } from "./admin/SystemOverview";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  currentUser: any;
  activeView?: 'dashboard' | 'system' | 'admin' | 'balances';
  onViewChange?: (view: 'dashboard' | 'system' | 'admin' | 'balances') => void;
}

export const AdminDashboard = ({ currentUser, activeView = 'dashboard', onViewChange }: AdminDashboardProps) => {
  const { toast } = useToast();

  const handleQuickAction = (action: string) => {
    if (onViewChange) {
      switch (action) {
        case 'holidays':
          onViewChange('admin');
          break;
        case 'users':
          // Navigate to user management - placeholder for now
          toast({
            title: "User Management",
            description: "User management feature coming soon.",
          });
          break;
        case 'database':
          onViewChange('system');
          break;
        default:
          break;
      }
    }
  };

  if (activeView === 'balances') {
    return <AdminBalanceManager />;
  }

  if (activeView === 'system') {
    return <SystemOverview />;
  }

  if (activeView === 'admin') {
    return <HolidayManagement />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">System administration and analytics</p>
      </div>

      {/* Charts Grid */}
      <AdminCharts />

      {/* Staff Currently on Leave Table */}
      <CurrentlyOnLeaveTable />
    </div>
  );
};
