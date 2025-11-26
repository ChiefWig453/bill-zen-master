# Production Setup - Serving Frontend and Backend Together

This guide shows how to run both frontend and backend from a single Express server.

## How It Works

- The Express backend serves the built React frontend as static files
- All API routes are under `/api/*`
- All other routes serve the React app (for client-side routing)
- Everything runs on one port (default: 3001)

---

## Step 1: Build the Frontend

From the project root directory:

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

---

## Step 2: Set Up Backend Environment

Create `server/.env` file:

```env
# Database
DATABASE_URL=postgresql://home_admin:your_password@localhost:5432/home_management

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email
RESEND_API_KEY=your-resend-api-key

# Server
PORT=3001
NODE_ENV=production

# No FRONTEND_URL needed - backend serves frontend
```

---

## Step 3: Build the Backend

```bash
cd server
npm install
npm run build
```

---

## Step 4: Start with PM2 (Recommended)

Install PM2 globally:
```bash
npm install -g pm2
```

Start the server:
```bash
pm2 start dist/index.js --name "home-management" --env production
```

Configure PM2 to start on system boot:
```bash
pm2 startup
pm2 save
```

---

## Step 5: Access Your Application

Open your browser to:
```
http://your-server-ip:3001
```

Everything (frontend + API) is served from this one URL.

---

## Useful PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs home-management

# Restart after changes
pm2 restart home-management

# Stop the server
pm2 stop home-management

# Remove from PM2
pm2 delete home-management

# Monitor resources
pm2 monit
```

---

## Updating Your Application

### After Making Changes in Lovable:

1. **Pull latest code:**
   ```bash
   cd /path/to/your/project
   git pull origin main
   ```

2. **Rebuild frontend:**
   ```bash
   npm install  # if package.json changed
   npm run build
   ```

3. **Rebuild backend:**
   ```bash
   cd server
   npm install  # if package.json changed
   npm run build
   ```

4. **Restart PM2:**
   ```bash
   pm2 restart home-management
   ```

5. **Verify it's running:**
   ```bash
   pm2 logs home-management --lines 50
   ```

---

## Deployment Script (Optional)

Create `deploy.sh` in project root:

```bash
#!/bin/bash

echo "🚀 Deploying Home Management App..."

# Exit on error
set -e

# Pull latest code
echo "📥 Pulling latest changes..."
git pull origin main

# Build frontend
echo "🎨 Building frontend..."
npm install
npm run build

# Build backend
echo "⚙️  Building backend..."
cd server
npm install
npm run build
cd ..

# Restart PM2
echo "🔄 Restarting server..."
pm2 restart home-management

echo "✅ Deployment complete!"
pm2 logs home-management --lines 20
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```

---

## Troubleshooting

### Frontend shows 404 errors for API calls

**Problem:** VITE_API_URL is incorrect

**Solution:** Make sure `.env` has:
```
VITE_API_URL=/api
```

Then rebuild frontend: `npm run build`

### Static files not loading

**Problem:** Backend can't find the dist folder

**Solution:** Check that:
1. Frontend build created `dist/` folder in project root
2. Backend's NODE_ENV is set to `production`
3. Path is correct: `../../dist` from `server/dist/index.js`

### Server won't start

**Check logs:**
```bash
pm2 logs home-management
```

**Common issues:**
- Database connection failed → Check DATABASE_URL
- Port 3001 already in use → Change PORT in .env or kill other process
- Missing dependencies → Run `npm install` in server folder

### Changes don't appear

**Solution:**
1. Rebuild frontend: `npm run build`
2. Rebuild backend: `cd server && npm run build`
3. Restart: `pm2 restart home-management`
4. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

---

## Production Checklist

- [ ] Frontend built: `npm run build` creates `dist/` folder
- [ ] Backend environment variables configured in `server/.env`
- [ ] NODE_ENV set to `production`
- [ ] JWT_SECRET changed from default
- [ ] Database connected and accessible
- [ ] PM2 installed and server started
- [ ] PM2 configured to auto-start on boot
- [ ] Application accessible at `http://your-server:3001`
- [ ] API endpoints responding (check `/health`)

---

## Optional: Use Port 80 with Reverse Proxy

If you want to serve on standard HTTP port (80) without `:3001`, set up nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Restart nginx:
```bash
sudo systemctl restart nginx
```
