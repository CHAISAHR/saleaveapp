import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Wrench } from "lucide-react";
import { useMaintenanceMode } from "@/contexts/MaintenanceContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const MaintenanceModeToggle = () => {
  const { isMaintenanceMode, setMaintenanceMode, loading } = useMaintenanceMode();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggleChange = (checked: boolean) => {
    setPendingState(checked);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setUpdating(true);
    try {
      await setMaintenanceMode(pendingState);
      toast({
        title: pendingState ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        description: pendingState 
          ? "Non-admin users will now see the maintenance page." 
          : "All users can now access the application normally.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update maintenance mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Card className={isMaintenanceMode ? "border-orange-300 bg-orange-50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wrench className={`h-5 w-5 ${isMaintenanceMode ? "text-orange-600" : "text-gray-500"}`} />
            <CardTitle className="text-lg">Maintenance Mode</CardTitle>
          </div>
          <CardDescription>
            When enabled, non-admin users will see a maintenance page instead of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode" className="text-base">
                {isMaintenanceMode ? "Maintenance Mode Active" : "System Operating Normally"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isMaintenanceMode 
                  ? "Only administrators can access the system" 
                  : "All users have full access"}
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={isMaintenanceMode}
              onCheckedChange={handleToggleChange}
              disabled={loading || updating}
            />
          </div>
          
          {isMaintenanceMode && (
            <div className="mt-4 flex items-start gap-2 text-sm text-orange-700 bg-orange-100 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Maintenance mode is currently active. Non-admin users cannot access the application.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingState ? "Enable Maintenance Mode?" : "Disable Maintenance Mode?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingState 
                ? "This will prevent all non-admin users from accessing the application. They will see a maintenance page instead. Are you sure you want to continue?"
                : "This will restore normal access for all users. Are you sure you want to continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={updating}
              className={pendingState ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {updating ? "Updating..." : pendingState ? "Enable Maintenance Mode" : "Disable Maintenance Mode"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
