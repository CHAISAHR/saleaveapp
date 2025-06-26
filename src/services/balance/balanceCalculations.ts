
import { EmployeeBalance } from '../balanceService';

export class BalanceCalculations {
  // Check if employee's termination date has passed
  static hasTerminationDatePassed(terminationDate?: string): boolean {
    if (!terminationDate) return false;
    
    const termDate = new Date(terminationDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return termDate < today;
  }

  // Calculate AccumulatedLeave - starts at 0, accumulates 1.667 at end of each completed month
  static calculateAccumulatedLeave(currentDate: Date = new Date(), terminationDate?: string): number {
    const year = currentDate.getFullYear();
    const targetDate = terminationDate ? new Date(terminationDate) : currentDate;
    
    // If termination date is in a different year, use end of that year or current date
    const calculationDate = targetDate.getFullYear() === year ? targetDate : currentDate;
    
    // Get completed months (accumulation happens at END of month)
    const completedMonths = calculationDate.getMonth(); // 0-based, so January = 0, means 0 completed months
    
    // Accumulate 1.667 for each completed month, max 20 days (12 months * 1.667 = 20.004)
    const accumulated = Math.min(completedMonths * 1.667, 20);
    
    console.log(`AccumulatedLeave calculation:`, {
      year,
      calculationDate: calculationDate.toISOString().split('T')[0],
      completedMonths,
      accumulated: Number(accumulated.toFixed(1))
    });
    
    return Number(accumulated.toFixed(1));
  }

  // Calculate accumulated leave at end of previous month for termination calculations
  static calculateAccumulatedLeaveAtEndOfPreviousMonth(terminationDate: string): number {
    const termDate = new Date(terminationDate);
    const year = termDate.getFullYear();
    const terminationMonth = termDate.getMonth(); // 0-based
    
    // Calculate completed months up to (but not including) the termination month
    const completedMonths = terminationMonth; // This gives us months 0 to (terminationMonth-1)
    
    // Accumulate 1.667 for each completed month, max 20 days
    const accumulated = Math.min(completedMonths * 1.667, 20);
    
    console.log(`AccumulatedLeave at end of previous month for termination ${terminationDate}:`, {
      year,
      terminationMonth: terminationMonth + 1, // Display as 1-based
      completedMonths,
      accumulated: Number(accumulated.toFixed(1))
    });
    
    return Number(accumulated.toFixed(1));
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

  // Calculate current annual leave balance
  static calculateAnnualLeaveBalance(balance: EmployeeBalance, employeeStartDate?: string): number {
    // Use AccumulatedLeave from the balance object (should be calculated/updated regularly)
    const currentBalance = Number((
      balance.Broughtforward + 
      balance.AccumulatedLeave - 
      balance.AnnualUsed - 
      balance.Forfeited - 
      balance.Annual_leave_adjustments
    ).toFixed(1));

    console.log(`Annual leave balance calculation for ${balance.EmployeeName}:`, {
      broughtforward: balance.Broughtforward,
      accumulatedLeave: balance.AccumulatedLeave,
      annualUsed: balance.AnnualUsed,
      forfeited: balance.Forfeited,
      adjustments: balance.Annual_leave_adjustments,
      currentBalance
    });

    return currentBalance;
  }

  // Calculate annual leave balance at end of previous month (for termination calculations)
  static calculateAnnualLeaveBalanceAtEndOfPreviousMonth(balance: EmployeeBalance, terminationDate: string): number {
    // Get accumulated leave at end of previous month
    const accumulatedAtEndOfPreviousMonth = this.calculateAccumulatedLeaveAtEndOfPreviousMonth(terminationDate);
    
    const balanceAtEndOfPreviousMonth = Number((
      balance.Broughtforward + 
      accumulatedAtEndOfPreviousMonth - 
      balance.AnnualUsed - 
      balance.Forfeited - 
      balance.Annual_leave_adjustments
    ).toFixed(1));

    console.log(`Annual leave balance at end of previous month for ${balance.EmployeeName}:`, {
      broughtforward: balance.Broughtforward,
      accumulatedAtEndOfPreviousMonth,
      annualUsed: balance.AnnualUsed,
      forfeited: balance.Forfeited,
      adjustments: balance.Annual_leave_adjustments,
      balanceAtEndOfPreviousMonth,
      terminationDate
    });

    return balanceAtEndOfPreviousMonth;
  }

  // Calculate termination balance with corrected logic
  static calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
    const termDate = new Date(terminationDate);
    const year = termDate.getFullYear();
    const month = termDate.getMonth() + 1; // 1-based month
    const day = termDate.getDate();
    
    // Get the last day of the termination month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    
    let terminationBalance: number;
    
    if (day === lastDayOfMonth) {
      // Termination is on the last day of the month
      // Use current annual leave balance (which includes full accumulated leave for that month)
      terminationBalance = this.calculateAnnualLeaveBalance(balance);
      
      console.log(`Termination on last day of month for ${balance.EmployeeName}:`, {
        terminationDate,
        day,
        lastDayOfMonth,
        terminationBalance,
        note: 'Using current annual leave balance (end of month)'
      });
    } else {
      // Termination is during the month
      // Use balance at end of previous month + prorated amount
      const balanceAtEndOfPreviousMonth = this.calculateAnnualLeaveBalanceAtEndOfPreviousMonth(balance, terminationDate);
      const proratedAmount = this.calculateTerminationProration(terminationDate);
      
      terminationBalance = balanceAtEndOfPreviousMonth + proratedAmount;
      
      console.log(`Termination during month for ${balance.EmployeeName}:`, {
        terminationDate,
        day,
        lastDayOfMonth,
        balanceAtEndOfPreviousMonth,
        proratedAmount,
        terminationBalance: Number(terminationBalance.toFixed(1)),
        note: 'Using previous month balance + prorated'
      });
    }
    
    return Number(terminationBalance.toFixed(1));
  }

  // Legacy methods for backward compatibility
  static calculateProratedAccumulationFromStartDate(startDate: string, currentYear: number = new Date().getFullYear()): number {
    // For new system, this should use the calculateAccumulatedLeave method
    return this.calculateAccumulatedLeave(new Date());
  }

  static calculateMonthlyAccumulation(currentMonth: number = new Date().getMonth() + 1, terminationDate?: string): number {
    // For new system, convert to use calculateAccumulatedLeave
    return this.calculateAccumulatedLeave(new Date(), terminationDate);
  }

  static calculateProRatedAccumulation(terminationDate: string): number {
    // For termination balance, use the new proration calculation
    return this.calculateTerminationProration(terminationDate);
  }

  // Calculate current balance for other leave types (yearly allocation - used)
  static calculateOtherLeaveBalance(yearlyAllocation: number, used: number): number {
    return Number((yearlyAllocation - used).toFixed(1));
  }

  // Calculate current balance based on leave type
  static calculateCurrentBalance(balance: EmployeeBalance, leaveType: string = 'annual', employeeStartDate?: string): number {
    switch (leaveType.toLowerCase()) {
      case 'annual':
        return this.calculateAnnualLeaveBalance(balance, employeeStartDate);
      case 'sick':
        return this.calculateOtherLeaveBalance(36, balance.SickUsed);
      case 'maternity':
        return this.calculateOtherLeaveBalance(90, balance.MaternityUsed);
      case 'parental':
        return this.calculateOtherLeaveBalance(20, balance.ParentalUsed);
      case 'family':
        return this.calculateOtherLeaveBalance(3, balance.FamilyUsed);
      case 'adoption':
        return this.calculateOtherLeaveBalance(20, balance.AdoptionUsed);
      case 'study':
        return this.calculateOtherLeaveBalance(6, balance.StudyUsed);
      case 'mentalhealth':
        return this.calculateOtherLeaveBalance(2, balance.MentalhealthUsed);
      default:
        return this.calculateAnnualLeaveBalance(balance, employeeStartDate);
    }
  }

  // Get all leave balances for an employee
  static getAllLeaveBalances(balance: EmployeeBalance, employeeStartDate?: string) {
    return {
      annual: this.calculateAnnualLeaveBalance(balance, employeeStartDate),
      sick: this.calculateOtherLeaveBalance(36, balance.SickUsed),
      maternity: this.calculateOtherLeaveBalance(90, balance.MaternityUsed),
      parental: this.calculateOtherLeaveBalance(20, balance.ParentalUsed),
      family: this.calculateOtherLeaveBalance(3, balance.FamilyUsed),
      adoption: this.calculateOtherLeaveBalance(20, balance.AdoptionUsed),
      study: this.calculateOtherLeaveBalance(6, balance.StudyUsed),
      wellness: this.calculateOtherLeaveBalance(2, balance.MentalhealthUsed)
    };
  }
}
