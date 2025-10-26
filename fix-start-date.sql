-- Fix start_date for existing leave balance records
-- This updates leave_balances.start_date with the hire_date from users table
-- Run this to fix the current balance calculation for users who started before the current year

UPDATE leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
SET lb.start_date = u.hire_date
WHERE u.hire_date IS NOT NULL 
  AND (lb.start_date IS NULL OR lb.start_date = '2024-01-01' OR lb.start_date = '1970-01-01');

-- Verify the update
SELECT 
  lb.EmployeeEmail,
  lb.EmployeeName,
  u.hire_date,
  lb.start_date,
  lb.Year
FROM leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
WHERE lb.Year = YEAR(CURDATE())
ORDER BY lb.EmployeeName;
