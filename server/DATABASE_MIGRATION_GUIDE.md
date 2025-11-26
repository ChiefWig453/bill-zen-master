# Database Migration Guide: Adding Authentication Tables

This guide explains how to add the required authentication tables to your self-hosted PostgreSQL database for Phase 2 functionality.

---

## What Tables Are We Adding?

For Phase 2 (Authentication), we need to add:
1. **user_passwords** - Stores hashed passwords for users
2. **refresh_tokens** - Manages JWT refresh tokens for persistent login

These tables work with your existing `profiles` and `user_roles` tables.

---

## Prerequisites

- PostgreSQL database running (from SETUP.md Step 2)
- Database credentials (username, password, database name)
- Existing tables: `profiles`, `user_roles`, `user_preferences`

---

## Method 1: Using psql Command Line (Recommended)

### Step 1.1: Connect to Your Database

**On the same machine as PostgreSQL:**
```bash
psql -U home_admin -d home_management
```

**From a remote machine:**
```bash
psql -h your-server-ip -U home_admin -d home_management
```

You'll be prompted for your password. Enter the password you created in SETUP.md Step 2.

You should see:
```
home_management=#
```

### Step 1.2: Run the Migration SQL

Copy and paste this entire SQL block into your psql prompt:

```sql
-- =====================================================
-- Phase 2: Authentication Tables Migration
-- =====================================================

-- Table 1: User Passwords
-- Stores hashed passwords for authentication
CREATE TABLE IF NOT EXISTS public.user_passwords (
    user_id UUID PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_user_passwords_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE
);

-- Add comment explaining the table
COMMENT ON TABLE public.user_passwords IS 'Stores hashed passwords for user authentication';
COMMENT ON COLUMN public.user_passwords.user_id IS 'References profiles.id - the user this password belongs to';
COMMENT ON COLUMN public.user_passwords.password_hash IS 'bcrypt hashed password (never store plain text!)';

-- Table 2: Refresh Tokens
-- Manages JWT refresh tokens for persistent sessions
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_refresh_tokens_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE
);

-- Add comments
COMMENT ON TABLE public.refresh_tokens IS 'Stores JWT refresh tokens for session management';
COMMENT ON COLUMN public.refresh_tokens.token IS 'The actual JWT refresh token string';
COMMENT ON COLUMN public.refresh_tokens.expires_at IS 'When this token expires';
COMMENT ON COLUMN public.refresh_tokens.revoked_at IS 'When token was revoked (logout), NULL if still valid';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
    ON public.refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
    ON public.refresh_tokens(token);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at 
    ON public.refresh_tokens(expires_at);

-- Add trigger to update updated_at timestamp on user_passwords
CREATE OR REPLACE FUNCTION public.update_user_passwords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_passwords_timestamp
    BEFORE UPDATE ON public.user_passwords
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_passwords_updated_at();

-- Grant permissions (adjust if using different roles)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_passwords TO home_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO home_admin;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Migration completed successfully!'; 
END $$;
```

### Step 1.3: Verify the Tables Were Created

Still in psql, run:
```sql
-- List all tables
\dt public.*

-- Describe user_passwords table
\d public.user_passwords

-- Describe refresh_tokens table
\d public.refresh_tokens

-- Check indexes
\di public.idx_refresh_tokens*
```

You should see output showing the tables and their columns.

### Step 1.4: Exit psql

```bash
\q
```

---

## Method 2: Using SQL File

If you prefer to run the SQL from a file:

### Step 2.1: Create the Migration File

On your server:
```bash
cd /home/your-username/apps/YOUR-REPO-NAME/server
nano migrations/002_auth_tables.sql
```

### Step 2.2: Paste the SQL

Copy the entire SQL block from Method 1 Step 1.2 into this file.

Save and exit (Ctrl+X, Y, Enter).

### Step 2.3: Run the Migration File

```bash
psql -U home_admin -d home_management -f migrations/002_auth_tables.sql
```

You should see:
```
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
CREATE TRIGGER
GRANT
GRANT
NOTICE:  ✅ Migration completed successfully!
```

---

## Method 3: Using pgAdmin (GUI Tool)

If you prefer a graphical interface:

### Step 3.1: Open pgAdmin

Download and install pgAdmin from: https://www.pgadmin.org/download/

### Step 3.2: Connect to Your Database

1. Right-click **Servers** → **Create** → **Server**
2. **General** tab:
   - Name: `Home Management DB`
3. **Connection** tab:
   - Host: `localhost` (or your server IP)
   - Port: `5432`
   - Database: `home_management`
   - Username: `home_admin`
   - Password: [your password]
4. Click **Save**

### Step 3.3: Open Query Tool

1. Expand: **Servers** → **Home Management DB** → **Databases** → **home_management**
2. Click **Tools** → **Query Tool**

### Step 3.4: Run the SQL

1. Copy the SQL from Method 1 Step 1.2
2. Paste into the Query Tool
3. Click the **Execute** button (or press F5)

You should see success messages in the output panel.

### Step 3.5: Verify Tables

In the left sidebar:
1. Expand **Schemas** → **public** → **Tables**
2. You should see:
   - `user_passwords`
   - `refresh_tokens`
3. Right-click each table → **Properties** to view details

---

## Method 4: Using DBeaver (Alternative GUI)

### Step 4.1: Install DBeaver

Download from: https://dbeaver.io/download/

### Step 4.2: Create Connection

1. Click **Database** → **New Database Connection**
2. Select **PostgreSQL**
3. Enter connection details:
   - Host: `localhost` (or your server IP)
   - Port: `5432`
   - Database: `home_management`
   - Username: `home_admin`
   - Password: [your password]
4. Click **Test Connection**, then **Finish**

### Step 4.3: Run SQL

1. Right-click your connection → **SQL Editor** → **New SQL Script**
2. Paste the SQL from Method 1 Step 1.2
3. Click **Execute SQL Statement** (Ctrl+Enter)

---

## Verification Steps

After running the migration using any method, verify everything worked:

### Check 1: Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_passwords', 'refresh_tokens');
```

Should return 2 rows.

### Check 2: Columns Are Correct

```sql
-- Check user_passwords columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_passwords'
ORDER BY ordinal_position;

-- Check refresh_tokens columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'refresh_tokens'
ORDER BY ordinal_position;
```

### Check 3: Foreign Keys Work

```sql
-- This should list the foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('user_passwords', 'refresh_tokens');
```

Should show foreign keys to `profiles` table.

### Check 4: Indexes Were Created

```sql
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('user_passwords', 'refresh_tokens')
ORDER BY tablename, indexname;
```

Should show 3 indexes on `refresh_tokens`.

---

## Troubleshooting

### Error: "relation 'profiles' does not exist"

**Problem:** The `profiles` table wasn't created yet.

**Solution:** Run the initial schema migration from SETUP.md first.

### Error: "permission denied for table profiles"

**Problem:** User doesn't have permission to reference the profiles table.

**Solution:** Grant necessary permissions:
```sql
GRANT REFERENCES ON public.profiles TO home_admin;
```

### Error: "table 'user_passwords' already exists"

**Problem:** You already ran this migration.

**Solution:** Either:
1. Skip it (tables already exist)
2. Drop and recreate:
```sql
DROP TABLE IF EXISTS public.refresh_tokens;
DROP TABLE IF EXISTS public.user_passwords;
-- Then run the migration again
```

### Error: "password authentication failed"

**Problem:** Wrong database password.

**Solution:** 
1. Check your password from SETUP.md Step 2
2. Reset if needed:
```bash
sudo -u postgres psql
ALTER USER home_admin WITH PASSWORD 'new_secure_password';
\q
```

### Error: "could not connect to server"

**Problem:** PostgreSQL isn't running or not accepting connections.

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Enable on boot
sudo systemctl enable postgresql
```

### Error: "database 'home_management' does not exist"

**Problem:** Database wasn't created yet.

**Solution:** Create the database:
```bash
sudo -u postgres psql
CREATE DATABASE home_management;
\q
```

---

## Understanding the Tables

### user_passwords Table

**Purpose:** Stores password hashes for authentication

| Column | Type | Purpose |
|--------|------|---------|
| user_id | UUID | Links to profiles.id (one-to-one) |
| password_hash | TEXT | bcrypt hashed password |
| created_at | TIMESTAMP | When password was set |
| updated_at | TIMESTAMP | When password was last changed |

**Security Notes:**
- Passwords are NEVER stored in plain text
- Uses bcrypt hashing (one-way encryption)
- Foreign key ensures user exists in profiles table
- ON DELETE CASCADE means password is deleted when user is deleted

### refresh_tokens Table

**Purpose:** Manages JWT refresh tokens for persistent sessions

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Unique identifier for each token |
| user_id | UUID | Which user this token belongs to |
| token | TEXT | The actual JWT refresh token string |
| expires_at | TIMESTAMP | When token expires |
| revoked_at | TIMESTAMP | When token was revoked (logout) |
| created_at | TIMESTAMP | When token was issued |

**Security Notes:**
- Multiple tokens per user (multiple devices/sessions)
- Tokens can be revoked (logout)
- Expired tokens are ignored
- Indexes for fast lookups by user_id and token

---

## Next Steps

After successfully adding these tables:

1. **Test the Backend:**
   ```bash
   cd server
   npm run build
   npm start  # or pm2 restart home-management-api
   ```

2. **Test Signup:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "securepass123",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

3. **Verify Data Was Created:**
   ```sql
   -- Check if user was created
   SELECT id, email, first_name, last_name FROM profiles 
   WHERE email = 'test@example.com';

   -- Check if password was stored (should see a hash)
   SELECT user_id, substring(password_hash, 1, 20) as hash_preview
   FROM user_passwords
   WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com');

   -- Check user role
   SELECT ur.role, p.email 
   FROM user_roles ur
   JOIN profiles p ON ur.user_id = p.id
   WHERE p.email = 'test@example.com';
   ```

4. **Test Login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "securepass123"
     }'
   ```

   Should return access token and refresh token.

---

## Backup Before Migration

**Always backup before running migrations!**

```bash
# Create backup
pg_dump -h localhost -U home_admin home_management > backup-before-phase2-$(date +%Y%m%d).sql

# To restore if needed
psql -h localhost -U home_admin home_management < backup-before-phase2-YYYYMMDD.sql
```

---

## Quick Reference

**Connect to database:**
```bash
psql -U home_admin -d home_management
```

**Run migration from file:**
```bash
psql -U home_admin -d home_management -f migrations/002_auth_tables.sql
```

**Check tables exist:**
```sql
\dt public.*
```

**View table structure:**
```sql
\d public.user_passwords
\d public.refresh_tokens
```

**Exit psql:**
```bash
\q
```

---

## Need Help?

- **Check PostgreSQL logs:** `sudo journalctl -u postgresql -n 50`
- **Check if PostgreSQL is running:** `sudo systemctl status postgresql`
- **Test connection:** `psql -U home_admin -d home_management -c "SELECT 1;"`
- **View all databases:** `psql -U postgres -l`

Common commands:
- Start PostgreSQL: `sudo systemctl start postgresql`
- Stop PostgreSQL: `sudo systemctl stop postgresql`
- Restart PostgreSQL: `sudo systemctl restart postgresql`
- Enable on boot: `sudo systemctl enable postgresql`
