
import { EmployeeBalance } from '../../balanceService';

export class AccumulatedLeaveCalculations {
  // Calculate AccumulatedLeave with correct prorated formula
  // Formula: (days worked in start month / total days in start month) * 1.667 + (complete months * 1.667)
  // Leave is earned on the last day of each month
  static calculateAccumulatedLeave(currentDate: Date = new Date(), terminationDate?: string, startDate?: string): number {
    console.log(`AccumulatedLeave calculation input:`, {
      currentDate: currentDate.toISOString().split('T')[0],
      terminationDate,
      startDate
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
    
    let totalAccumulated = 0;
    
    // Calculate first month proration
    const startMonth = employeeStartDate.getMonth();
    const startYear = employeeStartDate.getFullYear();
    
    // Only process if within the calculation year
    if (startYear === year) {
      const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
      const startDay = employeeStartDate.getDate();
      const daysWorkedInStartMonth = daysInStartMonth - startDay + 1;
      
      // Check if the start month has ended (leave is earned on last day of month)
      const startMonthEndDate = new Date(startYear, startMonth + 1, 0);
      if (calculationDate >= startMonthEndDate) {
        const firstMonthLeave = (daysWorkedInStartMonth / daysInStartMonth) * 1.667;
        totalAccumulated += firstMonthLeave;
        
        console.log(`Start month ${startMonth + 1}/${startYear}:`, {
          daysInMonth: daysInStartMonth,
          startDay,
          daysWorked: daysWorkedInStartMonth,
          earned: Number(firstMonthLeave.toFixed(3))
        });
      }
      
      // Calculate complete months after start month
      let currentMonth = startMonth + 1;
      let currentYear = startYear;
      
      while (currentYear < calculationDate.getFullYear() || 
             (currentYear === calculationDate.getFullYear() && currentMonth < calculationDate.getMonth())) {
        
        // Check if this complete month has ended
        const monthEndDate = new Date(currentYear, currentMonth + 1, 0);
        if (calculationDate >= monthEndDate) {
          totalAccumulated += 1.667;
          
          console.log(`Complete month ${currentMonth + 1}/${currentYear}:`, {
            earned: 1.667
          });
        }
        
        currentMonth += 1;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear += 1;
        }
      }
    } else {
      // If start date is before current year, calculate complete months from Jan 1
      let currentMonth = 0;
      
      while (currentMonth < calculationDate.getMonth()) {
        const monthEndDate = new Date(year, currentMonth + 1, 0);
        if (calculationDate >= monthEndDate) {
          totalAccumulated += 1.667;
          
          console.log(`Complete month ${currentMonth + 1}/${year}:`, {
            earned: 1.667
          });
        }
        
        currentMonth += 1;
      }
    }
    
    // Cap at 20 days maximum
    const accumulated = Math.min(totalAccumulated, 20);
    
    console.log(`AccumulatedLeave final calculation:`, {
      year,
      calculationDate: calculationDate.toISOString().split('T')[0],
      employeeStartDate: employeeStartDate.toISOString().split('T')[0],
      totalAccumulated: Number(totalAccumulated.toFixed(3)),
      accumulated: Number(accumulated.toFixed(3))
    });
    
    return Number(accumulated.toFixed(3));
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
