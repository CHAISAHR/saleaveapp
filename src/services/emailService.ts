
// Email notification service for leave requests and approvals
export interface EmailNotification {
  recipient_email: string;
  sender_email: string;
  subject: string;
  message: string;
  notification_type: 'leave_request' | 'leave_approved' | 'leave_rejected';
  leave_id?: number;
}

class EmailService {
  // Send email notification to manager when leave is submitted
  async notifyManagerOfLeaveRequest(leaveRequest: any, managerEmail: string): Promise<void> {
    const notification: EmailNotification = {
      recipient_email: managerEmail,
      sender_email: 'noreply@company.com',
      subject: `New Leave Request: ${leaveRequest.title}`,
      message: `
        Hello,

        A new leave request has been submitted and requires your approval:

        Employee: ${leaveRequest.submittedBy}
        Leave Type: ${leaveRequest.leaveType}
        Dates: ${leaveRequest.startDate} to ${leaveRequest.endDate}
        Working Days: ${leaveRequest.workingDays}
        Reason: ${leaveRequest.description}

        Please log into the system to review and approve this request.

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
      sender_email: 'noreply@company.com',
      subject: `Leave Request Approved: ${leaveRequest.Title || leaveRequest.title}`,
      message: `
        Hello,

        Good news! Your leave request has been approved.

        Leave Details:
        - Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        - Dates: ${leaveRequest.StartDate || leaveRequest.startDate} to ${leaveRequest.EndDate || leaveRequest.endDate}
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
      sender_email: 'noreply@company.com',
      subject: `Leave Request Rejected: ${leaveRequest.Title || leaveRequest.title}`,
      message: `
        Hello,

        We regret to inform you that your leave request has been rejected.

        Leave Details:
        - Leave Type: ${leaveRequest.LeaveType || leaveRequest.leaveType}
        - Dates: ${leaveRequest.StartDate || leaveRequest.startDate} to ${leaveRequest.EndDate || leaveRequest.endDate}
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

  // Generic method to send email (would integrate with actual email service)
  private async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      console.log('Sending email notification:', notification);
      
      // In a real application, this would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - SMTP server
      
      // For now, we'll log the email details and simulate sending
      console.log(`Email sent to: ${notification.recipient_email}`);
      console.log(`Subject: ${notification.subject}`);
      console.log(`Type: ${notification.notification_type}`);
      
      // Store notification in database log
      await this.logEmailNotification(notification);
      
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw new Error('Email notification failed');
    }
  }

  // Log email notification to database
  private async logEmailNotification(notification: EmailNotification): Promise<void> {
    // In a real application, this would save to the email_notifications table
    console.log('Logging email notification to database:', {
      recipient: notification.recipient_email,
      type: notification.notification_type,
      timestamp: new Date().toISOString()
    });
  }
}

export const emailService = new EmailService();
