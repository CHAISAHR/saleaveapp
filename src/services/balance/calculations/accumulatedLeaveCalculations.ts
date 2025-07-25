
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
    
    // Calculate accumulated leave from employee start date to calculation date
    let totalAccumulated = 0;
    
    // Start from the month the employee began
    let currentMonth = employeeStartDate.getMonth();
    let currentYear = employeeStartDate.getFullYear();
    
    while (currentYear < calculationDate.getFullYear() || 
           (currentYear === calculationDate.getFullYear() && currentMonth <= calculationDate.getMonth())) {
      
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0); // Last day of month
      
      // Determine the actual period worked in this month
      const periodStart = currentYear === employeeStartDate.getFullYear() && currentMonth === employeeStartDate.getMonth() 
        ? employeeStartDate 
        : monthStart;
      
      const periodEnd = currentYear === calculationDate.getFullYear() && currentMonth === calculationDate.getMonth()
        ? calculationDate
        : monthEnd;
      
      // Calculate days worked in this month
      const daysInMonth = monthEnd.getDate();
      const daysWorked = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate prorated leave for this month (1.667 days per full month)
      const monthlyLeave = 1.667 * (daysWorked / daysInMonth);
      
      // Only add leave if the 27th has passed (or if we're calculating for a past month)
      const monthEarningDate = new Date(currentYear, currentMonth, 27);
      if (calculationDate >= monthEarningDate || currentMonth < calculationDate.getMonth() || currentYear < calculationDate.getFullYear()) {
        totalAccumulated += monthlyLeave;
      }
      
      console.log(`Month ${currentMonth + 1}/${currentYear}:`, {
        daysInMonth,
        daysWorked,
        monthlyLeave: Number(monthlyLeave.toFixed(3)),
        earned: calculationDate >= monthEarningDate || currentMonth < calculationDate.getMonth() || currentYear < calculationDate.getFullYear()
      });
      
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
    }
    
    // Cap at 20 days maximum
    const accumulated = Math.min(totalAccumulated, 20);
    
    
    console.log(`AccumulatedLeave final calculation:`, {
      year,
      calculationDate: calculationDate.toISOString().split('T')[0],
      employeeStartDate: employeeStartDate.toISOString().split('T')[0],
      totalAccumulated: Number(totalAccumulated.toFixed(3)),
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
