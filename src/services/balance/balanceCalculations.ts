
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

  // Calculate prorated monthly accumulation based on employee start date
  static calculateProratedAccumulationFromStartDate(startDate: string, currentYear: number = new Date().getFullYear()): number {
    const start = new Date(startDate);
    const startYear = start.getFullYear();
    
    // If employee started before current year, use full year accumulation
    if (startYear < currentYear) {
      return this.calculateMonthlyAccumulation();
    }
    
    // If employee started in current year, calculate from start date
    if (startYear === currentYear) {
      const startMonth = start.getMonth() + 1; // 1-based month
      const startDay = start.getDate();
      const currentMonth = new Date().getMonth() + 1;
      
      let totalAccumulation = 0;
      
      // Calculate for each month from start month to current month
      for (let month = startMonth; month <= currentMonth; month++) {
        if (month === startMonth) {
          // First month: prorate based on days worked
          const daysInStartMonth = new Date(currentYear, startMonth, 0).getDate();
          const daysWorked = daysInStartMonth - startDay + 1;
          const monthlyRate = 1.667;
          const dailyRate = monthlyRate / daysInStartMonth;
          totalAccumulation += dailyRate * daysWorked;
        } else {
          // Full months
          totalAccumulation += 1.667;
        }
      }
      
      console.log(`Prorated accumulation for employee starting ${startDate}:`, {
        startMonth,
        startDay,
        currentMonth,
        totalAccumulation: totalAccumulation.toFixed(2)
      });
      
      return Number(totalAccumulation.toFixed(1));
    }
    
    // If employee starts in future, no accumulation yet
    return 0;
  }

  // Calculate monthly accumulation for annual leave (1.667 per month up to current month)
  static calculateMonthlyAccumulation(currentMonth: number = new Date().getMonth() + 1, terminationDate?: string): number {
    // If termination date has passed, use accumulation up to termination date only
    if (terminationDate && this.hasTerminationDatePassed(terminationDate)) {
      return this.calculateProRatedAccumulation(terminationDate);
    }
    
    return Number((1.667 * currentMonth).toFixed(1));
  }

  // Calculate pro-rated monthly accumulation based on exact termination date
  static calculateProRatedAccumulation(terminationDate: string): number {
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

  // Calculate current annual leave balance using AccumulatedLeave with prorated start date consideration
  static calculateAnnualLeaveBalance(balance: EmployeeBalance, employeeStartDate?: string): number {
    if (balance.Contract_termination_date && this.hasTerminationDatePassed(balance.Contract_termination_date)) {
      return this.calculateTerminationBalance(balance, balance.Contract_termination_date);
    }
    
    // Use prorated accumulation if employee start date is provided
    let accumulatedLeave = balance.AccumulatedLeave;
    if (employeeStartDate) {
      accumulatedLeave = this.calculateProratedAccumulationFromStartDate(employeeStartDate, balance.Year);
    }
    
    return Number((
      balance.Broughtforward + 
      accumulatedLeave - 
      balance.AnnualUsed - 
      balance.Forfeited - 
      balance.Annual_leave_adjustments
    ).toFixed(1));
  }

  // Calculate annual leave balance at termination date with pro-rating
  static calculateTerminationBalance(balance: EmployeeBalance, terminationDate: string): number {
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
