-- Migration to add balance_updated flag to leave_taken table
-- This flag prevents duplicate balance deductions when approving leave requests

-- Add the balance_updated column if it doesn't exist
ALTER TABLE leave_taken 
ADD COLUMN IF NOT EXISTS balance_updated TINYINT(1) DEFAULT 0;

-- Update existing approved requests to mark them as already having their balance updated
-- This prevents re-processing of historical approvals
UPDATE leave_taken 
SET balance_updated = 1 
WHERE Status = 'approved';

-- Verify the column was added
DESCRIBE leave_taken;
