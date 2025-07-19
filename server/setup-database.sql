
-- Quick Database Setup Script for Production
-- Run this after connecting to your production MySQL database

-- First, create the database schema
SOURCE database-schema.sql;

-- Check if the workingDays column exists in leave_taken table, if not add it
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'leave_taken' 
AND column_name = 'workingDays';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE leave_taken ADD COLUMN workingDays DECIMAL(8,3) DEFAULT 0',
    'SELECT "workingDays column already exists" as status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify tables were created
SHOW TABLES;

-- Check if default admin user exists
SELECT email, name, role FROM users WHERE role = 'admin';

-- Verify default departments
SELECT name FROM departments;

-- Check default holidays
SELECT name, date FROM company_holidays WHERE YEAR(date) = 2025;

-- Show database status
SELECT 
    'Database setup completed successfully!' as status,
    COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = DATABASE();
