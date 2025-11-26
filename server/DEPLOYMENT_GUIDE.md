# Deployment Guide: Updating Your Self-Hosted Server

This guide explains how to update your self-hosted backend when changes are pushed to GitHub from Lovable.

---

## Prerequisites

1. **Git installed** on your server
2. **Node.js and npm** installed (version 18 or higher)
3. **PostgreSQL database** running with your data
4. **SSH access** to your server
5. **GitHub repository** connected to your Lovable project

---

## Part 1: Initial Server Setup (One-Time Only)

### Step 1.1: Clone Repository on Your Server

SSH into your server:
```bash
ssh your-username@your-server-ip
```

Navigate to where you want the code:
```bash
cd /home/your-username/apps
# or wherever you want to store the project
```

Clone your repository:
```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME
```

### Step 1.2: Install Dependencies

```bash
cd server
npm install
```

### Step 1.3: Configure Environment Variables

Create your `.env` file:
```bash
nano .env
```

Add your configuration (replace with your actual values):
```env
# Database - Your self-hosted PostgreSQL
DATABASE_URL=postgresql://home_admin:your_secure_password@localhost:5432/home_management

# Security - Generate a long random string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email service for password resets
RESEND_API_KEY=your-resend-api-key

# Server configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

Save and exit (Ctrl+X, then Y, then Enter in nano).

### Step 1.4: Initial Build

```bash
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### Step 1.5: Start the Server

**Option A: Simple (development/testing):**
```bash
npm start
```

**Option B: Production with PM2 (recommended):**

Install PM2 globally:
```bash
npm install -g pm2
```

Start your server:
```bash
pm2 start dist/index.js --name "home-management-api"
```

Make PM2 auto-restart on server reboot:
```bash
pm2 startup
pm2 save
```

Check status:
```bash
pm2 status
```

View logs:
```bash
pm2 logs home-management-api
```

---

## Part 2: Updating Your Server (Every Time You Make Changes)

### Step 2.1: SSH Into Your Server

```bash
ssh your-username@your-server-ip
```

### Step 2.2: Navigate to Project Directory

```bash
cd /home/your-username/apps/YOUR-REPO-NAME
```

### Step 2.3: Check Current Status

See what branch you're on:
```bash
git branch
```

Check for uncommitted changes:
```bash
git status
```

If you have local changes, you may need to stash them:
```bash
git stash
```

### Step 2.4: Pull Latest Changes from GitHub

```bash
git pull origin main
```

You should see output like:
```
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (15/15), done.
Updating abc1234..def5678
Fast-forward
 server/src/routes/authRoutes.ts | 45 ++++++++++++++++++++++++
 server/src/services/authService.ts | 123 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 168 insertions(+)
```

### Step 2.5: Check What Changed

Review the changes:
```bash
git log -1 --stat
```

This shows files that were modified.

### Step 2.6: Update Dependencies (If package.json Changed)

If you see `server/package.json` in the changed files:
```bash
cd server
npm install
```

Otherwise, skip this step.

### Step 2.7: Check for Database Migrations

Look for new SQL files or migration instructions:
```bash
ls -la server/migrations/  # if you have a migrations folder
```

If there are new database changes, you'll need to run them:

**Option A: Using psql command line:**
```bash
psql -h localhost -U home_admin -d home_management -f server/migrations/XXXXX_migration.sql
```

**Option B: Using SQL client:**
Connect to your PostgreSQL database and run the SQL manually.

**For this project, check server/SETUP.md for any new table structures needed.**

### Step 2.8: Rebuild the TypeScript Code

```bash
cd server
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Step 2.9: Restart Your Server

**If using npm start directly:**
- Stop the current process (Ctrl+C)
- Start again: `npm start`

**If using PM2 (recommended):**
```bash
pm2 restart home-management-api
```

Check it restarted successfully:
```bash
pm2 status
```

View logs to verify no errors:
```bash
pm2 logs home-management-api --lines 50
```

### Step 2.10: Verify Everything Works

Test your API endpoints:
```bash
# Health check
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## Part 3: Automated Deployment Script

Create a deployment script to automate the above process.

### Step 3.1: Create Deploy Script

On your server, create the script:
```bash
cd /home/your-username/apps/YOUR-REPO-NAME/server
nano deploy.sh
```

Add this content:
```bash
#!/bin/bash

# Deployment script for Home Management Backend
# Usage: ./deploy.sh

echo "🚀 Starting deployment..."

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📂 Project directory: $PROJECT_ROOT"

# Step 1: Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
git pull origin main

# Step 2: Check if package.json changed
if git diff HEAD@{1} HEAD --name-only | grep -q "server/package.json"; then
    echo -e "${YELLOW}📦 package.json changed, updating dependencies...${NC}"
    cd server
    npm install
    cd ..
else
    echo -e "${GREEN}✓ No dependency changes${NC}"
fi

# Step 3: Check for migration files
if [ -d "server/migrations" ]; then
    NEW_MIGRATIONS=$(git diff HEAD@{1} HEAD --name-only | grep "server/migrations" || true)
    if [ ! -z "$NEW_MIGRATIONS" ]; then
        echo -e "${RED}⚠️  WARNING: New database migrations detected!${NC}"
        echo -e "${RED}Please run these migrations manually:${NC}"
        echo "$NEW_MIGRATIONS"
        read -p "Press enter after running migrations..."
    fi
fi

# Step 4: Build TypeScript
echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
cd server
npm run build

# Step 5: Restart server with PM2
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Restarting server with PM2...${NC}"
    pm2 restart home-management-api
    
    # Wait a moment for startup
    sleep 2
    
    # Check status
    if pm2 status | grep -q "home-management-api.*online"; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        pm2 logs home-management-api --lines 20
    else
        echo -e "${RED}❌ Server failed to start. Check logs:${NC}"
        pm2 logs home-management-api --lines 50
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  PM2 not found. Please restart your server manually.${NC}"
    echo "Run: cd server && npm start"
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
```

Save and exit (Ctrl+X, Y, Enter).

### Step 3.2: Make Script Executable

```bash
chmod +x deploy.sh
```

### Step 3.3: Use the Script

Now whenever you need to update, just run:
```bash
cd /home/your-username/apps/YOUR-REPO-NAME/server
./deploy.sh
```

---

## Part 4: Troubleshooting

### Problem: "git pull" shows merge conflicts

**Solution:**
```bash
# Save your local changes
git stash

# Pull changes
git pull origin main

# Reapply your changes (if needed)
git stash pop
```

### Problem: Server won't start after update

**Check logs:**
```bash
pm2 logs home-management-api
```

**Common issues:**
1. **Missing environment variable** - Check your `.env` file
2. **Database connection failed** - Verify DATABASE_URL is correct
3. **Port already in use** - Another process is using port 3001
4. **TypeScript build errors** - Run `npm run build` and check for errors

### Problem: Database migration needed but not sure how

**Find the migration:**
Look in SETUP.md or check recent commits for SQL changes.

**Run it manually:**
```bash
psql -h localhost -U home_admin -d home_management
# Then paste the SQL and run it
```

### Problem: PM2 not installed

**Install it:**
```bash
npm install -g pm2
```

### Problem: Changes don't seem to apply

**Full cleanup and rebuild:**
```bash
cd server
rm -rf node_modules dist
npm install
npm run build
pm2 restart home-management-api
```

---

## Part 5: Best Practices

### 1. Always Check Logs After Deployment
```bash
pm2 logs home-management-api --lines 50
```

### 2. Test Critical Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Test auth (after phase 2)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

### 3. Backup Database Before Major Changes
```bash
pg_dump -h localhost -U home_admin home_management > backup-$(date +%Y%m%d).sql
```

### 4. Monitor Server Resources
```bash
# Check memory/CPU usage
pm2 monit
```

### 5. Set Up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Part 6: GitHub Actions Auto-Deploy (Advanced)

If you want fully automatic deployments when you push to GitHub, you can set up GitHub Actions.

### Step 6.1: Generate SSH Key on Your Server

```bash
ssh-keygen -t ed25519 -C "github-deploy"
# Save as: /home/your-username/.ssh/github_deploy
# Don't set a passphrase (press Enter)
```

### Step 6.2: Add Public Key to Authorized Keys

```bash
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
```

### Step 6.3: Copy Private Key

```bash
cat ~/.ssh/github_deploy
```

Copy this entire output (including `-----BEGIN` and `-----END` lines).

### Step 6.4: Add to GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `SSH_PRIVATE_KEY`
5. Value: Paste the private key
6. Click "Add secret"

Add more secrets:
- `SSH_HOST`: Your server IP address
- `SSH_USER`: Your server username
- `SSH_PORT`: Usually `22`

### Step 6.5: Create GitHub Actions Workflow

This would be created in `.github/workflows/deploy.yml` (but Lovable will need to create this for you).

Ask Lovable: "Create a GitHub Actions workflow for auto-deploying the backend when changes are pushed to main"

---

## Quick Reference Commands

```bash
# Update server (manual)
cd /path/to/project
git pull origin main
cd server
npm install  # only if package.json changed
npm run build
pm2 restart home-management-api

# Update server (with script)
cd /path/to/project/server
./deploy.sh

# Check server status
pm2 status
pm2 logs home-management-api

# View recent changes
git log -5 --oneline

# Backup database
pg_dump -h localhost -U home_admin home_management > backup.sql

# Restore database
psql -h localhost -U home_admin home_management < backup.sql
```

---

## Need Help?

- Check server logs: `pm2 logs home-management-api`
- Check database connection: `psql -h localhost -U home_admin -d home_management -c "SELECT 1;"`
- Test API: `curl http://localhost:3001/health`
- Review recent commits: `git log -3`

For deployment issues, check:
1. Are dependencies installed? (`node_modules/` exists)
2. Is TypeScript compiled? (`dist/` folder exists)
3. Is `.env` file configured correctly?
4. Is PostgreSQL running? (`sudo systemctl status postgresql`)
5. Is the port free? (`lsof -i :3001`)
