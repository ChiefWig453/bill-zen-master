# Home Management Backend

Self-hosted Node.js/Express backend for Home Management App with PostgreSQL.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+ running and accessible
- Resend API key for email functionality

## Installation

```bash
cd server
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Generate a secure random string
   - `RESEND_API_KEY`: Your Resend API key
   - `FRONTEND_URL`: Your frontend application URL

## Database Setup

See [SETUP.md](./SETUP.md) for detailed PostgreSQL installation and configuration instructions.

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Type checking
npm run typecheck
```

## Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Phase 2)
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout and invalidate refresh token
- `POST /api/auth/refresh` - Get new access token
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/update-password` - Update password with reset token
- `GET /api/auth/me` - Get current user profile

### Bills (Phase 3)
- `GET /api/bills` - List user's bills
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill

### Additional Routes (Phase 3)
- `/api/bill-templates` - Recurring bill templates
- `/api/incomes` - Income management
- `/api/dash-sessions` - DoorDash sessions
- `/api/dash-expenses` - DoorDash expenses
- `/api/maintenance-tasks` - Home maintenance tasks
- `/api/maintenance-history` - Task completion history
- `/api/preferences` - User preferences

### Admin (Phase 3)
- `POST /api/admin/invite` - Invite new user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/users` - List all users (admin only)

## Project Structure

```
server/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── config/
│   │   └── database.ts       # PostgreSQL connection
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   └── errorHandler.ts  # Global error handling
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── bills.ts          # Bills CRUD
│   │   ├── incomes.ts        # Incomes CRUD
│   │   ├── dash.ts           # DoorDash routes
│   │   ├── maintenance.ts    # Maintenance routes
│   │   ├── preferences.ts    # User preferences
│   │   └── admin.ts          # Admin routes
│   ├── services/
│   │   ├── auth.ts           # Auth service (password hashing, JWT)
│   │   └── email.ts          # Email service (Resend)
│   ├── cron/
│   │   └── reminders.ts      # Maintenance reminder cron job
│   └── types/
│       └── index.ts          # TypeScript interfaces
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Security

- JWT access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Passwords hashed with bcrypt (cost factor 12)
- Rate limiting: 100 requests per 15 minutes per IP
- Helmet.js for security headers
- CORS configured for frontend domain only

## Deployment

See [SETUP.md](./SETUP.md) for production deployment instructions including:
- Setting up as systemd service
- Configuring Nginx reverse proxy
- SSL/TLS with Let's Encrypt
- Database backups

## Current Implementation Status

- ✅ Phase 1: Backend Setup (Complete)
- ⏳ Phase 2: Authentication System (Pending)
- ⏳ Phase 3: Data API Routes (Pending)
- ⏳ Phase 4: Real-time Updates (Pending)
- ⏳ Phase 5: Edge Function Migration (Pending)
