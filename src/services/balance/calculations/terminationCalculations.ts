
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

  // Calculate termination balance: Current Balance + prorated leave for termination month
  // This preserves the existing balance and only adds the earned leave in the termination month
  static calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
    // Calculate current balance (this includes brought forward, accumulated, used, forfeited, adjustments)
    const currentBalance = balance.Broughtforward + balance.AccumulatedLeave - 
      balance.AnnualUsed - balance.Forfeited - balance.Annual_leave_adjustments;
    
    // Calculate prorated leave for termination month only
    const terminationMonthLeave = this.calculateTerminationProration(terminationDate);
    
    // Termination balance = current balance + prorated termination month leave
    const terminationBalance = Number((currentBalance + terminationMonthLeave).toFixed(1));

    console.log(`Termination balance calculation for ${balance.EmployeeName}:`, {
      terminationDate,
      broughtforward: balance.Broughtforward,
      accumulatedLeave: balance.AccumulatedLeave,
      annualUsed: balance.AnnualUsed,
      forfeited: balance.Forfeited,
      adjustments: balance.Annual_leave_adjustments,
      currentBalance: Number(currentBalance.toFixed(1)),
      terminationMonthLeave,
      terminationBalance
    });
    
    return terminationBalance;
  }
}
