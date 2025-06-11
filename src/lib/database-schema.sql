
-- MySQL Database Schema for Leave Management System
-- Updated schema with specific table structures as requested

-- Users table - stores employee information and roles
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    role ENUM('employee', 'manager', 'admin') DEFAULT 'employee',
    hire_date DATE NOT NULL,
    manager_id INT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    contract_termination_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Company holidays table - stores public and company holidays
CREATE TABLE company_holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type ENUM('public', 'company') NOT NULL,
    description TEXT,
    office_status ENUM('closed', 'optional', 'open') DEFAULT 'closed',
    is_recurring BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Leave taken table - tracks all submitted leave requests
CREATE TABLE leave_taken (
    LeaveID INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL,
    Detail TEXT,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    LeaveType VARCHAR(50) NOT NULL,
    Requester VARCHAR(255) NOT NULL,
    Approver VARCHAR(255) NULL,
    Status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    __PowerAppsId__ VARCHAR(255) NULL,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Modified_By VARCHAR(255) NULL
);

-- Leave balances table - tracks employee leave balances with monthly accrual
CREATE TABLE leave_balances (
    BalanceID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeName VARCHAR(255) NOT NULL,
    EmployeeEmail VARCHAR(255) NOT NULL,
    Department VARCHAR(100) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Active',
    Year INT NOT NULL,
    Broughtforward DECIMAL(4,1) DEFAULT 0,
    Annual DECIMAL(4,1) DEFAULT 0, -- Accumulated annual leave (1.6667 per month)
    AnnualUsed DECIMAL(4,1) DEFAULT 0,
    Forfeited DECIMAL(4,1) DEFAULT 0,
    Annual_leave_adjustments DECIMAL(4,1) DEFAULT 0,
    SickBroughtforward DECIMAL(4,1) DEFAULT 0,
    Sick DECIMAL(4,1) DEFAULT 36, -- Annual sick leave allocation
    SickUsed DECIMAL(4,1) DEFAULT 0,
    Maternity DECIMAL(4,1) DEFAULT 90,
    MaternityUsed DECIMAL(4,1) DEFAULT 0,
    Parental DECIMAL(4,1) DEFAULT 20,
    ParentalUsed DECIMAL(4,1) DEFAULT 0,
    Family DECIMAL(4,1) DEFAULT 3,
    FamilyUsed DECIMAL(4,1) DEFAULT 0,
    Adoption DECIMAL(4,1) DEFAULT 20,
    AdoptionUsed DECIMAL(4,1) DEFAULT 0,
    Study DECIMAL(4,1) DEFAULT 6,
    StudyUsed DECIMAL(4,1) DEFAULT 0,
    Mentalhealth DECIMAL(4,1) DEFAULT 2,
    MentalhealthUsed DECIMAL(4,1) DEFAULT 0,
    __PowerAppsId__ VARCHAR(255) NULL,
    Current_leave_balance DECIMAL(4,1) GENERATED ALWAYS AS (
        Broughtforward + Annual - AnnualUsed - Forfeited - Annual_leave_adjustments
    ) STORED,
    Leave_balance_previous_month DECIMAL(4,1) DEFAULT 0,
    Contract_termination_date DATE NULL,
    termination_balance DECIMAL(4,1) DEFAULT 0,
    Comment TEXT,
    Annual_leave_adjustment_comments TEXT,
    Manager VARCHAR(255),
    Modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_year (EmployeeEmail, Year)
);

-- Email notifications log
CREATE TABLE email_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('leave_request', 'leave_approved', 'leave_rejected') NOT NULL,
    leave_id INT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leave_id) REFERENCES leave_taken(LeaveID)
);

-- Audit log table - tracks all changes for compliance
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_leave_balances_employee_year ON leave_balances(EmployeeEmail, Year);
CREATE INDEX idx_leave_taken_requester ON leave_taken(Requester);
CREATE INDEX idx_leave_taken_status ON leave_taken(Status);
CREATE INDEX idx_leave_taken_dates ON leave_taken(StartDate, EndDate);
CREATE INDEX idx_company_holidays_date ON company_holidays(date);
CREATE INDEX idx_email_notifications_recipient ON email_notifications(recipient_email);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Insert default South African holidays for 2025
INSERT INTO company_holidays (name, date, type, description, office_status, is_recurring, created_by) VALUES
('New Year\'s Day', '2025-01-01', 'public', 'New Year\'s Day', 'closed', TRUE, 1),
('Human Rights Day', '2025-03-21', 'public', 'Human Rights Day', 'closed', TRUE, 1),
('Good Friday', '2025-04-18', 'public', 'Good Friday', 'closed', FALSE, 1),
('Family Day', '2025-04-21', 'public', 'Family Day', 'closed', FALSE, 1),
('Freedom Day', '2025-04-27', 'public', 'Freedom Day', 'closed', TRUE, 1),
('Workers\' Day', '2025-05-01', 'public', 'Workers\' Day', 'closed', TRUE, 1),
('Youth Day', '2025-06-16', 'public', 'Youth Day', 'closed', TRUE, 1),
('National Women\'s Day', '2025-08-09', 'public', 'National Women\'s Day', 'closed', TRUE, 1),
('Heritage Day', '2025-09-24', 'public', 'Heritage Day', 'closed', TRUE, 1),
('Day of Reconciliation', '2025-12-16', 'public', 'Day of Reconciliation', 'closed', TRUE, 1),
('Christmas Day', '2025-12-25', 'public', 'Christmas Day', 'closed', TRUE, 1),
('Day of Goodwill', '2025-12-26', 'public', 'Day of Goodwill', 'closed', TRUE, 1);

-- Create views for common queries
CREATE VIEW employee_current_balances AS
SELECT 
    lb.EmployeeName,
    lb.EmployeeEmail,
    lb.Department,
    lb.Current_leave_balance as annual_balance,
    (lb.Sick - lb.SickUsed) as sick_balance,
    (lb.Family - lb.FamilyUsed) as family_balance,
    (lb.Study - lb.StudyUsed) as study_balance,
    lb.Manager
FROM leave_balances lb
WHERE lb.Year = YEAR(CURRENT_DATE);

CREATE VIEW pending_leave_requests AS
SELECT 
    lt.LeaveID,
    lt.Title,
    lt.Requester,
    lt.LeaveType,
    lt.StartDate,
    lt.EndDate,
    lt.Status,
    lt.Created,
    lb.Manager
FROM leave_taken lt
LEFT JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail 
    AND lb.Year = YEAR(CURRENT_DATE)
WHERE lt.Status = 'pending';
