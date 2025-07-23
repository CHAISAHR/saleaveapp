-- Migration to add created_at column to leave_attachments table if it doesn't exist
-- This ensures backward compatibility with existing data

-- Check if the created_at column exists in leave_attachments table, if not add it
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'leave_attachments' 
AND column_name = 'created_at';

-- If uploaded_at exists but created_at doesn't, rename it
SET @uploaded_at_exists = 0;
SELECT COUNT(*) INTO @uploaded_at_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'leave_attachments' 
AND column_name = 'uploaded_at';

-- Add created_at column if it doesn't exist
SET @sql = IF(@column_exists = 0 AND @uploaded_at_exists = 0, 
    'ALTER TABLE leave_attachments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    IF(@column_exists = 0 AND @uploaded_at_exists = 1,
        'ALTER TABLE leave_attachments CHANGE uploaded_at created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'SELECT "created_at column already exists" as status')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the change
SELECT 'Migration completed successfully' as status;
DESCRIBE leave_attachments;