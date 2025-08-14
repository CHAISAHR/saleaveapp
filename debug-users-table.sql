-- Debug script to check users table structure and fix the missing column issue
-- Run this to understand what's happening with the contract_termination_date column

-- First, let's see the current structure of the users table
DESCRIBE users;

-- Check if the column exists in information_schema
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    ORDINAL_POSITION
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'users' 
AND column_name = 'contract_termination_date';

-- If the column doesn't exist, force add it
ALTER TABLE users ADD COLUMN contract_termination_date DATE NULL AFTER is_active;

-- Verify it was added
DESCRIBE users;

-- Show a sample of the users table to confirm structure
SELECT COUNT(*) as total_users FROM users;