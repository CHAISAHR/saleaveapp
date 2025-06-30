
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ForfeitRibbonProps {
  broughtForward: number;
  annualUsed: number;
}

export const ForfeitRibbon = ({ broughtForward, annualUsed }: ForfeitRibbonProps) => {
  // CONFIRMED FORMULA: Days to forfeit = Brought Forward - Annual Used (cannot be negative)
  const daysToForfeit = Math.max(0, broughtForward - annualUsed);
  
  // Check if current date is between January 1st and July 31st
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const january1st = new Date(currentYear, 0, 1); // January 1st
  const july31st = new Date(currentYear, 6, 31); // July 31st
  
  // Only show ribbon from January 1st to July 31st
  const shouldShowRibbon = currentDate >= january1st && currentDate <= july31st;
  
  // Don't render if no days to forfeit or if outside visibility period
  if (daysToForfeit === 0 || !shouldShowRibbon) {
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
