
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ForfeitRibbonProps {
  broughtforward: number;
  annualUsed: number;
}

export const ForfeitRibbon = ({ broughtforward, annualUsed }: ForfeitRibbonProps) => {
  // Calculate unused brought forward days (assumes brought forward days are used first)
  const daysToForfeit = Math.max(0, broughtforward - Math.min(broughtforward, annualUsed));
  
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
