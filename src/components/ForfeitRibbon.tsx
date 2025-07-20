
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ForfeitRibbonProps {
  broughtForward: number;
  annualUsed: number;
}

export const ForfeitRibbon = ({ broughtForward, annualUsed }: ForfeitRibbonProps) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const forfeitureDeadline = new Date(currentYear, 6, 31); // July 31st of current year
  
  // Calculate days to forfeit based on actual policy:
  // - Only brought forward leave can be forfeited
  // - Only if we're past the forfeiture deadline (July 31st)
  // - The amount to forfeit is the unused portion of brought forward leave
  let daysToForfeit = 0;
  
  if (currentDate > forfeitureDeadline && broughtForward > 0) {
    // If past July 31st, any unused brought forward leave is forfeited
    const usedFromBroughtForward = Math.min(annualUsed, broughtForward);
    daysToForfeit = Math.max(0, broughtForward - usedFromBroughtForward);
  } else if (currentDate <= forfeitureDeadline && broughtForward > 0) {
    // If before July 31st, show potential forfeiture (all brought forward days)
    daysToForfeit = broughtForward;
  }
  
  if (daysToForfeit === 0) {
    return null;
  }

  return (
    <Card className="bg-amber-50 border-amber-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium text-amber-800">Days to be Forfeited by 31st July</h4>
            <p className="text-sm text-amber-700">
              You have <span className="font-bold">{daysToForfeit} day{daysToForfeit !== 1 ? 's' : ''}</span> that will be forfeited if not used by 31st July.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
