
-- MySQL Database Schema for Leave Management System
-- This file documents the database structure for the leave management application

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Leave types table - defines different types of leave
CREATE TABLE leave_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    max_days_per_year INT NOT NULL,
    accrual_rate DECIMAL(4,2), -- days per month (e.g., 1.66 for annual leave)
    carry_over_months INT DEFAULT 0, -- how long unused leave can be carried over
    requires_documentation BOOLEAN DEFAULT FALSE,
    documentation_threshold INT DEFAULT 0, -- days threshold requiring documentation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leave balances table - tracks current leave balances for each user
CREATE TABLE leave_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    year_allocated INT NOT NULL, -- year this balance applies to
    total_allocated INT NOT NULL, -- total days allocated for the year
    used_days DECIMAL(4,1) DEFAULT 0, -- days used (supports half days)
    accrued_days DECIMAL(4,1) DEFAULT 0, -- days accrued so far
    carry_over_days DECIMAL(4,1) DEFAULT 0, -- days carried over from previous year
    expires_at DATE, -- when carry-over days expire
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    UNIQUE KEY unique_user_leave_year (user_id, leave_type_id, year_allocated)
);

-- Leave applications table - stores all leave requests
CREATE TABLE leave_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4,1) NOT NULL, -- supports half days
    is_half_day BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    approved_by INT, -- manager who approved/rejected
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Company holidays table - stores public and company holidays
CREATE TABLE company_holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type ENUM('public', 'company') NOT NULL,
    description TEXT,
    office_status ENUM('closed', 'optional', 'open') DEFAULT 'closed',
    is_recurring BOOLEAN DEFAULT FALSE, -- for annual holidays
    created_by INT NOT NULL, -- admin who created the holiday
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Leave approval workflow table - tracks approval chain for complex approvals
CREATE TABLE leave_approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    approver_id INT NOT NULL,
    approval_order INT NOT NULL, -- for multi-level approvals
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    comments TEXT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES leave_applications(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Audit log table - tracks all changes for compliance
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Insert default leave types
INSERT INTO leave_types (type_name, description, max_days_per_year, accrual_rate, carry_over_months, requires_documentation, documentation_threshold) VALUES
('Annual', 'Vacation and personal time off', 20, 1.66, 6, FALSE, 0),
('Sick', 'Medical appointments and illness', 36, NULL, 0, TRUE, 3),
('Maternity', 'Childbirth and recovery period', 90, NULL, 0, TRUE, 1),
('Parental', 'Caring for newborn or adopted child', 20, NULL, 0, TRUE, 1),
('Family', 'Caring for family members', 3, NULL, 0, FALSE, 0),
('Adoption', 'Adopting a child', 20, NULL, 0, TRUE, 1),
('Study', 'Professional development and training', 6, NULL, 0, FALSE, 0),
('Wellness', 'Mental health and wellbeing', 2, NULL, 0, FALSE, 0);

-- Create indexes for better performance
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_leave_balances_user_year ON leave_balances(user_id, year_allocated);
CREATE INDEX idx_leave_applications_user ON leave_applications(user_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON leave_applications(start_date, end_date);
CREATE INDEX idx_company_holidays_date ON company_holidays(date);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Create views for common queries
CREATE VIEW employee_leave_summary AS
SELECT 
    u.id,
    u.name,
    u.department,
    lt.type_name,
    lb.total_allocated,
    lb.used_days,
    lb.accrued_days,
    (lb.total_allocated - lb.used_days) as remaining_days
FROM users u
JOIN leave_balances lb ON u.id = lb.user_id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE u.is_active = TRUE AND lt.is_active = TRUE;

CREATE VIEW pending_approvals AS
SELECT 
    la.id,
    la.title,
    u.name as employee_name,
    u.department,
    lt.type_name,
    la.start_date,
    la.end_date,
    la.total_days,
    la.submitted_at,
    m.name as manager_name
FROM leave_applications la
JOIN users u ON la.user_id = u.id
JOIN leave_types lt ON la.leave_type_id = lt.id
LEFT JOIN users m ON u.manager_id = m.id
WHERE la.status = 'pending';
