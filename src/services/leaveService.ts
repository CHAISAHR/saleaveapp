
// Database service for leave management
// This file defines the API functions that would interact with the MySQL database
// In production, these would make actual HTTP requests to your backend API

export interface User {
  id: number;
  employee_id: string;
  email: string;
  name: string;
  department: string;
  role: 'employee' | 'manager' | 'admin';
  hire_date: string;
  manager_id?: number;
  avatar_url?: string;
  is_active: boolean;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  leave_type_id: number;
  type_name: string;
  year_allocated: number;
  total_allocated: number;
  used_days: number;
  accrued_days: number;
  carry_over_days: number;
  expires_at?: string;
}

export interface LeaveApplication {
  id: number;
  user_id: number;
  leave_type_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  submitted_at: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  type: 'public' | 'company';
  description?: string;
  office_status: 'closed' | 'optional' | 'open';
  is_recurring: boolean;
  created_by: number;
}

// Mock API functions - in production, these would make actual HTTP requests

export const leaveService = {
  // User management
  async getCurrentUser(): Promise<User> {
    // Mock implementation - would fetch from /api/auth/me
    return {
      id: 1,
      employee_id: "EMP001",
      email: "sarah.johnson@company.com",
      name: "Sarah Johnson",
      department: "Marketing",
      role: "employee",
      hire_date: "2023-01-15",
      is_active: true
    };
  },

  async getUsersByDepartment(managerId: number): Promise<User[]> {
    // Mock implementation - would fetch from /api/users/team/{managerId}
    return [
      {
        id: 2,
        employee_id: "EMP002",
        email: "john.smith@company.com",
        name: "John Smith",
        department: "Marketing",
        role: "employee",
        hire_date: "2023-03-01",
        manager_id: managerId,
        is_active: true
      }
    ];
  },

  // Leave balance management
  async getLeaveBalances(userId: number, year?: number): Promise<LeaveBalance[]> {
    // Mock implementation - would fetch from /api/leave-balances/{userId}?year={year}
    const currentYear = year || new Date().getFullYear();
    return [
      {
        id: 1,
        user_id: userId,
        leave_type_id: 1,
        type_name: "Annual",
        year_allocated: currentYear,
        total_allocated: 20,
        used_days: 8,
        accrued_days: 12.5,
        carry_over_days: 0
      },
      {
        id: 2,
        user_id: userId,
        leave_type_id: 2,
        type_name: "Sick",
        year_allocated: currentYear,
        total_allocated: 36,
        used_days: 3,
        accrued_days: 36,
        carry_over_days: 0
      }
    ];
  },

  async updateLeaveBalance(balanceId: number, usedDays: number): Promise<void> {
    // Mock implementation - would POST to /api/leave-balances/{balanceId}/update
    console.log(`Updating balance ${balanceId} with ${usedDays} used days`);
  },

  // Leave application management
  async getLeaveApplications(userId: number, status?: string): Promise<LeaveApplication[]> {
    // Mock implementation - would fetch from /api/leave-applications?userId={userId}&status={status}
    return [
      {
        id: 1,
        user_id: userId,
        leave_type_id: 1,
        title: "Family Vacation",
        description: "Summer vacation with family",
        start_date: "2024-07-15",
        end_date: "2024-07-19",
        total_days: 5,
        is_half_day: false,
        status: "approved",
        submitted_at: "2024-06-15T10:00:00Z"
      }
    ];
  },

  async submitLeaveApplication(application: Omit<LeaveApplication, 'id' | 'status' | 'submitted_at'>): Promise<LeaveApplication> {
    // Mock implementation - would POST to /api/leave-applications
    const newApplication: LeaveApplication = {
      ...application,
      id: Date.now(), // Mock ID
      status: 'pending',
      submitted_at: new Date().toISOString()
    };
    
    console.log('Submitting leave application:', newApplication);
    return newApplication;
  },

  async approveLeaveApplication(applicationId: number, approverId: number): Promise<void> {
    // Mock implementation - would POST to /api/leave-applications/{applicationId}/approve
    console.log(`Application ${applicationId} approved by user ${approverId}`);
  },

  async rejectLeaveApplication(applicationId: number, approverId: number, reason: string): Promise<void> {
    // Mock implementation - would POST to /api/leave-applications/{applicationId}/reject
    console.log(`Application ${applicationId} rejected by user ${approverId}. Reason: ${reason}`);
  },

  // Holiday management
  async getHolidays(year?: number): Promise<Holiday[]> {
    // Mock implementation - would fetch from /api/holidays?year={year}
    return [
      {
        id: 1,
        name: "New Year's Day",
        date: "2024-01-01",
        type: "public",
        description: "National public holiday",
        office_status: "closed",
        is_recurring: true,
        created_by: 1
      }
    ];
  },

  async createHoliday(holiday: Omit<Holiday, 'id' | 'created_by'>): Promise<Holiday> {
    // Mock implementation - would POST to /api/holidays
    const newHoliday: Holiday = {
      ...holiday,
      id: Date.now(), // Mock ID
      created_by: 1 // Current admin user
    };
    
    console.log('Creating holiday:', newHoliday);
    return newHoliday;
  },

  async deleteHoliday(holidayId: number): Promise<void> {
    // Mock implementation - would DELETE /api/holidays/{holidayId}
    console.log(`Deleting holiday ${holidayId}`);
  },

  // Reporting and analytics
  async getDepartmentLeaveStats(departmentId: number): Promise<any> {
    // Mock implementation - would fetch from /api/reports/department/{departmentId}
    return {
      totalEmployees: 12,
      totalLeaveDays: 156,
      averageLeaveUsage: 13,
      pendingRequests: 3
    };
  },

  async getSystemWideStats(): Promise<any> {
    // Mock implementation - would fetch from /api/reports/system
    return {
      totalUsers: 248,
      activeRequests: 42,
      totalRequestsThisMonth: 156,
      systemUptime: 98.7
    };
  }
};

// Email notification service
export const notificationService = {
  async sendLeaveRequestNotification(applicationId: number, managerId: number): Promise<void> {
    // Mock implementation - would POST to /api/notifications/leave-request
    console.log(`Sending leave request notification for application ${applicationId} to manager ${managerId}`);
  },

  async sendApprovalNotification(applicationId: number, userId: number, approved: boolean): Promise<void> {
    // Mock implementation - would POST to /api/notifications/approval
    console.log(`Sending ${approved ? 'approval' : 'rejection'} notification for application ${applicationId} to user ${userId}`);
  }
};
