
# Leave Management System - Deployment Guide

## Prerequisites
- Railway account (or similar cloud platform)
- MySQL database
- Domain for frontend (optional)

## Step 1: Backend Deployment on Railway

### 1.1 Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub account
3. Create a new project

### 1.2 Deploy Backend
1. Connect your GitHub repository to Railway
2. Create a new service for the backend:
   - Set source directory to `server`
   - Railway will auto-detect Node.js and build

### 1.3 Add MySQL Database
1. In Railway dashboard, click "Add Service"
2. Select "MySQL" from the database options
3. Railway will provision a MySQL instance

### 1.4 Configure Environment Variables
Set these environment variables in Railway:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-frontend-domain.com

# Database (Railway will provide these automatically)
MYSQL_URL=mysql://user:password@host:port/database

# SMTP (for email notifications)
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
```

### 1.5 Deploy Database Schema
1. Connect to your Railway MySQL database using a MySQL client
2. Run the schema creation script from `src/lib/database-schema.sql`
3. Import sample data using the CSV files in `sample_data/`

## Step 2: Frontend Deployment

### 2.1 Update Frontend Configuration
Update your frontend environment variables:
```
VITE_API_URL=https://your-backend-domain.railway.app
```

### 2.2 Deploy Frontend
1. Deploy frontend to Railway, Vercel, or Netlify
2. Update `FRONTEND_URL` in backend environment variables

## Step 3: Data Migration

### 3.1 Prepare CSV Files
Use the updated CSV templates in `sample_data/`:
- `users.csv` - Employee information
- `leave_balances.csv` - Leave balance data
- `leave_taken.csv` - Historical leave requests

### 3.2 Import Data
1. Connect to your MySQL database
2. Use the migration script in `src/lib/migration-script.sql`
3. Import CSV files into staging tables
4. Run `CALL CompleteDataMigration();`

## Step 4: Testing

### 4.1 Backend Health Check
Visit: `https://your-backend-domain.railway.app/health`

### 4.2 Frontend Testing
1. Test user authentication
2. Verify leave request functionality
3. Check admin panel features

## Step 5: Production Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Sample data imported
- [ ] SMTP email configured
- [ ] Frontend pointing to backend
- [ ] SSL certificates active
- [ ] Domain configured (if using custom domain)

## Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure `FRONTEND_URL` is correctly set
2. **Database connection**: Check `MYSQL_URL` format
3. **Email not sending**: Verify SMTP credentials and app passwords

### Support:
- Check Railway logs for backend issues
- Use browser dev tools for frontend debugging
- Verify database connectivity with MySQL client
