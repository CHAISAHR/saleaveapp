
import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { ForfeitRibbon } from "@/components/ForfeitRibbon";
import { MainContent } from "./MainContent";

interface MainLayoutProps {
  currentUser: any;
  userRole: 'employee' | 'manager' | 'admin';
  setUserRole: (role: 'employee' | 'manager' | 'admin') => void;
}

export const MainLayout = ({ currentUser, userRole, setUserRole }: MainLayoutProps) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Employee balance data for forfeit ribbon
  const employeeBalance = {
    broughtForward: 5,
    annualUsed: 3
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          currentUser={currentUser}
          userRole={userRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRoleChange={setUserRole}
        />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            {/* Top right user info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-4 p-4 md:p-6">
            {/* Forfeit ribbon for employees */}
            {userRole === 'employee' && (
              <ForfeitRibbon 
                broughtforward={employeeBalance.broughtForward}
                annualUsed={employeeBalance.annualUsed}
              />
            )}
            
            <MainContent 
              activeTab={activeTab}
              userRole={userRole}
              currentUser={currentUser}
              onNewRequest={() => setShowRequestForm(true)}
            />
          </main>
        </SidebarInset>
      </div>

      {/* Leave Request Form Modal */}
      {showRequestForm && (
        <LeaveRequestForm
          isOpen={showRequestForm}
          onClose={() => setShowRequestForm(false)}
          currentUser={currentUser}
        />
      )}
    </SidebarProvider>
  );
};
