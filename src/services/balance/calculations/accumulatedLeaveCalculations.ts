
import { EmployeeBalance } from '../../balanceService';

export class AccumulatedLeaveCalculations {
  // Calculate AccumulatedLeave - starts at 0, accumulates 1.667 at end of each completed month
  static calculateAccumulatedLeave(currentDate: Date = new Date(), terminationDate?: string): number {
    console.log(`AccumulatedLeave calculation input:`, {
      currentDate: currentDate.toISOString(),
      terminationDate,
      currentMonth: currentDate.getMonth() + 1,
      currentDay: currentDate.getDate()
    });

    const year = currentDate.getFullYear();
    const targetDate = terminationDate ? new Date(terminationDate) : currentDate;
    
    // If termination date is in a different year, use end of that year or current date
    const calculationDate = targetDate.getFullYear() === year ? targetDate : currentDate;
    
    console.log(`AccumulatedLeave dates:`, {
      year,
      targetDate: targetDate.toISOString(),
      calculationDate: calculationDate.toISOString(),
      calculationMonth: calculationDate.getMonth() + 1,
      calculationDay: calculationDate.getDate()
    });
    
    // Get completed months (leave is earned on the 27th of each month)
    let completedMonths = calculationDate.getMonth(); // 0-based months
    
    console.log(`Before 27th check - completedMonths: ${completedMonths}, date: ${calculationDate.getDate()}`);
    
    // If we're on or after the 27th of current month, include current month's leave
    if (calculationDate.getDate() >= 27) {
      completedMonths += 1;
      console.log(`After 27th check - completedMonths increased to: ${completedMonths}`);
    }
    
    // Accumulate 1.667 for each completed month, max 20 days (12 months * 1.667 = 20.004)
    const accumulated = Math.min(completedMonths * 1.667, 20);
    
    console.log(`AccumulatedLeave final calculation:`, {
      year,
      calculationDate: calculationDate.toISOString().split('T')[0],
      completedMonths,
      rawAccumulated: completedMonths * 1.667,
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
