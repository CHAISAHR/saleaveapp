
-- MySQL Database Schema for Leave Management System
-- Updated schema with email-based unique identifiers, negative value support, and gender field

-- Departments table - stores configurable department names
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table - stores employee information and roles
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL, -- For manual authentication
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'other') NULL,
    role ENUM('employee', 'manager', 'admin') DEFAULT 'employee',
    hire_date DATE NOT NULL,
    manager_email VARCHAR(255),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    contract_termination_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_email) REFERENCES users(email),
    FOREIGN KEY (department) REFERENCES departments(name)
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
    created_by_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_email) REFERENCES users(email)
);

-- Leave taken table - tracks all submitted leave requests with alternative manager support
CREATE TABLE leave_taken (
    LeaveID INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL,
    Detail TEXT,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    LeaveType VARCHAR(50) NOT NULL,
    Requester VARCHAR(255) NOT NULL,
    Approver VARCHAR(255) NULL,
    AlternativeApprover VARCHAR(255) NULL, -- New field for alternative manager
    ApproverReason TEXT NULL, -- Reason for alternative approver
    Status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    __PowerAppsId__ VARCHAR(255) NULL,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Modified_By VARCHAR(255) NULL
);

-- Leave balances table - tracks employee leave balances with monthly accrual (supports negative values with 3 decimal places)
CREATE TABLE leave_balances (
    BalanceID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeName VARCHAR(255) NOT NULL,
    EmployeeEmail VARCHAR(255) NOT NULL,
    Department VARCHAR(100) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Active',
    Year INT NOT NULL,
    Broughtforward DECIMAL(8,3) DEFAULT 0, -- Increased precision to 3 decimal places, allows negative values
    Annual DECIMAL(8,3) DEFAULT 0, -- Legacy field for compatibility, allows negative values
    AccumulatedLeave DECIMAL(8,3) DEFAULT 0, -- Monthly accumulation (1.667 per month), allows negative values
    AnnualUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    Forfeited DECIMAL(8,3) DEFAULT 0, -- Allows negative values for corrections
    Annual_leave_adjustments DECIMAL(8,3) DEFAULT 0, -- Allows negative values
    SickBroughtforward DECIMAL(8,3) DEFAULT 0, -- Allows negative values
    Sick DECIMAL(8,3) DEFAULT 36, -- Annual sick leave allocation, allows negative values
    SickUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    Maternity DECIMAL(8,3) DEFAULT 90, -- Gender-based allocation: 90 for females, 0 for males
    MaternityUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    Parental DECIMAL(8,3) DEFAULT 20, -- Allows negative values for adjustments
    ParentalUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    Family DECIMAL(8,3) DEFAULT 3, -- Allows negative values for adjustments
    FamilyUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    Adoption DECIMAL(8,3) DEFAULT 20, -- Allows negative values for adjustments
    AdoptionUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    Study DECIMAL(8,3) DEFAULT 6, -- Allows negative values for adjustments
    StudyUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    Mentalhealth DECIMAL(8,3) DEFAULT 2, -- Allows negative values for adjustments
    MentalhealthUsed DECIMAL(8,3) DEFAULT 0, -- Allows negative values for adjustments
    __PowerAppsId__ VARCHAR(255) NULL,
    Current_leave_balance DECIMAL(8,3) GENERATED ALWAYS AS (
        Broughtforward + AccumulatedLeave - AnnualUsed - Forfeited - Annual_leave_adjustments
    ) STORED,
    Leave_balance_previous_month DECIMAL(8,3) DEFAULT 0, -- Allows negative values
    Contract_termination_date DATE NULL,
    termination_balance DECIMAL(8,3) DEFAULT 0, -- Allows negative values
    Comment TEXT,
    Annual_leave_adjustment_comments TEXT,
    Manager VARCHAR(255),
    Modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_year (EmployeeEmail, Year),
    FOREIGN KEY (Department) REFERENCES departments(name)
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
CREATE INDEX idx_users_manager ON users(manager_email);
CREATE INDEX idx_leave_balances_employee_year ON leave_balances(EmployeeEmail, Year);
CREATE INDEX idx_leave_taken_requester ON leave_taken(Requester);
CREATE INDEX idx_leave_taken_status ON leave_taken(Status);
CREATE INDEX idx_leave_taken_dates ON leave_taken(StartDate, EndDate);
CREATE INDEX idx_leave_taken_alternative_approver ON leave_taken(AlternativeApprover);
CREATE INDEX idx_company_holidays_date ON company_holidays(date);
CREATE INDEX idx_email_notifications_recipient ON email_notifications(recipient_email);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_departments_name ON departments(name);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Ops Team', 'HR department managing personnel and policies'),
('Access to Medicines', 'IT department managing technology and systems'),
('Finance', 'Finance department managing company finances'),
('Assistive Technology', 'AT team'),
('HIV SS, Prep, Paeds, SRMNH', 'Self Screening'),
('FCDO', 'Operations department managing daily activities'),
('SHF', 'Legal department managing compliance and contracts'),
('PF', 'Pandemic Fund'),
('TB', 'Tuberculosis'),
('Malaria', 'Malaria team'),
('SLT', 'Senior Leadership Team'),
('Cancer', 'Cervical Cancer Team'),
('Global', 'Global Staff');

-- Insert default admin user first
INSERT INTO users (email, name, department, role, hire_date, password_hash, is_active) VALUES
('admin@company.com', 'System Administrator', 'Ops Team', 'admin', CURDATE(), '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

-- Insert default South African holidays for 2025 (now that admin user exists)
INSERT INTO company_holidays (name, date, type, description, office_status, is_recurring, created_by_email) VALUES
('New Year\'s Day', '2025-01-01', 'public', 'New Year\'s Day', 'closed', TRUE, 'admin@company.com'),
('Human Rights Day', '2025-03-21', 'public', 'Human Rights Day', 'closed', TRUE, 'admin@company.com'),
('Good Friday', '2025-04-18', 'public', 'Good Friday', 'closed', FALSE, 'admin@company.com'),
('Family Day', '2025-04-21', 'public', 'Family Day', 'closed', FALSE, 'admin@company.com'),
('Freedom Day', '2025-04-27', 'public', 'Freedom Day', 'closed', TRUE, 'admin@company.com'),
('Workers\' Day', '2025-05-01', 'public', 'Workers\' Day', 'closed', TRUE, 'admin@company.com'),
('Youth Day', '2025-06-16', 'public', 'Youth Day', 'closed', TRUE, 'admin@company.com'),
('National Women\'s Day', '2025-08-09', 'public', 'National Women\'s Day', 'closed', TRUE, 'admin@company.com'),
('Heritage Day', '2025-09-24', 'public', 'Heritage Day', 'closed', TRUE, 'admin@company.com'),
('Day of Reconciliation', '2025-12-16', 'public', 'Day of Reconciliation', 'closed', TRUE, 'admin@company.com'),
('Christmas Day', '2025-12-25', 'public', 'Christmas Day', 'closed', TRUE, 'admin@company.com'),
('Day of Goodwill', '2025-12-26', 'public', 'Day of Goodwill', 'closed', TRUE, 'admin@company.com');

-- Create initial leave balance for admin user
INSERT INTO leave_balances (
    EmployeeName, EmployeeEmail, Department, Year, 
    Maternity, AccumulatedLeave
) VALUES ('System Administrator', 'admin@company.com', 'Ops Team', YEAR(CURRENT_DATE), 0, 20);

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
    lb.Manager,
    lt.AlternativeApprover,
    lt.ApproverReason
FROM leave_taken lt
LEFT JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail 
    AND lb.Year = YEAR(CURRENT_DATE)
WHERE lt.Status = 'pending';
