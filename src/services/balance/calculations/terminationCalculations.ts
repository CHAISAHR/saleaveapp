
import { EmployeeBalance } from '../../balanceService';
import { AccumulatedLeaveCalculations } from './accumulatedLeaveCalculations';

export class TerminationCalculations {
  // Check if employee's termination date has passed
  static hasTerminationDatePassed(terminationDate?: string): boolean {
    if (!terminationDate) return false;
    
    const termDate = new Date(terminationDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return termDate < today;
  }

  // Calculate prorated termination balance addition: 1.667 * (Day of termination / Days in termination month)
  static calculateTerminationProration(terminationDate: string): number {
    const termDate = new Date(terminationDate);
    const year = termDate.getFullYear();
    const month = termDate.getMonth() + 1; // 1-based month
    const day = termDate.getDate();
    
    // Get the last day of the termination month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    
    // Calculate prorated amount: 1.667 * (Day / Days in month)
    const proratedAmount = 1.667 * (day / lastDayOfMonth);
    
    console.log(`Termination proration calculation for ${terminationDate}:`, {
      day,
      lastDayOfMonth,
      proratedAmount: proratedAmount.toFixed(3),
      result: Number(proratedAmount.toFixed(1))
    });
    
    return Number(proratedAmount.toFixed(1));
  }

  // Calculate termination balance using new formula
  static calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
    // Get accumulated leave at termination date based on days worked
    const accumulatedAtTermination = AccumulatedLeaveCalculations.calculateAccumulatedLeaveAtTerminationDate(terminationDate);
    
    // New formula: Brought Forward - Annual Used - Forfeited - Adjustments + Accumulated Leave at termination
    const terminationBalance = Number((
      balance.Broughtforward - 
      balance.AnnualUsed - 
      balance.Forfeited - 
      balance.Annual_leave_adjustments + 
      accumulatedAtTermination
    ).toFixed(1));

    console.log(`Termination balance calculation for ${balance.EmployeeName}:`, {
      terminationDate,
      broughtforward: balance.Broughtforward,
      annualUsed: balance.AnnualUsed,
      forfeited: balance.Forfeited,
      adjustments: balance.Annual_leave_adjustments,
      accumulatedAtTermination,
      terminationBalance
    });
    
    return terminationBalance;
  }
}
