import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminAllRequests } from "@/components/AdminAllRequests";
import { AdminAllBalances } from "@/components/AdminAllBalances";
import { AdminPanel } from "@/components/AdminPanel";
import { HolidayCalendar } from "@/components/HolidayCalendar";
import { PolicyGuide } from "@/components/PolicyGuide";

interface MainContentProps {
  activeTab: string;
  userRole: 'employee' | 'manager' | 'admin';
  currentUser: any;
  onNewRequest: () => void;
}

export const MainContent = ({ activeTab, userRole, currentUser, onNewRequest }: MainContentProps) => {
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return userRole === 'employee' ? (
          <EmployeeDashboard onNewRequest={onNewRequest} currentUser={currentUser} />
        ) : userRole === 'manager' ? (
          <ManagerDashboard currentUser={currentUser} />
        ) : (
          <AdminDashboard currentUser={currentUser} />
        );

      case 'balance':
        return userRole === 'employee' ? (
          <EmployeeDashboard onNewRequest={onNewRequest} currentUser={currentUser} activeView="balance" />
        ) : userRole === 'manager' ? (
          <ManagerDashboard currentUser={currentUser} activeView="balance" />
        ) : (
          <AdminDashboard currentUser={currentUser} activeView="balances" />
        );

      case 'all-requests':
        return userRole === 'admin' ? <AdminAllRequests /> : null;

      case 'all-balances':
        return userRole === 'admin' ? <AdminAllBalances /> : null;

      case 'user-management':
        return userRole === 'admin' ? <AdminPanel currentUser={currentUser} /> : null;

      case 'holidays':
        return <HolidayCalendar userRole={userRole} />;

      case 'about':
        return <PolicyGuide />;

      default:
        return <div>Page not found</div>;
    }
  };

  return renderMainContent();
};
