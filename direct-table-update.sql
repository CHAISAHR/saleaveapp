-- Direct table updates to add missing columns
-- Run these commands directly on your production database

-- Add contract_termination_date to users table
ALTER TABLE users ADD COLUMN contract_termination_date DATE NULL AFTER is_active;

-- Add start_date to leave_balances table if it doesn't exist  
ALTER TABLE leave_balances ADD COLUMN start_date DATE NOT NULL DEFAULT '2024-01-01' AFTER Department;

-- Update start_date with hire_date from users table
UPDATE leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
SET lb.start_date = u.hire_date
WHERE lb.start_date = '2024-01-01';

-- Add workingDays to leave_taken table if it doesn't exist
ALTER TABLE leave_taken ADD COLUMN workingDays DECIMAL(8,3) DEFAULT 0;

-- Verify all columns were added
DESCRIBE users;
DESCRIBE leave_balances;
DESCRIBE leave_taken;

SELECT 'All columns added successfully!' as status;