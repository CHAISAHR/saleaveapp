
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
    const holidays = await executeQuery(
      'SELECT * FROM company_holidays WHERE date BETWEEN ? AND ? AND office_status = "closed"',
      [startDate, endDate]
    );
    return holidays;
  }

  // Calculate working days excluding holidays
  static async calculateWorkingDaysExcludingHolidays(startDate: string, endDate: string): Promise<number> {
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
    
    return workingDays;
  }

  // Get all holidays for a specific year
  static async getHolidaysForYear(year: number): Promise<Holiday[]> {
    const holidays = await executeQuery(
      'SELECT * FROM company_holidays WHERE YEAR(date) = ? ORDER BY date',
      [year]
    );
    return holidays;
  }
}
