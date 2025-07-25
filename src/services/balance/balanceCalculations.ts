
import { EmployeeBalance } from '../balanceService';
import { AccumulatedLeaveCalculations } from './calculations/accumulatedLeaveCalculations';
import { TerminationCalculations } from './calculations/terminationCalculations';
import { CurrentBalanceCalculations } from './calculations/currentBalanceCalculations';

export class BalanceCalculations {
  // Delegate to AccumulatedLeaveCalculations
  static hasTerminationDatePassed(terminationDate?: string): boolean {
    return TerminationCalculations.hasTerminationDatePassed(terminationDate);
  }

  static calculateAccumulatedLeave(currentDate: Date = new Date(), terminationDate?: string, startDate?: string): number {
    return AccumulatedLeaveCalculations.calculateAccumulatedLeave(currentDate, terminationDate, startDate);
  }

  static calculateAccumulatedLeaveAtTerminationDate(terminationDate: string): number {
    return AccumulatedLeaveCalculations.calculateAccumulatedLeaveAtTerminationDate(terminationDate);
  }

  static calculateAccumulatedLeaveAtEndOfPreviousMonth(terminationDate: string): number {
    return AccumulatedLeaveCalculations.calculateAccumulatedLeaveAtEndOfPreviousMonth(terminationDate);
  }

  // Delegate to TerminationCalculations
  static calculateTerminationProration(terminationDate: string): number {
    return TerminationCalculations.calculateTerminationProration(terminationDate);
  }

  static calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
    return TerminationCalculations.calculateTerminationBalance(balance, terminationDate);
  }

  // Delegate to CurrentBalanceCalculations
  static calculateAnnualLeaveBalance(balance: EmployeeBalance, employeeStartDate?: string): number {
    return CurrentBalanceCalculations.calculateAnnualLeaveBalance(balance, employeeStartDate);
  }

  static calculateOtherLeaveBalance(yearlyAllocation: number, used: number): number {
    return CurrentBalanceCalculations.calculateOtherLeaveBalance(yearlyAllocation, used);
  }

  static calculateCurrentBalance(balance: EmployeeBalance, leaveType: string = 'annual', employeeStartDate?: string): number {
    return CurrentBalanceCalculations.calculateCurrentBalance(balance, leaveType, employeeStartDate);
  }

  static getAllLeaveBalances(balance: EmployeeBalance, employeeStartDate?: string) {
    return CurrentBalanceCalculations.getAllLeaveBalances(balance, employeeStartDate);
  }

  // Legacy methods for backward compatibility
  static calculateProratedAccumulationFromStartDate(startDate: string, currentYear: number = new Date().getFullYear()): number {
    // For new system, this should use the calculateAccumulatedLeave method with the provided start date
    return this.calculateAccumulatedLeave(new Date(), undefined, startDate);
  }

  static calculateMonthlyAccumulation(currentMonth: number = new Date().getMonth() + 1, terminationDate?: string, startDate?: string): number {
    // For new system, convert to use calculateAccumulatedLeave
    return this.calculateAccumulatedLeave(new Date(), terminationDate, startDate);
  }

  static calculateProRatedAccumulation(terminationDate: string): number {
    // For termination balance, use the new proration calculation
    return this.calculateTerminationProration(terminationDate);
  }
}
