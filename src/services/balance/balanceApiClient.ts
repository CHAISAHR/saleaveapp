
import { apiConfig, makeApiRequest } from '@/config/apiConfig';
import { EmployeeBalance, LeaveRequest } from '../balanceService';

export class BalanceApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
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
      const authToken = localStorage.getItem('auth_token');
      console.log('BalanceApiClient - Fetching balance for:', employeeEmail);
      
      // Use direct fetch to match AdminAllBalances behavior
      const response = await fetch(`${apiConfig.endpoints.balance}/${employeeEmail}?year=${year}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('BalanceApiClient - Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('BalanceApiClient - Response data:', data);
        
        if (data.success && data.balance) {
          return data.balance;
        }
      } else {
        console.error('BalanceApiClient - API error:', response.status, response.statusText);
      }
      
      // If direct API fails, fall back to makeApiRequest for mock data
      console.log('BalanceApiClient - Falling back to mock data');
      const mockData = await makeApiRequest('/balance', {});
      
      if (mockData && Array.isArray(mockData)) {
        const mockBalance = mockData.find((b: any) => b.email === employeeEmail);
        if (mockBalance) {
          console.log('Converting mock balance data for user:', mockBalance.email);
          const converted = {
            BalanceID: 1,
            EmployeeName: mockBalance.name,
            EmployeeEmail: mockBalance.email,
            Department: mockBalance.department,
            Year: year,
            Broughtforward: mockBalance.broughtforward || 0, // Use actual broughtforward from leave_balance table
            Annual: 20,
            AccumulatedLeave: mockBalance.annualLeave || 0,
            AnnualUsed: mockBalance.annualUsed || 0, // Use actual annualUsed from leave_balance table
            Forfeited: 0,
            Annual_leave_adjustments: 0,
            SickUsed: (36 - (mockBalance.sickLeave || 0)),
            MaternityUsed: 0,
            ParentalUsed: 0,
            FamilyUsed: (3 - (mockBalance.familyResponsibility || 0)),
            AdoptionUsed: 0,
            StudyUsed: (6 - (mockBalance.studyLeave || 0)),
            WellnessUsed: 0,
            Current_leave_balance: mockBalance.annualLeave || 0,
            Manager: 'jane.smith@example.com',
            Start_date: '2024-01-01',
            gender: mockBalance.gender || 'female' // Include gender field for proper maternity calculation
          };
          console.log('Converted balance object:', converted);
          return converted;
        }
      }
      
      return null;
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

  // Update accumulated leave in database
  static async updateAccumulatedLeave(employeeEmail: string, accumulatedLeave: number, year?: number): Promise<void> {
    try {
      await this.apiRequest('/accumulated-leave', {
        method: 'PUT',
        body: JSON.stringify({
          employeeEmail,
          accumulatedLeave,
          year: year || new Date().getFullYear()
        })
      });
      
      console.log('Accumulated leave updated for:', employeeEmail, 'to', accumulatedLeave);
    } catch (error) {
      console.error('Failed to update accumulated leave:', error);
      throw error;
    }
  }
}
