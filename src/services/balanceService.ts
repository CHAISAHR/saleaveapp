
// Balance management service for automatic updates and calculations
export interface EmployeeBalance {
  BalanceID: number;
  EmployeeName: string;
  EmployeeEmail: string;
  Department: string;
  Year: number;
  Broughtforward: number;
  Annual: number;
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
  // Calculate monthly accrual for annual leave (20/12 = 1.6667 days per month)
  calculateMonthlyAccrual(monthsWorked: number): number {
    return Number((monthsWorked * (20/12)).toFixed(1));
  }

  // Calculate current annual leave balance
  // Formula: Broughtforward + Monthly Earned (20/12 per month) - AnnualUsed - Forfeited - Annual_leave_adjustments
  calculateAnnualLeaveBalance(balance: EmployeeBalance, monthsWorked: number = 12): number {
    const monthlyEarned = this.calculateMonthlyAccrual(monthsWorked);
    return Number((
      balance.Broughtforward + 
      monthlyEarned - 
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
  calculateCurrentBalance(balance: EmployeeBalance, leaveType: string = 'annual', monthsWorked: number = 12): number {
    switch (leaveType.toLowerCase()) {
      case 'annual':
        return this.calculateAnnualLeaveBalance(balance, monthsWorked);
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
      case 'wellness':
      case 'mentalhealth':
        return this.calculateOtherLeaveBalance(2, balance.MentalhealthUsed);
      default:
        // Default to annual leave calculation
        return this.calculateAnnualLeaveBalance(balance, monthsWorked);
    }
  }

  // Update balance when leave is approved
  async updateBalanceOnApproval(leaveRequest: LeaveRequest): Promise<void> {
    console.log('Updating balance for approved leave:', leaveRequest);
    
    // In a real application, this would make an API call to update the database
    const updateData = {
      employeeEmail: leaveRequest.Requester,
      leaveType: leaveRequest.LeaveType.toLowerCase(),
      daysUsed: leaveRequest.workingDays,
      year: new Date().getFullYear()
    };

    // Simulate API call to update balance
    console.log('Balance update data:', updateData);
    
    // This would be the actual database update logic
    // await fetch('/api/balances/update', {
    //   method: 'POST',
    //   body: JSON.stringify(updateData)
    // });
  }

  // Get employee balance
  async getEmployeeBalance(employeeEmail: string, year: number = new Date().getFullYear()): Promise<EmployeeBalance | null> {
    // In a real application, this would fetch from the database
    console.log(`Fetching balance for ${employeeEmail} for year ${year}`);
    
    // Mock data for now
    const mockBalance = {
      BalanceID: 1,
      EmployeeName: "John Smith",
      EmployeeEmail: employeeEmail,
      Department: "Marketing",
      Year: year,
      Broughtforward: 5,
      Annual: 20,
      AnnualUsed: 8,
      Forfeited: 0,
      Annual_leave_adjustments: 0,
      SickUsed: 2,
      MaternityUsed: 0,
      ParentalUsed: 0,
      FamilyUsed: 1,
      AdoptionUsed: 0,
      StudyUsed: 0,
      MentalhealthUsed: 0,
      Current_leave_balance: 0, // Will be calculated
      Manager: "sarah.johnson@company.com"
    };

    // Calculate current annual leave balance
    mockBalance.Current_leave_balance = this.calculateAnnualLeaveBalance(mockBalance, 12);

    return mockBalance;
  }

  // Validate if employee has sufficient balance
  validateLeaveBalance(balance: EmployeeBalance, leaveType: string, requestedDays: number, monthsWorked: number = 12): boolean {
    const currentBalance = this.calculateCurrentBalance(balance, leaveType, monthsWorked);
    
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
  getAllLeaveBalances(balance: EmployeeBalance, monthsWorked: number = 12) {
    return {
      annual: this.calculateAnnualLeaveBalance(balance, monthsWorked),
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
