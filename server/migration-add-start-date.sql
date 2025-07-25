-- Add start_date column to leave_balances table for proper accumulated leave calculations
-- This will be used to determine when an employee started working for proration calculations

-- Check if the start_date column exists, if not add it
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'leave_balances' 
AND column_name = 'start_date';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE leave_balances ADD COLUMN start_date DATE NOT NULL DEFAULT "2024-01-01" AFTER Department',
    'SELECT "start_date column already exists" as status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to use their hire_date from users table
UPDATE leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
SET lb.start_date = u.hire_date
WHERE lb.start_date = '2024-01-01';

-- Show updated table structure
DESCRIBE leave_balances;