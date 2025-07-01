
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function calculateWorkingDays(startDate: string, endDate: string): Promise<number> {
  try {
    const response = await fetch('/api/leave/working-days', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ startDate, endDate })
    });

    if (!response.ok) {
      throw new Error('Failed to calculate working days');
    }

    const data = await response.json();
    return data.workingDays || 0;
  } catch (error) {
    console.error('Error calculating working days:', error);
    throw error;
  }
}
