-- Script to identify and clean up duplicate leave requests
-- This script helps identify duplicate entries and provides safe cleanup options

-- 1. Identify duplicate leave requests (same requester, dates, type, and status)
SELECT 
    Requester,
    StartDate,
    EndDate,
    LeaveType,
    Status,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(LeaveID ORDER BY Created ASC) as leave_ids,
    MIN(Created) as first_created,
    MAX(Created) as last_created
FROM leave_taken 
GROUP BY Requester, StartDate, EndDate, LeaveType, Status
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, Requester, StartDate;

-- 2. Show detailed view of duplicates for manual review
SELECT 
    lt.LeaveID,
    lt.Requester,
    u.full_name,
    lt.Title,
    lt.StartDate,
    lt.EndDate,
    lt.LeaveType,
    lt.Status,
    lt.Created,
    lt.workingDays,
    COUNT(*) OVER (PARTITION BY lt.Requester, lt.StartDate, lt.EndDate, lt.LeaveType, lt.Status) as duplicate_count
FROM leave_taken lt
LEFT JOIN users u ON lt.Requester = u.email
WHERE (lt.Requester, lt.StartDate, lt.EndDate, lt.LeaveType, lt.Status) IN (
    SELECT Requester, StartDate, EndDate, LeaveType, Status
    FROM leave_taken 
    GROUP BY Requester, StartDate, EndDate, LeaveType, Status
    HAVING COUNT(*) > 1
)
ORDER BY lt.Requester, lt.StartDate, lt.Created;

-- 3. Safe cleanup - Keep the oldest request for each duplicate group
-- IMPORTANT: Review the above results before running this DELETE statement
-- Uncomment the following lines only after manual verification:

/*
DELETE lt1 FROM leave_taken lt1
INNER JOIN leave_taken lt2 
WHERE lt1.Requester = lt2.Requester 
    AND lt1.StartDate = lt2.StartDate 
    AND lt1.EndDate = lt2.EndDate 
    AND lt1.LeaveType = lt2.LeaveType 
    AND lt1.Status = lt2.Status
    AND lt1.LeaveID > lt2.LeaveID;  -- Keep the one with smaller ID (older)
*/

-- 4. Add a unique constraint to prevent future duplicates
-- This will prevent the same user from submitting identical requests
-- Note: This might need adjustment based on business rules
/*
ALTER TABLE leave_taken 
ADD CONSTRAINT unique_leave_request 
UNIQUE KEY (Requester, StartDate, EndDate, LeaveType, Status);
*/

-- 5. Verification query to run after cleanup
SELECT 'Cleanup verification' as status;
SELECT 
    COUNT(*) as total_requests,
    COUNT(DISTINCT CONCAT(Requester, '-', StartDate, '-', EndDate, '-', LeaveType, '-', Status)) as unique_requests
FROM leave_taken;