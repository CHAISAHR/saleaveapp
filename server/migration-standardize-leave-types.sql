-- Migration script to standardize leave types in the database
-- This will clean up inconsistencies like "annual", "Annual", "Annual leave" -> "Annual"

-- Standardize leave types in leave_taken table
UPDATE leave_taken SET LeaveType = 'Annual' WHERE LOWER(LeaveType) IN ('annual', 'annual leave', 'vacation');
UPDATE leave_taken SET LeaveType = 'Sick' WHERE LOWER(LeaveType) IN ('sick', 'sick leave', 'medical');
UPDATE leave_taken SET LeaveType = 'Maternity' WHERE LOWER(LeaveType) IN ('maternity', 'maternity leave');
UPDATE leave_taken SET LeaveType = 'Parental' WHERE LOWER(LeaveType) IN ('parental', 'parental leave', 'paternity', 'paternity leave');
UPDATE leave_taken SET LeaveType = 'Family' WHERE LOWER(LeaveType) IN ('family', 'family leave', 'family responsibility');
UPDATE leave_taken SET LeaveType = 'Adoption' WHERE LOWER(LeaveType) IN ('adoption', 'adoption leave');
UPDATE leave_taken SET LeaveType = 'Study' WHERE LOWER(LeaveType) IN ('study', 'study leave', 'education');
UPDATE leave_taken SET LeaveType = 'Wellness' WHERE LOWER(LeaveType) IN ('wellness', 'wellness leave', 'mental health');

-- Show the updated leave types for verification
SELECT DISTINCT LeaveType FROM leave_taken ORDER BY LeaveType;