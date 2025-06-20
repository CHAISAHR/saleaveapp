
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatsCards } from "./AdminStatsCards";

export const SystemOverview = () => {
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
              <div className="text-2xl font-bold text-blue-600">2,847</div>
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
