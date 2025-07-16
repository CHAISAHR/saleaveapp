
-- Quick Database Setup Script for Production
-- Run this after connecting to your production MySQL database

-- First, create the database schema
SOURCE database-schema.sql;

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
