
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Settings, Database, LogOut, User, FileText, Eye } from "lucide-react";

interface AppSidebarProps {
  currentUser: any;
  userRole: 'employee' | 'manager' | 'admin' | 'country_director';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRoleChange?: (role: 'employee' | 'manager' | 'admin' | 'country_director') => void;
}

export const AppSidebar = ({ 
  currentUser, 
  userRole, 
  activeTab, 
  onTabChange,
  onRoleChange 
}: AppSidebarProps) => {
  const { logout } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      {
        value: "dashboard",
        icon: Calendar,
        label: userRole === 'employee' ? 'Leave Requests' : userRole === 'manager' ? 'Leave Requests' : userRole === 'country_director' ? 'Dashboard' : 'Dashboard'
      },
      {
        value: "holidays",
        icon: Calendar,
        label: "Holidays"
      },
      {
        value: "about",
        icon: User,
        label: "About"
      }
    ];

    // Add balance tab only for employees, managers, and country directors (not admin)
    if (userRole !== 'admin') {
      baseItems.splice(1, 0, {
        value: "balance",
        icon: Calendar,
        label: userRole === 'employee' ? 'Leave Balances' : 'Leave Balances'
      });
    }

    // Admin-only features
    if (userRole === 'admin') {
      baseItems.splice(1, 0, {
        value: "all-requests",
        icon: Database,
        label: "All Leave Requests"
      });
      baseItems.splice(2, 0, {
        value: "all-balances",
        icon: Users,
        label: "All Balances"
      });
      baseItems.splice(3, 0, {
        value: "documents",
        icon: FileText,
        label: "Documents"
      });
      baseItems.splice(4, 0, {
        value: "user-management",
        icon: Users,
        label: "User Management"
      });
      baseItems.splice(5, 0, {
        value: "audit",
        icon: Eye,
        label: "Audit Log"
      });
    }

    // Add documents tab for managers and country directors (not employees or admin)
    if (userRole === 'manager' || userRole === 'country_director') {
      baseItems.splice(2, 0, {
        value: "documents",
        icon: FileText,
        label: "Documents"
      });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/chailogo.png" 
            alt="Company Logo" 
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">LeaveApp_SA</h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role switcher for managers, country directors and admins */}
        {(currentUser.role === 'manager' || currentUser.role === 'admin' || currentUser.role === 'country_director') && onRoleChange && (
          <SidebarGroup>
            <SidebarGroupLabel>View As</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1 px-2">
                <Button
                  variant={userRole === 'employee' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onRoleChange('employee')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Employee View
                </Button>
                
                {(currentUser.role === 'manager' || currentUser.role === 'admin' || currentUser.role === 'country_director') && (
                  <Button
                    variant={userRole === 'manager' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onRoleChange('manager')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manager View
                  </Button>
                )}
                
                {(currentUser.role === 'country_director' || currentUser.role === 'admin') && (
                  <Button
                    variant={userRole === 'country_director' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onRoleChange('country_director')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Country Director View
                  </Button>
                )}
                
                {currentUser.role === 'admin' && (
                  <Button
                    variant={userRole === 'admin' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onRoleChange('admin')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin View
                  </Button>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-3">
          {/* User info */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {currentUser.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.department}</p>
            </div>
          </div>
          
          {/* Role badge */}
          <Badge variant={userRole === 'admin' ? 'default' : userRole === 'country_director' ? 'default' : userRole === 'manager' ? 'secondary' : 'outline'} className="w-full justify-center">
            {userRole === 'country_director' ? 'Country Director' : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
          
          {/* Sign out button */}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
