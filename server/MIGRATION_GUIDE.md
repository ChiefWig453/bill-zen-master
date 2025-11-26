# Database Migration Guide: Supabase to Self-Hosted PostgreSQL

This guide walks you through migrating your data from Supabase to a self-hosted PostgreSQL instance.

## Prerequisites

- Access to Supabase SQL Editor
- Self-hosted PostgreSQL instance (v13 or higher recommended)
- PostgreSQL client tools (`psql`, `pg_dump`, etc.)
- Database connection details for both Supabase and self-hosted PostgreSQL

## Phase 3: Database Migration Steps

### Step 1: Export Data from Supabase

#### Option A: Using Supabase Dashboard (Recommended for Small Datasets)

1. Go to Supabase Dashboard → Cloud → Database → Tables
2. For each table, click the export button (download icon)
3. Save each table as a CSV file:
   - `users.csv`
   - `profiles.csv`
   - `user_roles.csv`
   - `user_passwords.csv`
   - `user_preferences.csv`
   - `bills.csv`
   - `bill_templates.csv`
   - `incomes.csv`
   - `dash_sessions.csv`
   - `dash_expenses.csv`
   - `maintenance_tasks.csv`
   - `maintenance_history.csv`
   - `refresh_tokens.csv`
   - `password_reset_tokens.csv`

#### Option B: Using SQL Script (Recommended for Larger Datasets)

1. Connect to Supabase using `psql`:
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.rzzxfufbiziokdhaokcn.supabase.co:5432/postgres"
   ```

2. Run the export script:
   ```bash
   psql "your-supabase-connection-string" < server/scripts/export-supabase-data.sql > data-export.sql
   ```

### Step 2: Set Up Self-Hosted PostgreSQL

1. Install PostgreSQL 13+ on your server:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (using Homebrew)
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. Create a new database:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE home_management;
   CREATE USER home_admin WITH ENCRYPTED PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE home_management TO home_admin;
   \q
   ```

3. Configure PostgreSQL for remote access (if needed):
   - Edit `/etc/postgresql/[version]/main/postgresql.conf`:
     ```
     listen_addresses = '*'
     ```
   - Edit `/etc/postgresql/[version]/main/pg_hba.conf`:
     ```
     host    all             all             0.0.0.0/0            scram-sha-256
     ```
   - Restart PostgreSQL:
     ```bash
     sudo systemctl restart postgresql
     ```

### Step 3: Create Schema on Self-Hosted PostgreSQL

1. Connect to your self-hosted PostgreSQL:
   ```bash
   psql -h localhost -U home_admin -d home_management
   ```

2. Run the schema creation script:
   ```bash
   psql -h localhost -U home_admin -d home_management < server/scripts/create-schema.sql
   ```

3. Verify tables were created:
   ```sql
   \dt
   ```

### Step 4: Import Data

#### Option A: Import from CSV files

Create an import script for each table:

```sql
-- Import users
\COPY users FROM 'users.csv' WITH CSV HEADER;

-- Import profiles
\COPY profiles FROM 'profiles.csv' WITH CSV HEADER;

-- Import user_roles
\COPY user_roles FROM 'user_roles.csv' WITH CSV HEADER;

-- Import user_passwords
\COPY user_passwords FROM 'user_passwords.csv' WITH CSV HEADER;

-- Import user_preferences
\COPY user_preferences FROM 'user_preferences.csv' WITH CSV HEADER;

-- Import bills
\COPY bills FROM 'bills.csv' WITH CSV HEADER;

-- Import bill_templates
\COPY bill_templates FROM 'bill_templates.csv' WITH CSV HEADER;

-- Import incomes
\COPY incomes FROM 'incomes.csv' WITH CSV HEADER;

-- Import dash_sessions
\COPY dash_sessions FROM 'dash_sessions.csv' WITH CSV HEADER;

-- Import dash_expenses
\COPY dash_expenses FROM 'dash_expenses.csv' WITH CSV HEADER;

-- Import maintenance_tasks
\COPY maintenance_tasks FROM 'maintenance_tasks.csv' WITH CSV HEADER;

-- Import maintenance_history
\COPY maintenance_history FROM 'maintenance_history.csv' WITH CSV HEADER;

-- Import refresh_tokens
\COPY refresh_tokens FROM 'refresh_tokens.csv' WITH CSV HEADER;

-- Import password_reset_tokens
\COPY password_reset_tokens FROM 'password_reset_tokens.csv' WITH CSV HEADER;
```

#### Option B: Import using pg_restore (if you used pg_dump)

```bash
pg_restore -h localhost -U home_admin -d home_management your-backup-file.dump
```

### Step 5: Verify Data Migration

Run verification queries:

```sql
-- Check record counts
SELECT 'users' as table_name, COUNT(*) FROM users
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

-- Verify foreign key relationships
SELECT 
  COUNT(*) as orphaned_profiles 
FROM profiles p 
LEFT JOIN users u ON p.id = u.id 
WHERE u.id IS NULL;

-- Should return 0 orphaned records
```

### Step 6: Update Backend Configuration

1. Update `server/.env` with new database connection:
   ```env
   DATABASE_URL=postgresql://home_admin:your-secure-password@localhost:5432/home_management
   PGPASSWORD=your-secure-password
   ```

2. Test the connection:
   ```bash
   cd server
   npm run dev
   ```

3. Verify API endpoints are working with the new database

### Step 7: Test Application

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Test all features:
   - ✅ Login/Logout
   - ✅ User management
   - ✅ Bills CRUD
   - ✅ Incomes CRUD
   - ✅ DoorDash sessions/expenses
   - ✅ Maintenance tasks
   - ✅ Password reset

### Step 8: Production Deployment

Once verified locally:

1. Set up production PostgreSQL server
2. Run migration on production database
3. Update production environment variables
4. Deploy backend to production
5. Deploy frontend to production
6. Set up database backups

## Rollback Plan

If issues occur:

1. Keep Supabase connection active during migration
2. Maintain a copy of all exported data
3. Document any data transformations needed
4. Test rollback procedure before going live

## Common Issues and Solutions

### Issue: UUID Generation

**Problem:** UUIDs not generating automatically
**Solution:** Ensure `uuid-ossp` extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue: Timestamp Formats

**Problem:** Timestamp import errors
**Solution:** Ensure timestamp columns match format:
```sql
-- Use TIMESTAMP WITH TIME ZONE consistently
```

### Issue: ENUM Type Conflicts

**Problem:** `app_role` enum not defined
**Solution:** Create enum before creating tables:
```sql
CREATE TYPE app_role AS ENUM ('admin', 'user');
```

### Issue: Foreign Key Violations

**Problem:** Data import fails due to FK constraints
**Solution:** Import in correct order (parent tables first):
1. users
2. profiles, user_passwords, user_roles, user_preferences
3. All other tables

## Next Steps

After successful migration:

- **Phase 4:** Comprehensive testing
- **Phase 5:** Remove Supabase dependencies from code
- **Phase 6:** Production deployment and monitoring

## Support

For issues during migration, check:
- PostgreSQL logs: `/var/log/postgresql/postgresql-[version]-main.log`
- Backend logs: Check console output
- Connection issues: Verify firewall and pg_hba.conf settings
