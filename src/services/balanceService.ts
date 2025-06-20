import { apiConfig } from '@/config/apiConfig';

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
  MentalhealthUsed: number;
  Current_leave_balance: number;
  Manager: string;
  Contract_termination_date?: string;
  termination_balance?: number;
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
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${apiConfig.endpoints.balance}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Check if employee's termination date has passed
  hasTerminationDatePassed(terminationDate?: string): boolean {
    if (!terminationDate) return false;
    
    const termDate = new Date(terminationDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return termDate < today;
  }

  // Calculate monthly accumulation for annual leave (1.667 per month up to current month)
  calculateMonthlyAccumulation(currentMonth: number = new Date().getMonth() + 1, terminationDate?: string): number {
    // If termination date has passed, use accumulation up to termination date only
    if (terminationDate && this.hasTerminationDatePassed(terminationDate)) {
      return this.calculateProRatedAccumulation(terminationDate);
    }
    
    return Number((1.667 * currentMonth).toFixed(1));
  }

  // Calculate pro-rated monthly accumulation based on exact termination date
  calculateProRatedAccumulation(terminationDate: string): number {
    const termDate = new Date(terminationDate);
    const year = termDate.getFullYear();
    const month = termDate.getMonth() + 1;
    const day = termDate.getDate();
    
    // Get the last day of the termination month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    
    // Calculate completed months (full accumulation)
    const completedMonths = month - 1;
    const completedMonthsAccumulation = 1.667 * completedMonths;
    
    // Calculate pro-rated accumulation for the termination month
    const daysWorkedInMonth = day;
    const monthlyRate = 1.667;
    const dailyRate = monthlyRate / lastDayOfMonth;
    const partialMonthAccumulation = dailyRate * daysWorkedInMonth;
    
    const totalAccumulation = completedMonthsAccumulation + partialMonthAccumulation;
    
    console.log(`Pro-rated calculation for ${terminationDate}:`, {
      completedMonths,
      completedMonthsAccumulation: completedMonthsAccumulation.toFixed(2),
      daysWorkedInMonth,
      lastDayOfMonth,
      dailyRate: dailyRate.toFixed(4),
      partialMonthAccumulation: partialMonthAccumulation.toFixed(2),
      totalAccumulation: totalAccumulation.toFixed(2)
    });
    
    return Number(totalAccumulation.toFixed(1));
  }

  // Calculate current annual leave balance using AccumulatedLeave
  calculateAnnualLeaveBalance(balance: EmployeeBalance): number {
    if (balance.Contract_termination_date && this.hasTerminationDatePassed(balance.Contract_termination_date)) {
      return this.calculateTerminationBalance(balance, balance.Contract_termination_date);
    }
    
    return Number((
      balance.Broughtforward + 
      balance.AccumulatedLeave - 
      balance.AnnualUsed - 
      balance.Forfeited - 
      balance.Annual_leave_adjustments
    ).toFixed(1));
  }

  // Calculate annual leave balance at termination date with pro-rating
  calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
    const proRatedAccumulation = this.calculateProRatedAccumulation(terminationDate);
    
    return Number((
      balance.Broughtforward + 
      proRatedAccumulation - 
      balance.AnnualUsed - 
      balance.Forfeited - 
      balance.Annual_leave_adjustments
    ).toFixed(1));
  }

  // Calculate current balance for other leave types (yearly allocation - used)
  calculateOtherLeaveBalance(yearlyAllocation: number, used: number): number {
    return Number((yearlyAllocation - used).toFixed(1));
  }

  // Calculate current balance based on leave type
  calculateCurrentBalance(balance: EmployeeBalance, leaveType: string = 'annual'): number {
    switch (leaveType.toLowerCase()) {
      case 'annual':
        return this.calculateAnnualLeaveBalance(balance);
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
        return this.calculateAnnualLeaveBalance(balance);
    }
  }

  // Get employee status based on termination date
  getEmployeeStatus(terminationDate?: string): string {
    if (terminationDate && this.hasTerminationDatePassed(terminationDate)) {
      return 'Inactive';
    }
    return 'Active';
  }

  // Check if staff can edit leave request
  canStaffEditLeave(leaveRequest: LeaveRequest): boolean {
    if (leaveRequest.Status !== 'pending') {
      return false;
    }
    
    const startDate = new Date(leaveRequest.StartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return startDate >= today;
  }

  // Update balance when leave is cancelled (restore the days)
  async updateBalanceOnCancellation(leaveRequest: LeaveRequest): Promise<void> {
    try {
      await this.apiRequest('/update', {
        method: 'PUT',
        body: JSON.stringify({
          employeeEmail: leaveRequest.Requester,
          leaveType: leaveRequest.LeaveType.toLowerCase(),
          daysUsed: leaveRequest.workingDays,
          action: 'cancel',
          year: new Date().getFullYear()
        })
      });
      
      console.log('Balance restored for cancelled leave:', leaveRequest);
    } catch (error) {
      console.error('Failed to restore balance:', error);
      throw error;
    }
  }

  // Update balance when leave is approved
  async updateBalanceOnApproval(leaveRequest: LeaveRequest): Promise<void> {
    try {
      await this.apiRequest('/update', {
        method: 'PUT',
        body: JSON.stringify({
          employeeEmail: leaveRequest.Requester,
          leaveType: leaveRequest.LeaveType.toLowerCase(),
          daysUsed: leaveRequest.workingDays,
          action: 'approve',
          year: new Date().getFullYear()
        })
      });
      
      console.log('Balance updated for approved leave:', leaveRequest);
    } catch (error) {
      console.error('Failed to update balance:', error);
      throw error;
    }
  }

  // Get employee balance
  async getEmployeeBalance(employeeEmail: string, year: number = new Date().getFullYear()): Promise<EmployeeBalance | null> {
    try {
      const response = await this.apiRequest(`/${employeeEmail}?year=${year}`);
      return response.balance;
    } catch (error) {
      console.error('Failed to get employee balance:', error);
      return null;
    }
  }

  // Validate if employee has sufficient balance
  validateLeaveBalance(balance: EmployeeBalance, leaveType: string, requestedDays: number): boolean {
    const currentBalance = this.calculateCurrentBalance(balance, leaveType);
    
    switch (leaveType.toLowerCase()) {
      case 'annual':
        return currentBalance >= requestedDays;
      case 'sick':
        return this.calculateOtherLeaveBalance(36, balance.SickUsed) >= requestedDays;
      case 'family':
        return this.calculateOtherLeaveBalance(3, balance.FamilyUsed) >= requestedDays;
      case 'study':
        return this.calculateOtherLeaveBalance(6, balance.StudyUsed) >= requestedDays;
      case 'wellness':
      case 'mentalhealth':
        return this.calculateOtherLeaveBalance(2, balance.MentalhealthUsed) >= requestedDays;
      case 'maternity':
        return this.calculateOtherLeaveBalance(90, balance.MaternityUsed) >= requestedDays;
      case 'parental':
        return this.calculateOtherLeaveBalance(20, balance.ParentalUsed) >= requestedDays;
      case 'adoption':
        return this.calculateOtherLeaveBalance(20, balance.AdoptionUsed) >= requestedDays;
      default:
        return false;
    }
  }

  // Get all leave balances for an employee
  getAllLeaveBalances(balance: EmployeeBalance) {
    return {
      annual: this.calculateAnnualLeaveBalance(balance),
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

export const balanceService = new BalanceService();
