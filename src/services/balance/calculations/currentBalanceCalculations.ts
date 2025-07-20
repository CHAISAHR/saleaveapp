
import { EmployeeBalance } from '../../balanceService';

export class CurrentBalanceCalculations {
  // Calculate current annual leave balance
  static calculateAnnualLeaveBalance(balance: EmployeeBalance, employeeStartDate?: string): number {
    // Debug: Log all values to identify NaN source
    console.log(`Balance values for ${balance.EmployeeName}:`, {
      Broughtforward: balance.Broughtforward, 
      BroughtforwardType: typeof balance.Broughtforward,
      AccumulatedLeave: balance.AccumulatedLeave, 
      AccumulatedLeaveType: typeof balance.AccumulatedLeave,
      AnnualUsed: balance.AnnualUsed, 
      AnnualUsedType: typeof balance.AnnualUsed,
      Forfeited: balance.Forfeited, 
      ForfeitedType: typeof balance.Forfeited,
      Annual_leave_adjustments: balance.Annual_leave_adjustments, 
      AdjustmentsType: typeof balance.Annual_leave_adjustments
    });

    // Convert all values to numbers, defaulting to 0 if invalid
    const broughtforward = Number(balance.Broughtforward) || 0;
    const accumulatedLeave = Number(balance.AccumulatedLeave) || 0;
    const annualUsed = Number(balance.AnnualUsed) || 0;
    const forfeited = Number(balance.Forfeited) || 0;
    const adjustments = Number(balance.Annual_leave_adjustments) || 0;

    const currentBalance = Number((
      broughtforward + 
      accumulatedLeave - 
      annualUsed - 
      forfeited - 
      adjustments
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
        return this.calculateOtherLeaveBalance(3, balance.MaternityUsed); // 3 months
      case 'parental':
        return this.calculateOtherLeaveBalance(4, balance.ParentalUsed); // 4 weeks
      case 'family':
        return this.calculateOtherLeaveBalance(3, balance.FamilyUsed);
      case 'adoption':
        return this.calculateOtherLeaveBalance(4, balance.AdoptionUsed); // 4 weeks
      case 'study':
        return this.calculateOtherLeaveBalance(6, balance.StudyUsed);
      case 'wellness':
        return this.calculateOtherLeaveBalance(2, balance.WellnessUsed);
      default:
        return this.calculateAnnualLeaveBalance(balance, employeeStartDate);
    }
  }

  // Get all leave balances for an employee
  static getAllLeaveBalances(balance: EmployeeBalance, employeeStartDate?: string) {
    return {
      annual: this.calculateAnnualLeaveBalance(balance, employeeStartDate),
      sick: this.calculateOtherLeaveBalance(36, balance.SickUsed),
      maternity: this.calculateOtherLeaveBalance(3, balance.MaternityUsed), // 3 months
      parental: this.calculateOtherLeaveBalance(4, balance.ParentalUsed), // 4 weeks
      family: this.calculateOtherLeaveBalance(3, balance.FamilyUsed),
      adoption: this.calculateOtherLeaveBalance(4, balance.AdoptionUsed), // 4 weeks
      study: this.calculateOtherLeaveBalance(6, balance.StudyUsed),
      wellness: this.calculateOtherLeaveBalance(2, balance.WellnessUsed)
    };
  }
}
