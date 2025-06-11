
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
  // Calculate monthly accrual (1.6667 days per month)
  calculateMonthlyAccrual(monthsWorked: number): number {
    return Number((monthsWorked * 1.6667).toFixed(1));
  }

  // Calculate current annual leave balance
  calculateCurrentBalance(balance: EmployeeBalance): number {
    return Number((
      balance.Broughtforward + 
      balance.Annual - 
      balance.AnnualUsed - 
      balance.Forfeited - 
      balance.Annual_leave_adjustments
    ).toFixed(1));
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
    return {
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
      Current_leave_balance: 17,
      Manager: "sarah.johnson@company.com"
    };
  }

  // Validate if employee has sufficient balance
  validateLeaveBalance(balance: EmployeeBalance, leaveType: string, requestedDays: number): boolean {
    const currentBalance = this.calculateCurrentBalance(balance);
    
    switch (leaveType.toLowerCase()) {
      case 'annual':
        return currentBalance >= requestedDays;
      case 'sick':
        return (36 - balance.SickUsed) >= requestedDays;
      case 'family':
        return (3 - balance.FamilyUsed) >= requestedDays;
      case 'study':
        return (6 - balance.StudyUsed) >= requestedDays;
      case 'wellness':
      case 'mentalhealth':
        return (2 - balance.MentalhealthUsed) >= requestedDays;
      case 'maternity':
        return (90 - balance.MaternityUsed) >= requestedDays;
      case 'parental':
        return (20 - balance.ParentalUsed) >= requestedDays;
      case 'adoption':
        return (20 - balance.AdoptionUsed) >= requestedDays;
      default:
        return false;
    }
  }
}

export const balanceService = new BalanceService();
