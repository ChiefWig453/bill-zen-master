-- Import Data Script for Self-Hosted PostgreSQL
-- Place your CSV files in the same directory as this script
-- Run: psql -h localhost -U home_admin -d home_management -f import-data.sql

\echo 'Starting data import...'
\echo ''

-- Disable triggers during import for performance
SET session_replication_role = replica;

\echo 'Importing users...'
\COPY users FROM 'users.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing profiles...'
\COPY profiles FROM 'profiles.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing user_roles...'
\COPY user_roles FROM 'user_roles.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing user_passwords...'
\COPY user_passwords FROM 'user_passwords.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing user_preferences...'
\COPY user_preferences FROM 'user_preferences.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing bills...'
\COPY bills FROM 'bills.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing bill_templates...'
\COPY bill_templates FROM 'bill_templates.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing incomes...'
\COPY incomes FROM 'incomes.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing dash_sessions...'
\COPY dash_sessions FROM 'dash_sessions.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing dash_expenses...'
\COPY dash_expenses FROM 'dash_expenses.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing maintenance_tasks...'
\COPY maintenance_tasks FROM 'maintenance_tasks.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing maintenance_history...'
\COPY maintenance_history FROM 'maintenance_history.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing refresh_tokens...'
\COPY refresh_tokens FROM 'refresh_tokens.csv' WITH CSV HEADER NULL 'null';

\echo 'Importing password_reset_tokens...'
\COPY password_reset_tokens FROM 'password_reset_tokens.csv' WITH CSV HEADER NULL 'null';

-- Re-enable triggers
SET session_replication_role = DEFAULT;

\echo ''
\echo 'Data import completed!'
\echo ''
\echo 'Verifying record counts...'

SELECT 'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'user_passwords', COUNT(*) FROM user_passwords
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'bill_templates', COUNT(*) FROM bill_templates
UNION ALL
SELECT 'incomes', COUNT(*) FROM incomes
UNION ALL
SELECT 'dash_sessions', COUNT(*) FROM dash_sessions
UNION ALL
SELECT 'dash_expenses', COUNT(*) FROM dash_expenses
UNION ALL
SELECT 'maintenance_tasks', COUNT(*) FROM maintenance_tasks
UNION ALL
SELECT 'maintenance_history', COUNT(*) FROM maintenance_history
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
UNION ALL
SELECT 'password_reset_tokens', COUNT(*) FROM password_reset_tokens;

\echo ''
\echo 'Checking for orphaned records...'

-- Check for orphaned profiles
SELECT 
  COUNT(*) as orphaned_profiles,
  CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '✗ ERROR' END as status
FROM profiles p 
LEFT JOIN users u ON p.id = u.id 
WHERE u.id IS NULL;

-- Check for orphaned user_passwords
SELECT 
  COUNT(*) as orphaned_passwords,
  CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '✗ ERROR' END as status
FROM user_passwords up 
LEFT JOIN users u ON up.user_id = u.id 
WHERE u.id IS NULL;

-- Check for orphaned bills
SELECT 
  COUNT(*) as orphaned_bills,
  CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '✗ ERROR' END as status
FROM bills b 
LEFT JOIN users u ON b.user_id = u.id 
WHERE u.id IS NULL;

\echo ''
\echo 'Migration verification complete!'
