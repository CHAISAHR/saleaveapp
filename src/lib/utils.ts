
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  publicHolidays: Date[] = [],
  companyHolidays: Date[] = [],
  isHalfDay: boolean = false
): number {
  if (startDate > endDate) return 0;

  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    
    const isPublicHoliday = publicHolidays.some(holiday => 
      holiday.getDate() === currentDate.getDate() &&
      holiday.getMonth() === currentDate.getMonth() &&
      holiday.getFullYear() === currentDate.getFullYear()
    );
    
    const isCompanyHoliday = companyHolidays.some(holiday => 
      holiday.getDate() === currentDate.getDate() &&
      holiday.getMonth() === currentDate.getMonth() &&
      holiday.getFullYear() === currentDate.getFullYear()
    );

    if (!isWeekend && !isPublicHoliday && !isCompanyHoliday) {
      workingDays += isHalfDay ? 0.5 : 1;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}
