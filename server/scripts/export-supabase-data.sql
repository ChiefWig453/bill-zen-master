-- Export Script for Supabase Data
-- Run this in Supabase SQL Editor to export your data
-- Copy the results and save them for import into self-hosted PostgreSQL

-- Export Users
\echo 'Exporting users...'
COPY (SELECT * FROM users ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Profiles
\echo 'Exporting profiles...'
COPY (SELECT * FROM profiles ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export User Roles
\echo 'Exporting user_roles...'
COPY (SELECT * FROM user_roles ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export User Passwords
\echo 'Exporting user_passwords...'
COPY (SELECT * FROM user_passwords ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export User Preferences
\echo 'Exporting user_preferences...'
COPY (SELECT * FROM user_preferences ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Bills
\echo 'Exporting bills...'
COPY (SELECT * FROM bills ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Bill Templates
\echo 'Exporting bill_templates...'
COPY (SELECT * FROM bill_templates ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Incomes
\echo 'Exporting incomes...'
COPY (SELECT * FROM incomes ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export DoorDash Sessions
\echo 'Exporting dash_sessions...'
COPY (SELECT * FROM dash_sessions ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export DoorDash Expenses
\echo 'Exporting dash_expenses...'
COPY (SELECT * FROM dash_expenses ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Maintenance Tasks
\echo 'Exporting maintenance_tasks...'
COPY (SELECT * FROM maintenance_tasks ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Maintenance History
\echo 'Exporting maintenance_history...'
COPY (SELECT * FROM maintenance_history ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Refresh Tokens
\echo 'Exporting refresh_tokens...'
COPY (SELECT * FROM refresh_tokens ORDER BY created_at) TO STDOUT WITH CSV HEADER;

-- Export Password Reset Tokens
\echo 'Exporting password_reset_tokens...'
COPY (SELECT * FROM password_reset_tokens ORDER BY created_at) TO STDOUT WITH CSV HEADER;
