
import nodemailer from 'nodemailer';

// Email notification service for leave requests and approvals
export interface EmailNotification {
  recipient_email: string;
  sender_email: string;
  subject: string;
  message: string;
  notification_type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'user_registration';
  leave_id?: number;
  cc_email?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly ADMIN_EMAIL = 'admin@company.com';

  constructor() {
    // Initialize email transporter
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Send welcome email to new user registration
  async notifyUserRegistration(userEmail: string, userName: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: userEmail,
      sender_email: process.env.SMTP_USER || 'noreply@company.com',
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

  // Send email notification to manager when leave is submitted
  async notifyManagerOfLeaveRequest(leaveRequest: any, managerEmail: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: managerEmail,
      sender_email: process.env.SMTP_USER || 'noreply@company.com',
      cc_email: this.ADMIN_EMAIL,
      subject: `New Leave Request: ${leaveRequest.title}`,
      message: `
        Hello,

        A new leave request has been submitted and requires your approval:

        Employee: ${leaveRequest.submittedBy}
        Leave Type: ${leaveRequest.leaveType}
        Title: ${leaveRequest.title}
        Start Date: ${leaveRequest.startDate}
        End Date: ${leaveRequest.endDate}
        Calendar Days: ${this.calculateCalendarDays(leaveRequest.startDate, leaveRequest.endDate)}
        Working Days Applied: ${leaveRequest.workingDays}
        Description: ${leaveRequest.description}

        Please log into the system to review and approve this request: ${process.env.FRONTEND_URL}

        Best regards,
        Leave Management System
      `,
      notification_type: 'leave_request'
    };

    await this.sendEmail(notification);
  }

  // Send email notification to employee when leave is approved
  async notifyEmployeeOfApproval(leaveRequest: any, approverName: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: leaveRequest.Requester || leaveRequest.employeeEmail,
      sender_email: process.env.SMTP_USER || 'noreply@company.com',
      cc_email: this.ADMIN_EMAIL,
      subject: `Leave Request Approved: ${leaveRequest.Title || leaveRequest.title}`,
      message: `
        Hello,

        Good news! Your leave request has been approved.

        Leave Details:
        - Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        - Start Date: ${leaveRequest.StartDate || leaveRequest.startDate}
        - End Date: ${leaveRequest.EndDate || leaveRequest.endDate}
        - Working Days: ${leaveRequest.workingDays} days
        - Approved by: ${approverName}

        Your leave balance has been automatically updated.

        Best regards,
        Leave Management System
      `,
      notification_type: 'leave_approved',
      leave_id: leaveRequest.LeaveID || leaveRequest.id
    };

    await this.sendEmail(notification);
  }

  // Send email notification to employee when leave is rejected
  async notifyEmployeeOfRejection(leaveRequest: any, approverName: string, reason?: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: leaveRequest.Requester || leaveRequest.employeeEmail,
      sender_email: process.env.SMTP_USER || 'noreply@company.com',
      cc_email: this.ADMIN_EMAIL,
      subject: `Leave Request Rejected: ${leaveRequest.Title || leaveRequest.title}`,
      message: `
        Hello,

        We regret to inform you that your leave request has been rejected.

        Leave Details:
        - Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        - Start Date: ${leaveRequest.StartDate || leaveRequest.startDate}
        - End Date: ${leaveRequest.EndDate || leaveRequest.endDate}
        - Rejected by: ${approverName}
        ${reason ? `- Reason: ${reason}` : ''}

        Please contact your manager if you have any questions.

        Best regards,
        Leave Management System
      `,
      notification_type: 'leave_rejected',
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

  // Generic method to send email using nodemailer
  private async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      console.log('Sending email notification:', {
        to: notification.recipient_email,
        cc: notification.cc_email,
        subject: notification.subject,
        type: notification.notification_type
      });

      const mailOptions = {
        from: notification.sender_email,
        to: notification.recipient_email,
        cc: notification.cc_email,
        subject: notification.subject,
        text: notification.message,
        html: notification.message.replace(/\n/g, '<br>')
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      // Store notification in database log
      await this.logEmailNotification(notification);
      
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw error to prevent breaking the main process
      // Just log it and continue
    }
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
