import { EmployeeDashboard } from "@/components/EmployeeDashboard";
import { ManagerDashboard } from "@/components/ManagerDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminAllRequests } from "@/components/AdminAllRequests";
import { AdminAllBalances } from "@/components/AdminAllBalances";
import { AdminPanel } from "@/components/AdminPanel";
import { HolidayCalendar } from "@/components/HolidayCalendar";
import { PolicyGuide } from "@/components/PolicyGuide";
import { DocumentManager } from "@/components/DocumentManager";

interface MainContentProps {
  activeTab: string;
  userRole: 'employee' | 'manager' | 'admin' | 'CD';
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
        ) : userRole === 'CD' ? (
          <ManagerDashboard currentUser={currentUser} />
        ) : (
          <AdminDashboard currentUser={currentUser} />
        );

      case 'admin-dashboard':
        return (userRole === 'CD' || userRole === 'admin') ? (
          <AdminDashboard currentUser={{ ...currentUser, role: 'admin' }} />
        ) : null;

      case 'balance':
        return userRole === 'employee' ? (
          <EmployeeDashboard onNewRequest={onNewRequest} currentUser={currentUser} activeView="balance" />
        ) : userRole === 'manager' ? (
          <ManagerDashboard currentUser={currentUser} activeView="balance" />
        ) : userRole === 'CD' ? (
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
        return (userRole === 'manager' || userRole === 'admin' || userRole === 'CD') ? <DocumentManager userRole={userRole} /> : null;

      case 'holidays':
        return <HolidayCalendar userRole={userRole} />;

      case 'about':
        return <PolicyGuide />;

      
      case 'team-management':
        return userRole === 'CD' ? (
          <AdminAllRequests />
        ) : null;

      default:
        return <div>Page not found</div>;
    }
  };

  return renderMainContent();
};
