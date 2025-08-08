import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminAllRequests } from "@/components/AdminAllRequests";
import { AdminAllBalances } from "@/components/AdminAllBalances";
import { AdminPanel } from "@/components/AdminPanel";
import { HolidayCalendar } from "@/components/HolidayCalendar";
import { PolicyGuide } from "@/components/PolicyGuide";
import { DocumentManager } from "@/components/DocumentManager";
import { AuditLog } from "@/components/admin/AuditLog";

interface MainContentProps {
  activeTab: string;
  userRole: 'employee' | 'manager' | 'admin' | 'country_director';
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
        ) : userRole === 'country_director' ? (
          <ManagerDashboard currentUser={currentUser} />
        ) : (
          <AdminDashboard currentUser={currentUser} />
        );

      case 'admin-dashboard':
        return userRole === 'country_director' ? (
          <AdminDashboard currentUser={currentUser} />
        ) : null;

      case 'balance':
        return userRole === 'employee' ? (
          <EmployeeDashboard onNewRequest={onNewRequest} currentUser={currentUser} activeView="balance" />
        ) : userRole === 'manager' ? (
          <ManagerDashboard currentUser={currentUser} activeView="balance" />
        ) : userRole === 'country_director' ? (
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

      case 'documents':
        return (userRole === 'manager' || userRole === 'admin' || userRole === 'country_director') ? <DocumentManager userRole={userRole} /> : null;

      case 'holidays':
        return <HolidayCalendar userRole={userRole} />;

      case 'about':
        return <PolicyGuide />;

      case 'audit':
        return userRole === 'admin' ? <AuditLog /> : null;

      default:
        return <div>Page not found</div>;
    }
  };

  return renderMainContent();
};
