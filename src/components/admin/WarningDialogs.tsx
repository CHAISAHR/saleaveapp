
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface WarningDialogsProps {
  showRolloverWarning: boolean;
  showForfeitWarning: boolean;
  isAfterJuly31: boolean;
  onRolloverWarningChange: (open: boolean) => void;
  onForfeitWarningChange: (open: boolean) => void;
  onConfirmRollover: () => void;
  onConfirmForfeit: () => void;
}

export const WarningDialogs = ({
  showRolloverWarning,
  showForfeitWarning,
  isAfterJuly31,
  onRolloverWarningChange,
  onForfeitWarningChange,
  onConfirmRollover,
  onConfirmForfeit
}: WarningDialogsProps) => {
  return (
    <>
      {/* Year Rollover Warning Dialog */}
      <Dialog open={showRolloverWarning} onOpenChange={onRolloverWarningChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Year Rollover
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p>
                  <strong>Warning:</strong> Year rollover is a critical operation that will:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Create new balance records for the next year</li>
                  <li>Carry forward unused leave balances according to policy</li>
                  <li>Reset used leave counters to zero</li>
                  <li>This action affects all employees and cannot be easily undone</li>
                </ul>
                <p className="text-red-600 font-medium">
                  Are you sure you want to proceed with the year rollover?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onRolloverWarningChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirmRollover} className="bg-orange-600 hover:bg-orange-700">
              Proceed with Rollover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forfeit Leave Warning Dialog */}
      <Dialog open={showForfeitWarning} onOpenChange={onForfeitWarningChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Leave Forfeiture
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p>
                  <strong>Warning:</strong> This action will forfeit brought forward leave for all employees where:
                </p>
                <p className="font-mono bg-gray-100 p-2 rounded">
                  (Brought Forward - Annual Used) &gt; 0
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>This will update the "Forfeited" column for affected employees</li>
                  <li>Forfeited leave cannot be recovered once processed</li>
                  <li>This action affects multiple employees simultaneously</li>
                  <li>You can manually edit individual forfeit amounts after this operation</li>
                  {isAfterJuly31 && (
                    <li className="text-orange-600">
                      📅 Note: Automatic forfeit is active after July 31st
                    </li>
                  )}
                </ul>
                <p className="text-red-600 font-medium">
                  Are you sure you want to forfeit brought forward leave?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onForfeitWarningChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirmForfeit} className="bg-red-600 hover:bg-red-700">
              Forfeit Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
