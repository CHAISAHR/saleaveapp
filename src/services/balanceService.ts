
import { BalanceCalculations } from './balance/balanceCalculations';
import { BalanceApiClient } from './balance/balanceApiClient';
import { BalanceValidations } from './balance/balanceValidations';

// Balance management service for automatic updates and calculations
export interface EmployeeBalance {
  BalanceID: number;
  EmployeeName: string;
  EmployeeEmail: string;
  Department: string;
  Year: number;
  Broughtforward: number;
  Annual: number;
  AccumulatedLeave: number; // Monthly accumulation (1.667 per month)
  AnnualUsed: number;
  Forfeited: number;
  Annual_leave_adjustments: number;
  SickUsed: number;
  MaternityUsed: number;
  ParentalUsed: number;
  FamilyUsed: number;
  AdoptionUsed: number;
  StudyUsed: number;
  WellnessUsed: number; // Renamed from MentalhealthUsed
  Current_leave_balance: number;
  Manager: string;
  Contract_termination_date?: string;
  termination_balance?: number;
  Start_date?: string; // Employee start date for prorated calculations
}

export interface LeaveRequest {
  LeaveID: number;
  Title: string;
  Detail: string;
  StartDate: string;
  EndDate: string;
  LeaveType: string;
  Requester: string;
  Approver?: string;
  Status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  workingDays: number;
}

class BalanceService {
  // Delegation methods for calculations
  hasTerminationDatePassed(terminationDate?: string): boolean {
    return BalanceCalculations.hasTerminationDatePassed(terminationDate);
  }

  calculateMonthlyAccumulation(currentMonth: number = new Date().getMonth() + 1, terminationDate?: string): number {
    return BalanceCalculations.calculateMonthlyAccumulation(currentMonth, terminationDate);
  }

  calculateProratedAccumulationFromStartDate(startDate: string, currentYear: number = new Date().getFullYear()): number {
    return BalanceCalculations.calculateProratedAccumulationFromStartDate(startDate, currentYear);
  }

  calculateProRatedAccumulation(terminationDate: string): number {
    return BalanceCalculations.calculateProRatedAccumulation(terminationDate);
  }

  calculateAnnualLeaveBalance(balance: EmployeeBalance, employeeStartDate?: string): number {
    return BalanceCalculations.calculateAnnualLeaveBalance(balance, employeeStartDate);
  }

  calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
    return BalanceCalculations.calculateTerminationBalance(balance, terminationDate);
  }

  calculateOtherLeaveBalance(yearlyAllocation: number, used: number): number {
    return BalanceCalculations.calculateOtherLeaveBalance(yearlyAllocation, used);
  }

  calculateCurrentBalance(balance: EmployeeBalance, leaveType: string = 'annual', employeeStartDate?: string): number {
    return BalanceCalculations.calculateCurrentBalance(balance, leaveType, employeeStartDate);
  }

  getAllLeaveBalances(balance: EmployeeBalance, employeeStartDate?: string) {
    return BalanceCalculations.getAllLeaveBalances(balance, employeeStartDate);
  }

  // Delegation methods for validations
  getEmployeeStatus(terminationDate?: string): string {
    return BalanceValidations.getEmployeeStatus(terminationDate);
  }

  canStaffEditLeave(leaveRequest: LeaveRequest): boolean {
    return BalanceValidations.canStaffEditLeave(leaveRequest);
  }

  validateLeaveBalance(balance: EmployeeBalance, leaveType: string, requestedDays: number): boolean {
    return BalanceValidations.validateLeaveBalance(balance, leaveType, requestedDays);
  }

  // Delegation methods for API operations
  async getEmployeeBalance(employeeEmail: string, year: number = new Date().getFullYear()): Promise<EmployeeBalance | null> {
    return BalanceApiClient.getEmployeeBalance(employeeEmail, year);
  }

  async updateBalanceOnCancellation(leaveRequest: LeaveRequest): Promise<void> {
    return BalanceApiClient.updateBalanceOnCancellation(leaveRequest);
  }

  async updateBalanceOnApproval(leaveRequest: LeaveRequest): Promise<void> {
    return BalanceApiClient.updateBalanceOnApproval(leaveRequest);
  }
}

export const balanceService = new BalanceService();
