
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DepartmentManager } from "@/components/DepartmentManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { apiConfig } from "@/config/apiConfig";

interface AdminPanelProps {
  currentUser: any;
}

export const AdminPanel = ({ currentUser }: AdminPanelProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [backendError, setBackendError] = useState(false);

  // Check if we have a valid token
  const hasValidToken = () => {
    const authToken = localStorage.getItem('auth_token');
    return authToken && authToken !== 'null' && authToken !== '';
  };

  // Test backend connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const authToken = localStorage.getItem('auth_token');
        const response = await fetch(apiConfig.endpoints.users, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          setBackendError(true);
        }
      } catch (error) {
        setBackendError(true);
      }
    };

    if (hasValidToken()) {
      testConnection();
    }
  }, []);

  // Show backend connection error if applicable
  if (backendError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Administration Panel</h2>
            <p className="text-gray-600">Manage users, departments, and system settings</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Backend Connection Error</h3>
                <p className="text-sm text-gray-600">
                  Cannot connect to the backend server. Please ensure the server is running.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Administration Panel</h2>
          <p className="text-gray-600">Manage users, departments, and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
