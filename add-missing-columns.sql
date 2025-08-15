-- Add missing columns to users table before running migration
-- Run this BEFORE running migration-steps.sql

-- Add contract_termination_date to users table if it doesn't exist
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'users' 
AND column_name = 'contract_termination_date';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE users ADD COLUMN contract_termination_date DATE NULL AFTER is_active',
    'SELECT "contract_termination_date column already exists" as status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the column was added
DESCRIBE users;