
import { apiConfig } from '@/config/apiConfig';
import { EmployeeBalance, LeaveRequest } from '../balanceService';

export class BalanceApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private static async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${apiConfig.endpoints.balance}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get employee balance
  static async getEmployeeBalance(employeeEmail: string, year: number = new Date().getFullYear()): Promise<EmployeeBalance | null> {
    try {
      const response = await this.apiRequest(`/${employeeEmail}?year=${year}`);
      return response.balance;
    } catch (error) {
      console.error('Failed to get employee balance:', error);
      return null;
    }
  }

  // Update balance when leave is cancelled (restore the days)
  static async updateBalanceOnCancellation(leaveRequest: LeaveRequest): Promise<void> {
    try {
      await this.apiRequest('/update', {
        method: 'PUT',
        body: JSON.stringify({
          employeeEmail: leaveRequest.Requester,
          leaveType: leaveRequest.LeaveType.toLowerCase(),
          daysUsed: leaveRequest.workingDays,
          action: 'cancel',
          year: new Date().getFullYear()
        })
      });
      
      console.log('Balance restored for cancelled leave:', leaveRequest);
    } catch (error) {
      console.error('Failed to restore balance:', error);
      throw error;
    }
  }

  // Update balance when leave is approved
  static async updateBalanceOnApproval(leaveRequest: LeaveRequest): Promise<void> {
    try {
      await this.apiRequest('/update', {
        method: 'PUT',
        body: JSON.stringify({
          employeeEmail: leaveRequest.Requester,
          leaveType: leaveRequest.LeaveType.toLowerCase(),
          daysUsed: leaveRequest.workingDays,
          action: 'approve',
          year: new Date().getFullYear()
        })
      });
      
      console.log('Balance updated for approved leave:', leaveRequest);
    } catch (error) {
      console.error('Failed to update balance:', error);
      throw error;
    }
  }
}
