
import { executeQuery } from '../config/database';

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  office_status: string;
}

export class HolidayService {
  // Get holidays for a specific date range
  static async getHolidaysInRange(startDate: string, endDate: string): Promise<Holiday[]> {
    try {
      const holidays = await executeQuery(
        'SELECT * FROM company_holidays WHERE date BETWEEN ? AND ? AND office_status = "closed"',
        [startDate, endDate]
      );
      return holidays;
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return [];
    }
  }

  // Calculate working days excluding holidays and weekends
  static async calculateWorkingDaysExcludingHolidays(startDate: string, endDate: string): Promise<number> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Get holidays in the date range
      const holidays = await this.getHolidaysInRange(startDate, endDate);
      const holidayDates = new Set(holidays.map(h => h.date));
      
      let workingDays = 0;
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Count only weekdays (Monday = 1, Sunday = 0)
        // Skip weekends (Saturday = 6, Sunday = 0) and holidays
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateString)) {
          workingDays++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`Calculated working days: ${workingDays} for period ${startDate} to ${endDate}`);
      console.log(`Holidays found: ${holidays.length}`);
      
      return Math.max(workingDays, 0.5); // Minimum 0.5 days for same-day requests
    } catch (error) {
      console.error('Error calculating working days:', error);
      // Fallback calculation without holiday exclusion
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(diffDays, 0.5);
    }
  }

  // Get all holidays for a specific year
  static async getHolidaysForYear(year: number): Promise<Holiday[]> {
    try {
      const holidays = await executeQuery(
        'SELECT * FROM company_holidays WHERE YEAR(date) = ? ORDER BY date',
        [year]
      );
      return holidays;
    } catch (error) {
      console.error('Error fetching holidays for year:', error);
      return [];
    }
  }

  // Check if a specific date is a holiday
  static async isHoliday(date: string): Promise<boolean> {
    try {
      const result = await executeQuery(
        'SELECT COUNT(*) as count FROM company_holidays WHERE date = ? AND office_status = "closed"',
        [date]
      );
      return result[0]?.count > 0;
    } catch (error) {
      console.error('Error checking holiday status:', error);
      return false;
    }
  }
}
