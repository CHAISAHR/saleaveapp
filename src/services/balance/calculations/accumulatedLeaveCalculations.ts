
import { EmployeeBalance } from '../../balanceService';

export class AccumulatedLeaveCalculations {
  // Calculate AccumulatedLeave - starts at 0, accumulates 1.667 at end of each completed month
  // Now supports start date for proper proration
  static calculateAccumulatedLeave(currentDate: Date = new Date(), terminationDate?: string, startDate?: string): number {
    console.log(`AccumulatedLeave calculation input:`, {
      currentDate: currentDate.toISOString(),
      terminationDate,
      startDate,
      currentMonth: currentDate.getMonth() + 1,
      currentDay: currentDate.getDate()
    });

    const year = currentDate.getFullYear();
    const targetDate = terminationDate ? new Date(terminationDate) : currentDate;
    
    // If termination date is in a different year, use end of that year or current date
    const calculationDate = targetDate.getFullYear() === year ? targetDate : currentDate;
    
    // Handle start date logic
    let employeeStartDate: Date;
    if (startDate) {
      employeeStartDate = new Date(startDate);
      // If employee started before the current year, calculate from beginning of year
      if (employeeStartDate.getFullYear() < year) {
        employeeStartDate = new Date(year, 0, 1); // January 1st of current year
      }
      // If employee starts after the calculation date, no accumulated leave
      if (employeeStartDate > calculationDate) {
        console.log(`Employee starts after calculation date - no accumulated leave earned yet`);
        return 0;
      }
    } else {
      // Default to beginning of year if no start date provided
      employeeStartDate = new Date(year, 0, 1);
    }
    
    console.log(`AccumulatedLeave dates:`, {
      year,
      targetDate: targetDate.toISOString(),
      calculationDate: calculationDate.toISOString(),
      employeeStartDate: employeeStartDate.toISOString(),
      calculationMonth: calculationDate.getMonth() + 1,
      calculationDay: calculationDate.getDate()
    });
    
    // Calculate months from employee start date to calculation date
    let monthsWorked = 0;
    
    // Start from the month the employee began
    let currentMonth = employeeStartDate.getMonth();
    let currentYear = employeeStartDate.getFullYear();
    
    // If employee started in current year, need to check if they earned leave for their first month
    if (employeeStartDate.getFullYear() === year) {
      // If employee started after the 27th of their first month, they don't earn that month's leave
      if (employeeStartDate.getDate() > 27) {
        currentMonth += 1; // Skip the first month
      }
    }
    
    // Count completed months where leave was earned (on or after 27th)
    while (currentYear < calculationDate.getFullYear() || 
           (currentYear === calculationDate.getFullYear() && currentMonth <= calculationDate.getMonth())) {
      
      // Check if this month's leave has been earned
      if (currentYear < calculationDate.getFullYear() || 
          (currentYear === calculationDate.getFullYear() && currentMonth < calculationDate.getMonth()) ||
          (currentYear === calculationDate.getFullYear() && currentMonth === calculationDate.getMonth() && calculationDate.getDate() >= 27)) {
        monthsWorked += 1;
      }
      
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
    }
    
    console.log(`Months calculation:`, {
      employeeStartDate: employeeStartDate.toISOString().split('T')[0],
      calculationDate: calculationDate.toISOString().split('T')[0],
      monthsWorked
    });
    
    // Accumulate 1.667 for each completed month, max 20 days (12 months * 1.667 = 20.004)
    const accumulated = Math.min(monthsWorked * 1.667, 20);
    
    console.log(`AccumulatedLeave final calculation:`, {
      year,
      calculationDate: calculationDate.toISOString().split('T')[0],
      employeeStartDate: employeeStartDate.toISOString().split('T')[0],
      monthsWorked,
      rawAccumulated: monthsWorked * 1.667,
      accumulated: Number(accumulated.toFixed(1))
    });
    
    return Number(accumulated.toFixed(1));
  }

  // Calculate accumulated leave at termination date based on calendar days from beginning of year
  static calculateAccumulatedLeaveAtTerminationDate(terminationDate: string): number {
    const termDate = new Date(terminationDate);
    const year = termDate.getFullYear();
    
    // Get first day of the year
    const yearStart = new Date(year, 0, 1);
    
    // Get last day of the year
    const yearEnd = new Date(year, 11, 31);
    
    // Calculate calendar days from beginning of year to termination date
    const calendarDaysFromYearStart = Math.floor((termDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate total calendar days in the termination year
    const totalCalendarDaysInYear = Math.floor((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate accumulated leave: 20 * (calendar days from start of year / total calendar days in year)
    const accumulatedLeave = 20 * (calendarDaysFromYearStart / totalCalendarDaysInYear);
    
    console.log(`AccumulatedLeave at termination date ${terminationDate}:`, {
      year,
      calendarDaysFromYearStart,
      totalCalendarDaysInYear,
      accumulatedLeave: Number(accumulatedLeave.toFixed(1))
    });
    
    return Number(accumulatedLeave.toFixed(1));
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
}
