
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

  // Calculate termination balance: Current Balance + leave earned from now until termination
  // This preserves the existing balance and adds leave for remaining complete months + prorated termination month
  static calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
    // Calculate current balance (this includes brought forward, accumulated, used, forfeited, adjustments)
    const currentBalance = balance.Broughtforward + balance.AccumulatedLeave - 
      balance.AnnualUsed - balance.Forfeited - balance.Annual_leave_adjustments;
    
    // Calculate additional leave to be earned from now until termination
    const additionalLeave = this.calculateLeaveUntilTermination(terminationDate);
    
    // Termination balance = current balance + additional leave until termination
    const terminationBalance = Number((currentBalance + additionalLeave).toFixed(1));

    console.log(`Termination balance calculation for ${balance.EmployeeName}:`, {
      terminationDate,
      broughtforward: balance.Broughtforward,
      accumulatedLeave: balance.AccumulatedLeave,
      annualUsed: balance.AnnualUsed,
      forfeited: balance.Forfeited,
      adjustments: balance.Annual_leave_adjustments,
      currentBalance: Number(currentBalance.toFixed(1)),
      additionalLeave,
      terminationBalance
    });
    
    return terminationBalance;
  }

  // Calculate leave earned from current month end until termination date
  static calculateLeaveUntilTermination(terminationDate: string): number {
    const today = new Date();
    const termDate = new Date(terminationDate);
    
    // If termination is in the past or current month, just return prorated termination month
    if (termDate <= today) {
      return this.calculateTerminationProration(terminationDate);
    }
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const termMonth = termDate.getMonth();
    const termYear = termDate.getFullYear();
    
    let additionalLeave = 0;
    
    // Count complete months between current month end and termination month
    let month = currentMonth + 1;
    let year = currentYear;
    
    while (year < termYear || (year === termYear && month < termMonth)) {
      additionalLeave += 1.667;
      
      console.log(`Future complete month ${month + 1}/${year}: +1.667`);
      
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    
    // Add prorated termination month
    const terminationMonthLeave = this.calculateTerminationProration(terminationDate);
    additionalLeave += terminationMonthLeave;
    
    console.log(`Leave until termination ${terminationDate}:`, {
      completeMonths: Math.floor((additionalLeave - terminationMonthLeave) / 1.667),
      terminationMonthLeave,
      totalAdditional: Number(additionalLeave.toFixed(3))
    });
    
    return Number(additionalLeave.toFixed(3));
  }
}
