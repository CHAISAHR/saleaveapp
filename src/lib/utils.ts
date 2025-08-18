
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to normalize role comparison (case-insensitive)
export function normalizeRole(role: string): string {
  return role?.toLowerCase() || '';
}

// Helper function for case-insensitive role comparison
export function isRole(userRole: string, expectedRole: string): boolean {
  return normalizeRole(userRole) === normalizeRole(expectedRole);
}

// Helper function to check if user has any of the specified roles
export function hasAnyRole(userRole: string, expectedRoles: string[]): boolean {
  const normalizedUserRole = normalizeRole(userRole);
  return expectedRoles.some(role => normalizedUserRole === normalizeRole(role));
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
