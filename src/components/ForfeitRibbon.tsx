
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
  
  // Check date ranges for ribbon display
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const july31 = new Date(currentYear, 6, 31); // Month is 0-indexed, so 6 = July
  const august31 = new Date(currentYear, 7, 31); // Month is 0-indexed, so 7 = August
  
  const isBeforeAugust1 = currentDate <= july31;
  const isAugust = currentDate > july31 && currentDate <= august31;
  
  // From Jan 1 - July 31: Show days to be forfeited (if any)
  if (isBeforeAugust1 && daysToForfeit === 0) {
    return null;
  }
  
  // From Aug 1 - Aug 31: Show forfeited days (if any)
  if (isAugust && forfeited === 0) {
    return null;
  }
  
  // After Aug 31: Don't show ribbon
  if (!isBeforeAugust1 && !isAugust) {
    return null;
  }

  return (
    <Card className={`${isAugust ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} mb-6`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`${isAugust ? 'bg-red-100' : 'bg-amber-100'} p-2 rounded-lg`}>
            <AlertTriangle className={`h-5 w-5 ${isAugust ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            {isAugust ? (
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
