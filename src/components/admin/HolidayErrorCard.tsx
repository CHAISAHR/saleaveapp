
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface HolidayErrorCardProps {
  onRetry: () => void;
  loading: boolean;
}

export const HolidayErrorCard = ({ onRetry, loading }: HolidayErrorCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Backend Connection Error</h3>
            <p className="text-sm text-gray-600">
              Cannot connect to the backend server. Please ensure:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              <li>The backend server is running and accessible</li>
              <li>You have a valid authentication token</li>
              <li>The database is properly configured</li>
            </ul>
            <Button 
              onClick={onRetry} 
              className="mt-4"
              disabled={loading}
            >
              {loading ? "Retrying..." : "Retry Connection"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
