
import { Button } from "@/components/ui/button";
import { Download, Plus, RotateCcw, AlertTriangle } from "lucide-react";

interface AdminAllBalancesHeaderProps {
  isAfterJuly31: boolean;
  onRolloverWarning: () => void;
  onForfeitWarning: () => void;
  onDownloadCSV: () => void;
}

export const AdminAllBalancesHeader = ({
  isAfterJuly31,
  onRolloverWarning,
  onForfeitWarning,
  onDownloadCSV
}: AdminAllBalancesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">All Employee Balances</h2>
        <p className="text-gray-600">View and edit leave balances for all employees</p>
        {isAfterJuly31 && (
          <p className="text-sm text-orange-600 mt-1">
            🍂 Automatic forfeit active: Unused brought forward leave after July 31st is automatically forfeited
          </p>
        )}
      </div>
      <div className="flex space-x-2">
        <Button 
          onClick={onRolloverWarning}
          variant="default"
          className="bg-orange-600 hover:bg-orange-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Year Rollover
        </Button>
        <Button 
          onClick={onForfeitWarning}
          variant="default"
          className="bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Forfeit Leave
        </Button>
        <Button onClick={onDownloadCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add New Employee
        </Button>
      </div>
    </div>
  );
};
