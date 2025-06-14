
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForfeitRibbon } from "@/components/ForfeitRibbon";

interface LeaveBalance {
  type: string;
  used: number;
  total: number;
  accrued: number;
  unit: string;
  broughtForward?: number;
  balance: number;
}

interface LeaveBalanceGridProps {
  leaveBalances: LeaveBalance[];
}

export const LeaveBalanceGrid = ({ leaveBalances }: LeaveBalanceGridProps) => {
  // Get annual leave data for forfeit calculation
  const annualLeave = leaveBalances.find(b => b.type === 'Annual');
  
  return (
    <div className="space-y-6">
      {/* Forfeit ribbon */}
      {annualLeave && (
        <ForfeitRibbon 
          broughtForward={annualLeave.broughtForward || 0}
          annualUsed={annualLeave.used}
        />
      )}

      <div className="grid grid-cols-4 gap-4">
        {leaveBalances.map(balance => {
          return (
            <Card key={balance.type} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 text-center">
                  {balance.type} leave
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center">
                  <div className="text-3xl font-bold text-lime-700 mb-1 font-mono">{balance.balance}</div>
                  <div className="text-sm text-gray-500">days available</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Policy Summary</CardTitle>
          <CardDescription>Important information about your leave entitlements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Annual Leave Carry-over</h4>
            <p className="text-sm text-yellow-700">Annual leave carried forward expires on the 31st July. Plan your vacation time accordingly.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Accrual Rates</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Annual: 1.66 days per month</li>
                <li>• Sick: 1 day per month, accumulates to 36 in 3 years.</li>
                <li>• Other: Full allocation at year start</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Application Requirements</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Submit requests 2 working days in advance</li>
                <li>• Manager approval required</li>
                <li>• Medical certificates for sick leave &gt;1 day</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
