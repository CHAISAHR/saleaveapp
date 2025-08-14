-- Update accumulated leave for all employees based on their start dates
-- This calculates proper accumulated leave using the same logic as the application

-- Update accumulated leave for active employees (no termination date)
UPDATE leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
SET lb.AccumulatedLeave = LEAST(
    CASE 
        WHEN u.hire_date IS NULL OR u.hire_date > CURDATE() THEN 0
        WHEN YEAR(u.hire_date) < YEAR(CURDATE()) THEN 
            -- Started before this year, calculate from January 1st
            FLOOR(DATEDIFF(CURDATE(), CONCAT(YEAR(CURDATE()), '-01-01')) / 30.44) * 1.667
        ELSE 
            -- Started this year, calculate from hire date
            FLOOR(DATEDIFF(CURDATE(), u.hire_date) / 30.44) * 1.667
    END,
    20.0
)
WHERE (u.contract_termination_date IS NULL OR u.contract_termination_date > CURDATE())
AND YEAR(lb.Year) = YEAR(CURDATE());

-- Update accumulated leave for terminated employees
UPDATE leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
SET lb.AccumulatedLeave = LEAST(
    CASE 
        WHEN u.hire_date IS NULL OR u.hire_date > u.contract_termination_date THEN 0
        WHEN YEAR(u.hire_date) < YEAR(u.contract_termination_date) THEN 
            -- Started before termination year, calculate from January 1st to termination
            20.0 * (DAYOFYEAR(u.contract_termination_date) / 
                CASE WHEN ((YEAR(u.contract_termination_date) % 4 = 0 AND YEAR(u.contract_termination_date) % 100 != 0) OR YEAR(u.contract_termination_date) % 400 = 0) 
                     THEN 366 ELSE 365 END)
        ELSE 
            -- Started in termination year, calculate from hire date to termination
            FLOOR(DATEDIFF(u.contract_termination_date, u.hire_date) / 30.44) * 1.667
    END,
    20.0
)
WHERE u.contract_termination_date IS NOT NULL 
AND u.contract_termination_date <= CURDATE()
AND YEAR(lb.Year) = YEAR(u.contract_termination_date);

-- Update start_date in leave_balances with hire_date from users
UPDATE leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
SET lb.start_date = COALESCE(u.hire_date, '2024-01-01');

-- Show updated results
SELECT 
    lb.EmployeeEmail,
    u.hire_date,
    u.contract_termination_date,
    lb.AccumulatedLeave,
    lb.start_date,
    CASE 
        WHEN u.contract_termination_date IS NULL THEN 'Active'
        WHEN u.contract_termination_date > CURDATE() THEN 'Future Termination'
        ELSE 'Terminated'
    END as Status
FROM leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
WHERE YEAR(lb.Year) = YEAR(CURDATE())
ORDER BY lb.EmployeeEmail;

SELECT 'Accumulated leave updated successfully!' as status;