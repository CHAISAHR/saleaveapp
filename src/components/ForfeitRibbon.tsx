
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ForfeitRibbonProps {
  broughtforward: number;
  annualUsed: number;
  annualLeaveAdjustments: number;
  forfeited: number;
}

export const ForfeitRibbon = ({ broughtforward, annualUsed, annualLeaveAdjustments, forfeited }: ForfeitRibbonProps) => {
  const daysToForfeit = Math.max(0, broughtforward - annualLeaveAdjustments - annualUsed);
  
  // Check if July 31st has passed for the current year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const july31 = new Date(currentYear, 6, 31); // Month is 0-indexed, so 6 = July
  const isAfterJuly31 = currentDate > july31;
  
  // Don't show the ribbon if there are no days to forfeit and no forfeited days to show
  if (!isAfterJuly31 && daysToForfeit === 0) {
    return null;
  }
  
  if (isAfterJuly31 && forfeited === 0) {
    return null;
  }

  return (
    <Card className={`${isAfterJuly31 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} mb-6`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`${isAfterJuly31 ? 'bg-red-100' : 'bg-amber-100'} p-2 rounded-lg`}>
            <AlertTriangle className={`h-5 w-5 ${isAfterJuly31 ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            {isAfterJuly31 ? (
              <>
                <h4 className="font-medium text-red-800">Leave Days Forfeited</h4>
                <p className="text-sm text-red-700">
                  <span className="font-bold">{forfeited} day{forfeited !== 1 ? 's' : ''}</span> {forfeited === 1 ? 'was' : 'were'} forfeited from your previous leave cycle on 31st July.
                </p>
              </>
            ) : (
              <>
                <h4 className="font-medium text-amber-800">Days to be Forfeited by 31st July</h4>
                <p className="text-sm text-amber-700">
                  You have <span className="font-bold">{daysToForfeit} day{daysToForfeit !== 1 ? 's' : ''}</span> that will be forfeited if not used by 31st July.
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
