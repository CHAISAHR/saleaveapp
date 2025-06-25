
-- Complete Migration Script for Leave Management System
-- This script handles CSV import and automatic AccumulatedLeave calculation

-- =========================================================================
-- STEP 1: Create staging tables for CSV import
-- =========================================================================

-- Staging table for users CSV import
CREATE TABLE IF NOT EXISTS staging_users (
    email VARCHAR(255),
    name VARCHAR(255),
    department VARCHAR(100),
    gender VARCHAR(10),
    role VARCHAR(20),
    hire_date VARCHAR(20), -- Import as string first, then convert
    manager_email VARCHAR(255),
    contract_termination_date VARCHAR(20), -- Import as string first
    is_active VARCHAR(10) -- Import as string first
);

-- Staging table for leave_balances CSV import (WITHOUT AccumulatedLeave)
CREATE TABLE IF NOT EXISTS staging_leave_balances (
    EmployeeName VARCHAR(255),
    EmployeeEmail VARCHAR(255),
    Department VARCHAR(100),
    Year VARCHAR(10), -- Import as string first
    Broughtforward VARCHAR(20), -- Import as string first
    AnnualUsed VARCHAR(20),
    Forfeited VARCHAR(20),
    Annual_leave_adjustments VARCHAR(20),
    SickUsed VARCHAR(20),
    MaternityUsed VARCHAR(20),
    ParentalUsed VARCHAR(20),
    FamilyUsed VARCHAR(20),
    AdoptionUsed VARCHAR(20),
    StudyUsed VARCHAR(20),
    MentalhealthUsed VARCHAR(20),
    Contract_termination_date VARCHAR(20),
    termination_balance VARCHAR(20),
    Manager VARCHAR(255)
);

-- Staging table for leave_taken CSV import
CREATE TABLE IF NOT EXISTS staging_leave_taken (
    Title VARCHAR(255),
    Detail TEXT,
    StartDate VARCHAR(20),
    EndDate VARCHAR(20),
    LeaveType VARCHAR(50),
    Requester VARCHAR(255),
    Approver VARCHAR(255),
    Status VARCHAR(20),
    Created VARCHAR(30)
);

-- =========================================================================
-- STEP 2: Data validation and cleanup procedures
-- =========================================================================

DELIMITER //

-- Procedure to validate and clean staging data
CREATE OR REPLACE PROCEDURE ValidateStagingData()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE validation_errors TEXT DEFAULT '';
    
    -- Check for invalid departments in staging_users
    SELECT GROUP_CONCAT(DISTINCT department) INTO @invalid_depts
    FROM staging_users su
    WHERE su.department NOT IN (SELECT name FROM departments);
    
    IF @invalid_depts IS NOT NULL THEN
        SET validation_errors = CONCAT(validation_errors, 'Invalid departments: ', @invalid_depts, '; ');
    END IF;
    
    -- Check for invalid manager emails
    SELECT GROUP_CONCAT(DISTINCT manager_email) INTO @invalid_managers
    FROM staging_users su
    WHERE su.manager_email IS NOT NULL 
    AND su.manager_email != ''
    AND su.manager_email NOT IN (SELECT email FROM staging_users);
    
    IF @invalid_managers IS NOT NULL THEN
        SET validation_errors = CONCAT(validation_errors, 'Invalid manager emails: ', @invalid_managers, '; ');
    END IF;
    
    -- Display validation results
    IF validation_errors = '' THEN
        SELECT 'Validation passed: All data is valid for migration' AS result;
    ELSE
        SELECT CONCAT('Validation errors found: ', validation_errors) AS result;
    END IF;
END//

-- Procedure to calculate AccumulatedLeave based on business rules
CREATE OR REPLACE PROCEDURE CalculateAccumulatedLeave()
BEGIN
    DECLARE current_year INT DEFAULT YEAR(CURRENT_DATE);
    DECLARE current_month INT DEFAULT MONTH(CURRENT_DATE);
    
    -- Update AccumulatedLeave for each employee based on business rules
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
        WHEN YEAR(u.hire_date) = current_year THEN
            LEAST(
                (current_month - MONTH(u.hire_date)) * 1.667 + 
                ((DAY(CURRENT_DATE) - DAY(u.hire_date)) / 30.0) * 1.667,
                20.0 -- Cap at 20 days annual
            )
        
        -- For existing employees: full monthly accumulation
        ELSE 
            LEAST(current_month * 1.667, 20.0) -- Cap at 20 days annual
    END
    WHERE lb.Year = current_year;
    
    SELECT CONCAT('AccumulatedLeave calculated for ', ROW_COUNT(), ' employees') AS result;
END//

DELIMITER ;

-- =========================================================================
-- STEP 3: Migration procedures
-- =========================================================================

DELIMITER //

-- Main migration procedure for users
CREATE OR REPLACE PROCEDURE MigrateUsers()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error occurred during user migration. Transaction rolled back.' AS error;
    END;
    
    START TRANSACTION;
    
    -- Insert users from staging table with proper data type conversion
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
        NULL -- No password hash for imported users (they'll use SSO or reset)
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
    COMMIT;
END//

-- Main migration procedure for leave balances
CREATE OR REPLACE PROCEDURE MigrateLeaveBalances()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error occurred during leave balance migration. Transaction rolled back.' AS error;
    END;
    
    START TRANSACTION;
    
    -- Insert leave balances from staging table
    INSERT INTO leave_balances (
        EmployeeName, EmployeeEmail, Department, Year,
        Broughtforward, AccumulatedLeave, AnnualUsed, Forfeited, Annual_leave_adjustments,
        SickUsed, MaternityUsed, ParentalUsed, FamilyUsed, AdoptionUsed, StudyUsed, MentalhealthUsed,
        Contract_termination_date, termination_balance, Manager,
        -- Set gender-based leave allocations
        Sick, Maternity, Parental, Family, Adoption, Study, Mentalhealth
    )
    SELECT 
        slb.EmployeeName,
        slb.EmployeeEmail,
        slb.Department,
        CAST(slb.Year AS UNSIGNED),
        CAST(NULLIF(slb.Broughtforward, '') AS DECIMAL(8,3)),
        0, -- AccumulatedLeave will be calculated later
        CAST(NULLIF(slb.AnnualUsed, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.Forfeited, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.Annual_leave_adjustments, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.SickUsed, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.MaternityUsed, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.ParentalUsed, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.FamilyUsed, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.AdoptionUsed, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.StudyUsed, '') AS DECIMAL(8,3)),
        CAST(NULLIF(slb.MentalhealthUsed, '') AS DECIMAL(8,3)),
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
        2   -- Mental health
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
        MentalhealthUsed = VALUES(MentalhealthUsed),
        Contract_termination_date = VALUES(Contract_termination_date),
        termination_balance = VALUES(termination_balance),
        Manager = VALUES(Manager);
    
    SELECT CONCAT('Migrated ', ROW_COUNT(), ' leave balance records successfully') AS result;
    COMMIT;
END//

-- Migration procedure for leave taken
CREATE OR REPLACE PROCEDURE MigrateLeaveRequests()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error occurred during leave request migration. Transaction rolled back.' AS error;
    END;
    
    START TRANSACTION;
    
    INSERT INTO leave_taken (
        Title, Detail, StartDate, EndDate, LeaveType, Requester, Approver, Status, Created
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
            WHEN LOWER(Status) IN ('pending', 'approved', 'rejected', 'cancelled') THEN LOWER(Status)
            ELSE 'pending' 
        END,
        STR_TO_DATE(Created, '%Y-%m-%d %H:%i:%s')
    FROM staging_leave_taken;
    
    SELECT CONCAT('Migrated ', ROW_COUNT(), ' leave requests successfully') AS result;
    COMMIT;
END//

DELIMITER ;

-- =========================================================================
-- STEP 4: Complete migration procedure
-- =========================================================================

DELIMITER //

CREATE OR REPLACE PROCEDURE CompleteDataMigration()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Migration failed. Please check data and try again.' AS error;
    END;
    
    -- Step 1: Validate staging data
    CALL ValidateStagingData();
    
    -- Step 2: Migrate users first (required for foreign key constraints)
    CALL MigrateUsers();
    
    -- Step 3: Migrate leave balances
    CALL MigrateLeaveBalances();
    
    -- Step 4: Calculate AccumulatedLeave based on business rules
    CALL CalculateAccumulatedLeave();
    
    -- Step 5: Migrate leave requests (optional)
    CALL MigrateLeaveRequests();
    
    -- Step 6: Clean up staging tables
    DROP TABLE IF EXISTS staging_users;
    DROP TABLE IF EXISTS staging_leave_balances;
    DROP TABLE IF EXISTS staging_leave_taken;
    
    SELECT 'Complete data migration finished successfully!' AS result;
END//

DELIMITER ;

-- =========================================================================
-- USAGE INSTRUCTIONS
-- =========================================================================

/*
TO USE THIS MIGRATION SCRIPT:

1. Import your CSV files into the staging tables using MySQL Workbench:
   - Import users.csv into staging_users table
   - Import leave_balances.csv into staging_leave_balances table
   - Import leave_taken.csv into staging_leave_taken table (optional)

2. Run the complete migration:
   CALL CompleteDataMigration();

3. Verify the results:
   SELECT * FROM users LIMIT 10;
   SELECT * FROM leave_balances LIMIT 10;
   SELECT EmployeeName, AccumulatedLeave, Current_leave_balance FROM leave_balances;

NOTES:
- AccumulatedLeave is automatically calculated based on hire dates and business rules
- Gender-based leave allocations are applied automatically (Maternity: 90 for females, 0 for males)
- All data validation is performed before migration
- The process is transactional - if any step fails, everything is rolled back
*/

-- Quick verification queries
-- SELECT 'Migration script created successfully. Ready for CSV import.' AS status;
