
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForfeitRibbon } from "@/components/ForfeitRibbon";
import { apiConfig, makeApiRequest } from "@/config/apiConfig";
import { BalanceCalculations } from "@/services/balance/balanceCalculations";
import { EmployeeBalance } from "@/services/balanceService";

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
  leaveBalances?: LeaveBalance[];
  userEmail?: string;
}

export const LeaveBalanceGrid = ({ leaveBalances: propBalances, userEmail }: LeaveBalanceGridProps) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(propBalances || []);
  const [loading, setLoading] = useState(!propBalances);

  // Get authorization headers
  const getAuthHeaders = () => {
    const authToken = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch leave balances from backend
  const fetchLeaveBalances = async () => {
    if (propBalances) return; // Use prop data if provided
    
    try {
      setLoading(true);
      
      const response = await fetch(`${apiConfig.endpoints.balance}${userEmail ? `/${userEmail}` : ''}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend employee balance data to component format
        if (data && data.EmployeeName) {
          const employeeBalance: EmployeeBalance = data;
          const accumulatedLeave = BalanceCalculations.calculateAccumulatedLeave(
            new Date(), 
            employeeBalance.Contract_termination_date
          );
          
          const transformedBalances: LeaveBalance[] = [
            {
              type: 'Annual',
              used: employeeBalance.AnnualUsed || 0,
              total: (employeeBalance.Annual || 0) + (employeeBalance.Broughtforward || 0),
              accrued: accumulatedLeave,
              unit: 'days',
              broughtForward: employeeBalance.Broughtforward || 0,
              balance: BalanceCalculations.calculateCurrentBalance(employeeBalance, 'annual', employeeBalance.Start_date)
            },
            {
              type: 'Sick',
              used: employeeBalance.SickUsed || 0,
              total: 36, // Max sick leave allocation
              accrued: 36,
              unit: 'days',
              balance: BalanceCalculations.calculateOtherLeaveBalance(36, employeeBalance.SickUsed || 0)
            },
            {
              type: 'Maternity',
              used: employeeBalance.MaternityUsed || 0,
              total: 3,
              accrued: 3,
              unit: 'months',
              balance: BalanceCalculations.calculateOtherLeaveBalance(3, employeeBalance.MaternityUsed || 0)
            },
            {
              type: 'Parental',
              used: employeeBalance.ParentalUsed || 0,
              total: 4,
              accrued: 4,
              unit: 'weeks',
              balance: BalanceCalculations.calculateOtherLeaveBalance(4, employeeBalance.ParentalUsed || 0)
            },
            {
              type: 'Family',
              used: employeeBalance.FamilyUsed || 0,
              total: 5,
              accrued: 5,
              unit: 'days',
              balance: BalanceCalculations.calculateOtherLeaveBalance(5, employeeBalance.FamilyUsed || 0)
            },
            {
              type: 'Adoption',
              used: employeeBalance.AdoptionUsed || 0,
              total: 10,
              accrued: 10,
              unit: 'weeks',
              balance: BalanceCalculations.calculateOtherLeaveBalance(10, employeeBalance.AdoptionUsed || 0)
            },
            {
              type: 'Study',
              used: employeeBalance.StudyUsed || 0,
              total: 10,
              accrued: 10,
              unit: 'days',
              balance: BalanceCalculations.calculateOtherLeaveBalance(10, employeeBalance.StudyUsed || 0)
            },
            {
              type: 'Wellness',
              used: employeeBalance.WellnessUsed || 0,
              total: 2,
              accrued: 2,
              unit: 'days',
              balance: BalanceCalculations.calculateOtherLeaveBalance(2, employeeBalance.WellnessUsed || 0)
            }
          ];
          
          setLeaveBalances(transformedBalances);
        } else {
          // Fallback to default balances if backend doesn't return structured data
          setLeaveBalances(getDefaultBalances());
        }
      } else {
        console.error('Failed to fetch leave balances');
        // Fallback to default balances
        setLeaveBalances(getDefaultBalances());
      }
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      // Fallback to default balances
      setLeaveBalances(getDefaultBalances());
    } finally {
      setLoading(false);
    }
  };

  // Default balances as fallback with correct units
  const getDefaultBalances = (): LeaveBalance[] => [
    {
      type: 'Annual',
      used: 8,
      total: 20,
      accrued: 12.5,
      unit: 'days',
      broughtForward: 5,
      balance: 9.5
    },
    {
      type: 'Sick',
      used: 3,
      total: 36,
      accrued: 36,
      unit: 'days',
      balance: 33
    },
    {
      type: 'Maternity',
      used: 0,
      total: 3,
      accrued: 3,
      unit: 'months',
      balance: 3
    },
    {
      type: 'Parental',
      used: 0,
      total: 4,
      accrued: 4,
      unit: 'weeks',
      balance: 4
    },
    {
      type: 'Family',
      used: 0,
      total: 5,
      accrued: 5,
      unit: 'days',
      balance: 5
    },
    {
      type: 'Adoption',
      used: 0,
      total: 10,
      accrued: 10,
      unit: 'weeks',
      balance: 10
    },
    {
      type: 'Study',
      used: 0,
      total: 10,
      accrued: 10,
      unit: 'days',
      balance: 10
    },
    {
      type: 'Wellness',
      used: 0,
      total: 2,
      accrued: 2,
      unit: 'days',
      balance: 2
    }
  ];

  useEffect(() => {
    fetchLeaveBalances();
  }, [userEmail]);

  // Get annual leave data for forfeit calculation
  const annualLeave = leaveBalances.find(b => b.type === 'Annual');
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading leave balances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forfeit ribbon */}
      {annualLeave && (
        <ForfeitRibbon 
          broughtForward={annualLeave.broughtForward || 0}
          annualUsed={annualLeave.used}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
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
                  <div className="text-sm text-gray-500">{balance.unit} available</div>
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
              <h5 className="font-medium text-gray-900 mb-2">Accrual Rates & Allocations</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Annual: 1.667 days per month</li>
                <li>• Sick: 1 day per month, accumulates to 36 in 3 years</li>
                <li>• Maternity: 3 months (for eligible employees)</li>
                <li>• Parental: 4 weeks per annum</li>
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
