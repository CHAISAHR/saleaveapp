-- STEP-BY-STEP MIGRATION COMMANDS
-- Run each section separately in MySQL Workbench

-- =========================================================================
-- STEP 1: Validate your staging data first
-- =========================================================================

-- Check for invalid departments
SELECT 'Checking departments...' AS step;
SELECT DISTINCT s.department, 
       CASE WHEN d.name IS NULL THEN 'INVALID' ELSE 'VALID' END AS status
FROM staging_users s
LEFT JOIN departments d ON s.department = d.name;

-- Check for invalid manager emails
SELECT 'Checking manager emails...' AS step;
SELECT DISTINCT s.manager_email,
       CASE WHEN s.manager_email IS NOT NULL 
            AND s.manager_email != '' 
            AND m.email IS NULL THEN 'INVALID' ELSE 'VALID' END AS status
FROM staging_users s
LEFT JOIN staging_users m ON s.manager_email = m.email
WHERE s.manager_email IS NOT NULL AND s.manager_email != '';

-- =========================================================================
-- STEP 2: Migrate users (run this block together)
-- =========================================================================

INSERT INTO users (
    email, name, department, gender, role, hire_date, 
    manager_email, contract_termination_date, is_active, password_hash
)
SELECT 
    email,
    name,
    department,
    CASE 
        WHEN LOWER(gender) IN ('male', 'female', 'other') THEN LOWER(gender)
        ELSE NULL 
    END,
    CASE 
        WHEN LOWER(role) IN ('employee', 'manager', 'admin') THEN LOWER(role)
        ELSE 'employee' 
    END,
    STR_TO_DATE(hire_date, '%Y-%m-%d'),
    NULLIF(manager_email, ''),
    CASE 
        WHEN contract_termination_date = '' OR contract_termination_date = 'NULL' THEN NULL
        ELSE STR_TO_DATE(contract_termination_date, '%Y-%m-%d')
    END,
    CASE 
        WHEN LOWER(is_active) = 'true' OR is_active = '1' THEN TRUE
        ELSE FALSE 
    END,
    NULL -- No password hash for imported users
FROM staging_users
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    department = VALUES(department),
    gender = VALUES(gender),
    role = VALUES(role),
    hire_date = VALUES(hire_date),
    manager_email = VALUES(manager_email),
    contract_termination_date = VALUES(contract_termination_date),
    is_active = VALUES(is_active);

SELECT CONCAT('Migrated ', ROW_COUNT(), ' users successfully') AS result;

-- =========================================================================
-- STEP 3: Migrate leave balances (run this block together)
-- =========================================================================

INSERT INTO leave_balances (
    EmployeeName, EmployeeEmail, Department, Year,
    Broughtforward, AccumulatedLeave, AnnualUsed, Forfeited, Annual_leave_adjustments,
    SickUsed, MaternityUsed, ParentalUsed, FamilyUsed, AdoptionUsed, StudyUsed, WellnessUsed,
    Contract_termination_date, termination_balance, Manager,
    -- Set gender-based leave allocations
    Sick, Maternity, Parental, Family, Adoption, Study, Wellness
)
SELECT 
    slb.EmployeeName,
    slb.EmployeeEmail,
    slb.Department,
    CAST(slb.Year AS UNSIGNED),
    CAST(NULLIF(slb.Broughtforward, '') AS DECIMAL(8,3)),
    0, -- AccumulatedLeave will be calculated next
    CAST(NULLIF(slb.AnnualUsed, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.Forfeited, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.Annual_leave_adjustments, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.SickUsed, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.MaternityUsed, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.ParentalUsed, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.FamilyUsed, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.AdoptionUsed, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.StudyUsed, '') AS DECIMAL(8,3)),
    CAST(NULLIF(slb.WellnessUsed, '') AS DECIMAL(8,3)),
    CASE 
        WHEN slb.Contract_termination_date = '' OR slb.Contract_termination_date = 'NULL' THEN NULL
        ELSE STR_TO_DATE(slb.Contract_termination_date, '%Y-%m-%d')
    END,
    CAST(NULLIF(slb.termination_balance, '') AS DECIMAL(8,3)),
    slb.Manager,
    -- Standard allocations
    36, -- Sick leave
    CASE WHEN u.gender = 'female' THEN 90 ELSE 0 END, -- Maternity
    20, -- Parental
    3,  -- Family
    20, -- Adoption
    6,  -- Study
    2   -- Wellness
FROM staging_leave_balances slb
JOIN users u ON slb.EmployeeEmail = u.email
ON DUPLICATE KEY UPDATE
    EmployeeName = VALUES(EmployeeName),
    Department = VALUES(Department),
    Broughtforward = VALUES(Broughtforward),
    AnnualUsed = VALUES(AnnualUsed),
    Forfeited = VALUES(Forfeited),
    Annual_leave_adjustments = VALUES(Annual_leave_adjustments),
    SickUsed = VALUES(SickUsed),
    MaternityUsed = VALUES(MaternityUsed),
    ParentalUsed = VALUES(ParentalUsed),
    FamilyUsed = VALUES(FamilyUsed),
    AdoptionUsed = VALUES(AdoptionUsed),
    StudyUsed = VALUES(StudyUsed),
    WellnessUsed = VALUES(WellnessUsed),
    Contract_termination_date = VALUES(Contract_termination_date),
    termination_balance = VALUES(termination_balance),
    Manager = VALUES(Manager);

SELECT CONCAT('Migrated ', ROW_COUNT(), ' leave balance records successfully') AS result;

-- =========================================================================
-- STEP 4: Calculate AccumulatedLeave (run this block together)
-- =========================================================================

SET @current_year = YEAR(CURRENT_DATE);
SET @current_month = MONTH(CURRENT_DATE);

UPDATE leave_balances lb
JOIN users u ON lb.EmployeeEmail = u.email
SET lb.AccumulatedLeave = CASE
    -- For terminated employees: calculate prorated accumulation up to termination date
    WHEN u.contract_termination_date IS NOT NULL AND u.contract_termination_date <= CURRENT_DATE THEN
        LEAST(
            (MONTH(u.contract_termination_date) - 1) * 1.667 + 
            (DAY(u.contract_termination_date) / DAY(LAST_DAY(u.contract_termination_date))) * 1.667,
            20.0 -- Cap at 20 days annual
        )
    
    -- For employees who started mid-year: prorated from hire date
    WHEN YEAR(u.hire_date) = @current_year THEN
        LEAST(
            (@current_month - MONTH(u.hire_date)) * 1.667 + 
            ((DAY(CURRENT_DATE) - DAY(u.hire_date)) / 30.0) * 1.667,
            20.0 -- Cap at 20 days annual
        )
    
    -- For existing employees: full monthly accumulation
    ELSE 
        LEAST(@current_month * 1.667, 20.0) -- Cap at 20 days annual
END
WHERE lb.Year = @current_year;

SELECT CONCAT('AccumulatedLeave calculated for ', ROW_COUNT(), ' employees') AS result;

-- =========================================================================
-- STEP 5: Migrate leave requests (optional - only if you have leave_taken data)
-- =========================================================================

INSERT INTO leave_taken (
    Title, Detail, StartDate, EndDate, LeaveType, Requester, Approver, Status, workingDays, Created
)
SELECT 
    Title,
    Detail,
    STR_TO_DATE(StartDate, '%Y-%m-%d'),
    STR_TO_DATE(EndDate, '%Y-%m-%d'),
    LeaveType,
    Requester,
    NULLIF(Approver, ''),
    CASE 
        WHEN LOWER(Status) IN ('pending', 'approved', 'declined', 'cancelled') THEN LOWER(Status)
        ELSE 'pending' 
    END,
    CAST(NULLIF(workingDays, '') AS DECIMAL(8,3)),
    STR_TO_DATE(Created, '%Y-%m-%d %H:%i:%s')
FROM staging_leave_taken;

SELECT CONCAT('Migrated ', ROW_COUNT(), ' leave requests successfully') AS result;

-- =========================================================================
-- STEP 6: Verification queries
-- =========================================================================

-- Check users
SELECT 'Users imported:' AS info, COUNT(*) as count FROM users;

-- Check leave balances with AccumulatedLeave
SELECT 'Leave balances imported:' AS info, COUNT(*) as count FROM leave_balances;

-- Show sample data
SELECT EmployeeName, EmployeeEmail, Department, Year, 
       Broughtforward, AccumulatedLeave, AnnualUsed,
       (Broughtforward + AccumulatedLeave - AnnualUsed - Forfeited + Annual_leave_adjustments) AS Current_leave_balance
FROM leave_balances 
LIMIT 5;

-- =========================================================================
-- STEP 7: Clean up staging tables (run after verification)
-- =========================================================================

-- Uncomment these lines after you've verified everything looks correct:
-- DROP TABLE IF EXISTS staging_users;
-- DROP TABLE IF EXISTS staging_leave_balances;
-- DROP TABLE IF EXISTS staging_leave_taken;

-- SELECT 'Migration completed successfully!' AS result;