import sgMail from '@sendgrid/mail';

// Email notification service for leave requests and approvals
export interface EmailNotification {
  recipient_email: string;
  sender_email: string;
  subject: string;
  message: string;
  notification_type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'user_registration' | 'balance_exceeded';
  leave_id?: number;
  cc_email?: string;
}

class EmailService {
  private readonly ADMIN_EMAIL = 'chaisahr@clintonhealthaccess.org';
  // IMPORTANT: Replace with your verified SendGrid sender email
  // Get verified sender at: https://app.sendgrid.com/settings/sender_auth
  private readonly FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ SENDGRID_API_KEY is not set. Email notifications will not be sent.');
      console.warn('Please add SENDGRID_API_KEY to your environment variables.');
      console.warn('Get your API key from: https://app.sendgrid.com/settings/api_keys');
    } else {
      sgMail.setApiKey(apiKey);
      console.log('✅ SendGrid email service initialized');
      if (!process.env.SENDGRID_FROM_EMAIL) {
        console.warn('⚠️ SENDGRID_FROM_EMAIL is not set. Using default "noreply@yourdomain.com". This must be a verified sender or domain in SendGrid.');
      }
    }
  }

  // Send password reset email
  async notifyPasswordReset(userEmail: string, userName: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const notification: EmailNotification = {
      recipient_email: userEmail,
      sender_email: this.FROM_EMAIL,
      subject: 'Password Reset Request - Leave Management System',
      message: `
        Dear ${userName},

        You have requested to reset your password for the Leave Management System.

        Please click the link below to reset your password:
        ${resetUrl}

        This link will expire in 1 hour for security reasons.

        If you did not request this password reset, please ignore this email or contact support if you have concerns.

        Best regards,
        HR Team
        Leave Management System
      `,
      notification_type: 'user_registration' // Using existing type, or we could add 'password_reset'
    };

    await this.sendEmail(notification);
  }

  // Send welcome email to new user registration
  async notifyUserRegistration(userEmail: string, userName: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: userEmail,
      sender_email: this.FROM_EMAIL,
      subject: 'Welcome to Leave Management System',
      message: `
        Dear ${userName},

        Welcome to the Company Leave Management System!

        Your account has been successfully created and is now active. You can now:
        
        • Submit leave requests online
        • View your leave balances
        • Track your request status
        • Access company holiday calendar
        
        Please log in using your company credentials at: ${process.env.FRONTEND_URL}
        
        If you have any questions about using the system, please contact HR or your manager.
        
        Best regards,
        HR Team
        Leave Management System
      `,
      notification_type: 'user_registration',
      cc_email: this.ADMIN_EMAIL
    };

    await this.sendEmail(notification);
  }

  // Send email notification to admins when a new user registers
  async notifyAdminsOfNewUserRegistration(userEmail: string, userName: string, department: string, gender: string): Promise<void> {
    // Import database function to get admin emails
    const { executeQuery } = require('../config/database');
    
    try {
      // Get all admin users
      const adminUsers = await executeQuery(
        'SELECT email, name FROM users WHERE role = ? AND is_active = TRUE',
        ['admin']
      );

      console.log(`Found ${adminUsers.length} admin users to notify of new registration`);

      // Send notification to each admin
      for (const admin of adminUsers) {
        const notification: EmailNotification = {
          recipient_email: admin.email,
          sender_email: this.FROM_EMAIL,
          subject: `New User Registration - ${userName}`,
          message: `
            Dear ${admin.name},

            A new user has successfully registered in the Leave Management System and requires your attention:

            NEW USER DETAILS:
            • Name: ${userName}
            • Email: ${userEmail}
            • Department: ${department}
            • Gender: ${gender}
            • Registration Date: ${new Date().toLocaleDateString('en-GB')}

            NEXT STEPS:
            • Please review the new user's department assignment
            • Verify the user's manager assignment if needed
            • Confirm their role permissions are correct
            • Welcome the new team member to the system

            You can access the user management section at: ${process.env.FRONTEND_URL}

            Best regards,
            Leave Management System
          `,
          notification_type: 'user_registration'
        };

        await this.sendEmail(notification);
      }
    } catch (error) {
      console.error('Failed to notify admins of new user registration:', error);
      // Don't throw error to prevent breaking the registration process
    }
  }

  // Send email notification to manager when leave is submitted
  async notifyManagerOfLeaveRequest(leaveRequest: any, managerEmail: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: managerEmail,
      sender_email: this.FROM_EMAIL,
      cc_email: this.ADMIN_EMAIL,
      subject: `New Leave Request: ${leaveRequest.title}`,
      message: `
        Good day,

        A new leave request has been submitted and requires your approval:

        Employee: ${leaveRequest.submittedBy}
        Leave Type: ${leaveRequest.leaveType}
        Title: ${leaveRequest.title}
        Start Date: ${this.formatDateForDisplay(leaveRequest.startDate)}
        End Date: ${this.formatDateForDisplay(leaveRequest.endDate)}
        Calendar Days: ${this.calculateCalendarDays(leaveRequest.startDate, leaveRequest.endDate)}
        Working Days Applied: ${leaveRequest.workingDays}
        Description: ${leaveRequest.description}

        Please log into the system to review and approve this request: ${process.env.FRONTEND_URL}

        Best regards,
        HR
      `,
      notification_type: 'leave_request'
    };

    await this.sendEmail(notification);
  }

  // Send email notification to employee when leave is approved
  async notifyEmployeeOfApproval(leaveRequest: any, approverName: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: leaveRequest.Requester || leaveRequest.employeeEmail,
      sender_email: this.FROM_EMAIL,
      cc_email: this.ADMIN_EMAIL,
      subject: `Leave Request Approved: ${leaveRequest.Title || leaveRequest.title}`,
      message: `
        Hello,

        Good news! Your leave request has been approved.

        Leave Details:
        - Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        - Start Date: ${this.formatDateForDisplay(leaveRequest.StartDate || leaveRequest.startDate)}
        - End Date: ${this.formatDateForDisplay(leaveRequest.EndDate || leaveRequest.endDate)}
        - Working Days: ${leaveRequest.workingDays} days
        - Approved by: ${approverName}

        Your leave balance has been automatically updated.

        Best regards,
        HR
      `,
      notification_type: 'leave_approved',
      leave_id: leaveRequest.LeaveID || leaveRequest.id
    };

    await this.sendEmail(notification);
  }

  // Send email notification to employee when leave is declined
  async notifyEmployeeOfRejection(leaveRequest: any, approverName: string, reason?: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: leaveRequest.Requester || leaveRequest.employeeEmail,
      sender_email: this.FROM_EMAIL,
      cc_email: this.ADMIN_EMAIL,
      subject: `Leave Request Declined: ${leaveRequest.Title || leaveRequest.title}`,
      message: `
        Hello,

        We regret to inform you that your leave request has been declined.

        Leave Details:
        - Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        - Start Date: ${this.formatDateForDisplay(leaveRequest.StartDate || leaveRequest.startDate)}
        - End Date: ${this.formatDateForDisplay(leaveRequest.EndDate || leaveRequest.endDate)}
        - Declined by: ${approverName}
        ${reason ? `- Reason: ${reason}` : ''}

        Please contact your manager if you have any questions.

        Best regards,
        HR
      `,
      notification_type: 'leave_rejected',
      leave_id: leaveRequest.LeaveID || leaveRequest.id
    };

    await this.sendEmail(notification);
  }

  // Send email notification to HR & Ops manager when leave is declined
  async notifyHROfLeaveRejection(leaveRequest: any, employeeName: string, rejectionReason: string, approverName: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: this.ADMIN_EMAIL, // HR & Ops manager
      sender_email: this.FROM_EMAIL,
      subject: `Leave Request Declined - ${employeeName}`,
      message: `
        A leave request has been declined and requires HR attention:

        Employee: ${employeeName}
        Email: ${leaveRequest.Requester || leaveRequest.employeeEmail}
        Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        Start Date: ${this.formatDateForDisplay(leaveRequest.StartDate || leaveRequest.startDate)}
        End Date: ${this.formatDateForDisplay(leaveRequest.EndDate || leaveRequest.endDate)}
        Declined by: ${approverName}
        
        REJECTION REASON: ${rejectionReason}

        Description: ${leaveRequest.Detail || leaveRequest.description || 'No description provided'}

        Please review this rejection and follow up with the employee if necessary.

        Best regards,
        Leave Management System
      `,
      notification_type: 'leave_rejected',
      leave_id: leaveRequest.LeaveID || leaveRequest.id
    };

    await this.sendEmail(notification);
  }

  // Send email notification to HR & Ops manager when approved leave is cancelled
  async notifyHROfLeaveCancellation(leaveRequest: any, employeeName: string, cancellationReason: string, approverName: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: this.ADMIN_EMAIL, // HR & Ops manager
      sender_email: this.FROM_EMAIL,
      subject: `Approved Leave Cancelled - ${employeeName}`,
      message: `
        A previously approved leave request has been cancelled:

        Employee: ${employeeName}
        Email: ${leaveRequest.Requester || leaveRequest.employeeEmail}
        Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        Start Date: ${this.formatDateForDisplay(leaveRequest.StartDate || leaveRequest.startDate)}
        End Date: ${this.formatDateForDisplay(leaveRequest.EndDate || leaveRequest.endDate)}
        Cancelled by: ${approverName}
        
        CANCELLATION REASON: ${cancellationReason}

        Description: ${leaveRequest.Detail || leaveRequest.description || 'No description provided'}

        This cancellation may impact scheduling and workforce planning.

        Best regards,
        Leave Management System
      `,
      notification_type: 'leave_rejected',
      leave_id: leaveRequest.LeaveID || leaveRequest.id
    };

    await this.sendEmail(notification);
  }

  // Send email notification to HR & Ops manager when leave exceeds balance
  async notifyHROfBalanceExceeded(leaveRequest: any, employeeName: string, availableBalance: number, requestedDays: number): Promise<void> {
    const balanceDeficit = requestedDays - availableBalance;
    
    const notification: EmailNotification = {
      recipient_email: this.ADMIN_EMAIL, // HR & Ops manager
      sender_email: this.FROM_EMAIL,
      subject: `URGENT: Leave Request Exceeds Balance - ${employeeName}`,
      message: `
        URGENT ATTENTION REQUIRED

        An employee has submitted a leave request that exceeds their available balance:

        Employee: ${employeeName}
        Email: ${leaveRequest.Requester || leaveRequest.employeeEmail}
        Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        Start Date: ${this.formatDateForDisplay(leaveRequest.StartDate || leaveRequest.startDate)}
        End Date: ${this.formatDateForDisplay(leaveRequest.EndDate || leaveRequest.endDate)}
        
        BALANCE ANALYSIS:
        - Available Balance: ${availableBalance} days
        - Requested Days: ${requestedDays} days
        - Balance Deficit: ${balanceDeficit} days

        Description: ${leaveRequest.Detail || leaveRequest.description || 'No description provided'}

        This request requires immediate HR review and approval as it exceeds the employee's current balance.

        Please log into the system to review this request: ${process.env.FRONTEND_URL}

        Best regards,
        Leave Management System
      `,
      notification_type: 'balance_exceeded',
      leave_id: leaveRequest.LeaveID || leaveRequest.id
    };

    await this.sendEmail(notification);
  }

  // Helper method to calculate calendar days
  private calculateCalendarDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  }

  // Helper method to format date for display
  private formatDateForDisplay(dateString: string): string {
    // Handle both YYYY-MM-DD and ISO format
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  // Generic method to send email using SendGrid
  private async sendEmail(notification: EmailNotification): Promise<void> {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not configured. Email notification not sent:', {
        to: notification.recipient_email,
        subject: notification.subject,
        type: notification.notification_type
      });
      console.warn('To enable email notifications, configure SENDGRID_API_KEY in environment variables');
      console.warn('Get your API key from: https://app.sendgrid.com/settings/api_keys');
      return;
    }

    try {
      console.log('📧 Sending email via SendGrid:', {
        from: notification.sender_email || this.FROM_EMAIL,
        to: notification.recipient_email,
        cc: notification.cc_email,
        subject: notification.subject,
        type: notification.notification_type
      });

      const emailData: sgMail.MailDataRequired = {
        from: notification.sender_email || this.FROM_EMAIL,
        to: notification.recipient_email,
        subject: notification.subject,
        html: notification.message.replace(/\n/g, '<br>'),
        ...(notification.cc_email && { cc: notification.cc_email })
      };

      await sgMail.send(emailData);

      console.log('✅ Email sent successfully via SendGrid:', {
        to: notification.recipient_email,
        subject: notification.subject
      });
      
      // Store notification in database log
      await this.logEmailNotification(notification);
      
    } catch (error) {
      const statusCode = (error as any)?.code || (error as any)?.response?.statusCode;
      const responseBody = (error as any)?.response?.body;
      console.error('❌ Failed to send email notification:', {
        error: (error as any)?.message || error,
        statusCode,
        responseBody,
        from: notification.sender_email || this.FROM_EMAIL,
        to: notification.recipient_email,
        subject: notification.subject
      });
      // Don't throw error to prevent breaking the main process
  }

  // Log email notification to database
  private async logEmailNotification(notification: EmailNotification): Promise<void> {
    // In a real application, this would save to the email_notifications table
    console.log('Logging email notification to database:', {
      recipient: notification.recipient_email,
      cc: notification.cc_email,
      type: notification.notification_type,
      timestamp: new Date().toISOString()
    });
  }
}

export const emailService = new EmailService();
