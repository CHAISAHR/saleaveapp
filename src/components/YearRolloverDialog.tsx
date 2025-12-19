
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";

interface YearRolloverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentYear: number;
  onRolloverComplete: () => void;
}

export const YearRolloverDialog = ({ 
  open, 
  onOpenChange, 
  currentYear, 
  onRolloverComplete 
}: YearRolloverDialogProps) => {
  const { toast } = useToast();
  const [targetYear, setTargetYear] = useState(currentYear + 1);
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [rolloverStatus, setRolloverStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const handleRollover = async () => {
    if (targetYear <= currentYear) {
      toast({
        title: "Invalid Year",
        description: "Target year must be greater than current year.",
        variant: "destructive"
      });
      return;
    }

    setIsRollingOver(true);
    setRolloverStatus('idle');

    try {
      const response = await fetch(`${apiConfig.endpoints.rollover}/year-rollover`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fromYear: currentYear,
          toYear: targetYear
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Rollover failed');
      }

      console.log('Rollover result:', data);
      setRolloverStatus('success');
      
      toast({
        title: "Year Rollover Complete",
        description: data.message || `Successfully rolled over ${data.rolloverCount} employee balances to ${targetYear}.`,
      });

      // Trigger parent component refresh
      onRolloverComplete();
      
      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
        setRolloverStatus('idle');
      }, 1500);

    } catch (error: any) {
      console.error('Year rollover failed:', error);
      setRolloverStatus('error');
      
      toast({
        title: "Rollover Failed",
        description: error.message || "Failed to complete year rollover. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRollingOver(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Year-End Rollover</DialogTitle>
          <DialogDescription>
            Roll over employee leave balances to a new year with automatic backup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Data Protection:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• All {currentYear} records will be preserved as backup</li>
                <li>• No existing data will be modified or deleted</li>
                <li>• New records will be created for {targetYear}</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>This rollover will:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Reset all "used" leave columns to 0 (except sick leave)</li>
                <li>• Move current annual leave balance to "Brought Forward"</li>
                <li>• Reset AccumulatedLeave to 0 for the new year</li>
                <li>• Keep sick leave balances unchanged</li>
                <li>• Update year column to {targetYear}</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="targetYear">Target Year</Label>
            <Input
              id="targetYear"
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value) || currentYear + 1)}
              min={currentYear + 1}
              max={currentYear + 5}
            />
          </div>

          {rolloverStatus === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Year rollover completed successfully! Previous year data backed up.
              </AlertDescription>
            </Alert>
          )}

          {rolloverStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Rollover failed. Previous year data remains intact. Please check the logs and try again.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isRollingOver}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRollover}
              disabled={isRollingOver || rolloverStatus === 'success'}
            >
              {isRollingOver && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRollingOver ? 'Rolling Over...' : 'Start Rollover'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
