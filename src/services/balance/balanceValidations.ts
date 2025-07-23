
import { EmployeeBalance, LeaveRequest } from '../balanceService';
import { BalanceCalculations } from './balanceCalculations';

export class BalanceValidations {
  // Get employee status based on termination date
  static getEmployeeStatus(terminationDate?: string): string {
    if (terminationDate && BalanceCalculations.hasTerminationDatePassed(terminationDate)) {
      return 'Inactive';
    }
    return 'Active';
  }

  // Check if staff can edit leave request
  static canStaffEditLeave(leaveRequest: LeaveRequest): boolean {
    if (leaveRequest.Status !== 'pending') {
      return false;
    }
    
    const startDate = new Date(leaveRequest.StartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can only edit if the first day of leave has not passed
    return startDate > today;
  }

  // Validate if employee has sufficient balance
  static validateLeaveBalance(balance: EmployeeBalance, leaveType: string, requestedDays: number): boolean {
    const currentBalance = BalanceCalculations.calculateCurrentBalance(balance, leaveType);
    
    switch (leaveType.toLowerCase()) {
      case 'annual':
        return currentBalance >= requestedDays;
      case 'sick':
        return BalanceCalculations.calculateOtherLeaveBalance(36, balance.SickUsed) >= requestedDays;
      case 'family':
        return BalanceCalculations.calculateOtherLeaveBalance(3, balance.FamilyUsed) >= requestedDays;
      case 'study':
        return BalanceCalculations.calculateOtherLeaveBalance(6, balance.StudyUsed) >= requestedDays;
      case 'wellness':
        return BalanceCalculations.calculateOtherLeaveBalance(2, balance.WellnessUsed) >= requestedDays;
      case 'maternity':
        return BalanceCalculations.calculateOtherLeaveBalance(90, balance.MaternityUsed) >= requestedDays;
      case 'parental':
        return BalanceCalculations.calculateOtherLeaveBalance(20, balance.ParentalUsed) >= requestedDays;
      case 'adoption':
        return BalanceCalculations.calculateOtherLeaveBalance(20, balance.AdoptionUsed) >= requestedDays;
      default:
        return false;
    }
  }
}
