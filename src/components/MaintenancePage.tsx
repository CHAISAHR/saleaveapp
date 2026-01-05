import { Wrench, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-orange-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
            <Wrench className="h-10 w-10 text-orange-600 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            System Under Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We're currently performing scheduled maintenance to improve your experience. 
            The system will be back online shortly.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-lg py-3 px-4">
            <Clock className="h-4 w-4" />
            <span>Please check back in a few minutes</span>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            If you need immediate assistance, please contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
