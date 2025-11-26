# PostgreSQL Setup Guide

This guide will help you set up a self-hosted PostgreSQL database on Linux for the Home Management App.

## Step 1: Install PostgreSQL on Linux

### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### CentOS/RHEL/Fedora
```bash
# Install PostgreSQL
sudo dnf install postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup --initdb

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Arch Linux
```bash
# Install PostgreSQL
sudo pacman -S postgresql

# Initialize database
sudo -u postgres initdb -D /var/lib/postgres/data

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE DATABASE home_management;
CREATE USER home_admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE home_management TO home_admin;

# Exit PostgreSQL shell
\q
```

## Step 3: Export Schema from Supabase

```bash
# Install pg_dump if not already installed
# On your machine (not server), run:

# Export schema only
pg_dump -h db.rzzxfufbiziokdhaokcn.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f schema.sql

# Export data only
pg_dump -h db.rzzxfufbiziokdhaokcn.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --no-owner \
  --no-privileges \
  -f data.sql
```

You'll need the Supabase database password. You can find it in:
Supabase Dashboard → Project Settings → Database → Connection String

## Step 4: Modify Schema for Self-Hosted Setup

Create a new file `schema_modifications.sql`:

```sql
-- Create users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify profiles table to link to users instead of auth.users
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update triggers to use updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Import to Self-Hosted PostgreSQL

```bash
# Copy files to your server
scp schema.sql data.sql schema_modifications.sql user@your-server:/tmp/

# On your server, import the schema
sudo -u postgres psql -d home_management -f /tmp/schema.sql

# Apply modifications
sudo -u postgres psql -d home_management -f /tmp/schema_modifications.sql

# Import data
sudo -u postgres psql -d home_management -f /tmp/data.sql
```

## Step 6: Configure PostgreSQL for Remote Access (Optional)

If your backend will run on a different server than PostgreSQL:

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Change listen_addresses
listen_addresses = '*'

# Edit pg_hba.conf to allow remote connections
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line (adjust IP range as needed)
host    home_management    home_admin    0.0.0.0/0    scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**⚠️ Security Note:** For production, restrict access to specific IP addresses instead of 0.0.0.0/0

## Step 7: Test Connection

```bash
# From your backend server
psql -h your-database-server-ip -U home_admin -d home_management

# Or test connection string
psql postgresql://home_admin:your_password@your-server-ip:5432/home_management
```

## Step 8: Configure Backend Environment

Create `server/.env` file:

```env
DATABASE_URL=postgresql://home_admin:your_secure_password@localhost:5432/home_management
JWT_SECRET=generate-a-long-random-string-here
RESEND_API_KEY=your-resend-api-key
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

## Step 9: Run Backend Server

```bash
cd server
npm install
npm run build
npm start

# Or for development
npm run dev
```

## Step 10: Set Up as System Service (Optional)

Create `/etc/systemd/system/home-management-api.service`:

```ini
[Unit]
Description=Home Management API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/server
ExecStart=/usr/bin/node /path/to/server/dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable home-management-api
sudo systemctl start home-management-api
sudo systemctl status home-management-api
```

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify firewall allows port 5432: `sudo ufw allow 5432`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`

### Authentication Failed
- Verify password in connection string
- Check pg_hba.conf configuration
- Ensure user has proper permissions: `GRANT ALL PRIVILEGES ON DATABASE home_management TO home_admin;`

### Cannot Find Tables
- Verify schema was imported correctly: `\dt` in psql
- Check you're connected to the right database: `\l` in psql
- Ensure schema modifications were applied

## Next Steps

After PostgreSQL is set up and running:
1. Test database connection from backend
2. Run migration to create users table
3. Implement Phase 2: Authentication System
4. Implement Phase 3: Data API Routes
