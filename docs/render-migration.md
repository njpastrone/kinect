# Kinect Railway → Render Migration Plan

## Overview

This document provides a comprehensive guide for migrating the Kinect application from Railway to Render. The migration involves transitioning the backend API, frontend static site, database to MongoDB Atlas, and scheduled email reminders to Render's infrastructure.

## Table of Contents

1. [Files to Remove / Add / Modify](#section-1-files-to-remove--add--modify)
2. [Functions or Modules to Update](#section-2-functions-or-modules-to-update)
3. [Ordered Migration Sequence](#section-3-ordered-migration-sequence)
4. [Render Deployment Configuration](#section-4-render-deployment-configuration)
5. [Testing & Validation Checklist](#section-5-testing--validation-checklist)

---

## Section 1: Files to Remove / Add / Modify

### Files to DELETE

```bash
# Railway-specific files
railway.json
railway.toml
railway.env.example
RAILWAY-DEPLOY.md
railway-template.json
nginx.railway.conf
Dockerfile.railway
scripts/railway-start.sh
scripts/test-railway-config.sh

# Docker files (not needed for Render)
docker-compose.yml
docker-compose.selfhosted.yml
Dockerfile  # (root)
backend/Dockerfile
backend/Dockerfile.selfhosted
frontend-web/Dockerfile.selfhosted
init-mongo.js
```

### Files to ADD

```bash
# Render configuration
render.yaml                          # Render blueprint configuration
backend/scripts/send-reminders.js    # Standalone cron job script
backend/render-start.sh              # Backend startup script for Render
frontend-web/render-build.sh         # Frontend build script
```

### Files to MODIFY

```bash
# Backend modifications
backend/package.json                 # Update build/start scripts
backend/src/app.ts                   # Remove cron job initialization
backend/src/config/database.ts       # Add MongoDB Atlas connection handling
backend/.env.example                  # Update for Render environment

# Frontend modifications
frontend-web/package.json            # Update build script
frontend-web/vite.config.ts          # Configure for production API URL
frontend-web/src/config/api.ts       # Update API base URL logic
```

---

## Section 2: Functions or Modules to Update

### Backend Changes

#### 1. Remove automatic cron job initialization from `backend/src/app.ts`

**File:** `backend/src/app.ts`

Remove line 18:
```typescript
// DELETE THIS LINE:
import './services/notification.service.simple';
```

#### 2. Create standalone reminder script

**File:** `backend/scripts/send-reminders.js`

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const { notificationService } = require('../dist/services/notification.service');

async function sendReminders() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Process weekly reminders
    await notificationService.processWeeklyReminders();
    console.log('✅ Reminders sent successfully');
    
    // Clean disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  sendReminders();
}

module.exports = { sendReminders };
```

#### 3. Update database configuration for MongoDB Atlas

**File:** `backend/src/config/database.ts`

```typescript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI as string;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
      // Connection pooling optimized for Render
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
```

### Frontend Changes

#### 4. Update API configuration for production

**File:** `frontend-web/src/config/api.ts`

```typescript
import axios from 'axios';

const getApiUrl = () => {
  // In production on Render, use the backend service URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://kinect-api.onrender.com/api';
  }
  // Development uses proxy
  return '/api';
};

export const API_BASE_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Section 3: Ordered Migration Sequence

### Phase 1: MongoDB Atlas Setup (Day 1)

#### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create organization and project

#### Step 2: Create Database Cluster
1. Choose **M0 Free Tier** or **M2 ($9/month)** for production
2. Select region closest to Render (e.g., Oregon us-west-2)
3. Name cluster: `kinect-production`

#### Step 3: Configure Security
1. **Network Access:**
   - Add IP Address: `0.0.0.0/0` (allow from anywhere)
   - Note: Restrict to Render IPs in production
2. **Database Access:**
   - Create database user
   - Username: `kinect-admin`
   - Generate secure password
   - Role: `Atlas Admin`

#### Step 4: Migrate Data
```bash
# Export from Railway MongoDB
mongodump --uri="mongodb://user:pass@containers-us-west-123.railway.app:5432/railway" --out=./backup

# Import to MongoDB Atlas
mongorestore --uri="mongodb+srv://kinect-admin:password@cluster.mongodb.net/kinect" ./backup/railway --db kinect
```

#### Step 5: Test Connection Locally
```bash
# Update .env with Atlas URI
MONGODB_URI="mongodb+srv://kinect-admin:password@cluster.mongodb.net/kinect?retryWrites=true&w=majority"

# Test backend connection
cd backend
npm run dev
```

### Phase 2: Repository Preparation (Day 1)

#### Step 1: Create Migration Branch
```bash
git checkout -b render-migration
```

#### Step 2: Remove Railway/Docker Files
```bash
# Remove Railway files
rm railway.json railway.toml railway.env.example
rm RAILWAY-DEPLOY.md railway-template.json
rm nginx.railway.conf Dockerfile.railway
rm -rf scripts/railway-*.sh

# Remove Docker files
rm docker-compose*.yml
rm Dockerfile
rm backend/Dockerfile*
rm frontend-web/Dockerfile*
rm init-mongo.js
```

#### Step 3: Create Render Configuration

**File:** `render.yaml`

```yaml
services:
  # Backend API Service
  - type: web
    name: kinect-api
    runtime: node
    region: oregon
    plan: starter # $7/month
    buildCommand: |
      cd shared && npm ci && npm run build &&
      cd ../backend && npm ci && npm run build
    startCommand: cd backend && node dist/app.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: MONGODB_URI
        sync: false # Set manually in dashboard
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: https://kinect-web.onrender.com
      - key: SMTP_HOST
        sync: false
      - key: SMTP_PORT
        value: 587
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false
      - key: FROM_EMAIL
        value: noreply@kinect.app

  # Frontend Static Site
  - type: static
    name: kinect-web
    buildCommand: |
      cd shared && npm ci && npm run build &&
      cd ../frontend-web && npm ci && npm run build
    staticPublishPath: ./frontend-web/dist
    headers:
      - path: /*
        name: X-Frame-Options
        value: SAMEORIGIN
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
    routes:
      - type: rewrite
        source: /api/*
        destination: https://kinect-api.onrender.com/api/*
    envVars:
      - key: VITE_API_URL
        value: https://kinect-api.onrender.com/api

  # Weekly Reminder Cron Job
  - type: cron
    name: kinect-reminders
    runtime: node
    schedule: "0 9 * * 1" # Monday 9 AM UTC
    buildCommand: cd backend && npm ci && npm run build
    startCommand: cd backend && node scripts/send-reminders.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: SMTP_HOST
        sync: false
      - key: SMTP_PORT
        value: 587
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false
      - key: FROM_EMAIL
        value: noreply@kinect.app

databases:
  # MongoDB Atlas (external)
  # Configure connection string in environment variables
```

#### Step 4: Update Package.json Scripts

**File:** `backend/package.json`

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "rimraf dist && tsc && cp -r src/scripts dist/scripts 2>/dev/null || true",
    "start": "node dist/app.js",
    "render-build": "npm ci && npm run build",
    "test": "jest",
    "lint": "eslint src"
  }
}
```

**File:** `frontend-web/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "render-build": "npm ci && npm run build",
    "preview": "vite preview",
    "lint": "eslint src"
  }
}
```

#### Step 5: Update Environment Example

**File:** `backend/.env.example`

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kinect?retryWrites=true&w=majority

# JWT Secrets (generated by Render)
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# CORS Configuration
CORS_ORIGIN=https://kinect-web.onrender.com

# SMTP Configuration (SendGrid/Mailgun/etc)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key-here
FROM_EMAIL=noreply@kinect.app

# Frontend URL (for emails)
FRONTEND_URL=https://kinect-web.onrender.com
```

#### Step 6: Commit Changes
```bash
git add .
git commit -m "feat: migrate from Railway to Render deployment"
```

### Phase 3: Render Deployment (Day 2)

#### Step 1: Render Account Setup
1. Sign up at [render.com](https://render.com)
2. Connect GitHub account
3. Authorize Render app

#### Step 2: Create Services from Blueprint
1. Click **New** → **Blueprint**
2. Connect repository
3. Select branch: `render-migration`
4. Name: `kinect-production`
5. Click **Apply**

#### Step 3: Configure Environment Variables

Navigate to each service and add environment variables:

**kinect-api:**
```
MONGODB_URI=mongodb+srv://kinect-admin:password@cluster.mongodb.net/kinect?retryWrites=true&w=majority
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.actual-api-key-here
```

**kinect-reminders:**
```
MONGODB_URI=mongodb+srv://kinect-admin:password@cluster.mongodb.net/kinect?retryWrites=true&w=majority
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.actual-api-key-here
```

#### Step 4: Deploy Services
1. Services auto-deploy on environment variable save
2. Monitor build logs in dashboard
3. Wait for all services to show **Live**

### Phase 4: Testing (Day 2-3)

#### API Health Check
```bash
curl https://kinect-api.onrender.com/health
# Expected: {"status":"OK","timestamp":"2024-..."}
```

#### Frontend Verification
```bash
# Visit in browser
open https://kinect-web.onrender.com

# Check console for errors
# Verify API calls work
```

#### End-to-End Testing
1. Create new account
2. Login
3. Add contact
4. Edit contact
5. Delete contact
6. Check dashboard

#### Cron Job Testing
1. Go to Render dashboard
2. Select `kinect-reminders`
3. Click **Run Now**
4. Check logs for success
5. Verify email received

### Phase 5: DNS Migration (Day 3)

#### Step 1: Add Custom Domain
1. In Render dashboard → `kinect-web`
2. Settings → Custom Domain
3. Add domain: `kinect.app`
4. Copy DNS records

#### Step 2: Update DNS Provider
```
Type: CNAME
Name: @
Value: kinect-web.onrender.com
TTL: 3600
```

#### Step 3: Update Environment Variables
```bash
# Update all services
CORS_ORIGIN=https://kinect.app
FRONTEND_URL=https://kinect.app
VITE_API_URL=https://kinect.app/api
```

### Phase 6: Cleanup (Day 4)

#### Step 1: Verify Production
- [ ] Custom domain works
- [ ] All features functional
- [ ] Emails sending
- [ ] No console errors

#### Step 2: Merge Code
```bash
git checkout main
git merge render-migration
git push origin main
```

#### Step 3: Shutdown Railway
1. Export any remaining data
2. Delete Railway services
3. Cancel subscription

#### Step 4: Update Documentation
```bash
# Update README
sed -i 's/Railway/Render/g' README.md

# Remove old docs
rm RAILWAY-DEPLOY.md
```

---

## Section 4: Render Deployment Configuration

### Service Definitions

#### Backend Web Service

| Setting | Value |
|---------|-------|
| **Name** | kinect-api |
| **Type** | Web Service |
| **Runtime** | Node |
| **Region** | Oregon (us-west) |
| **Instance** | Starter ($7/month) |
| **Auto-deploy** | Yes (from main) |
| **Health check** | /health |
| **Root directory** | / |

**Environment Variables:**
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=[MongoDB Atlas connection string]
JWT_SECRET=[Auto-generated 32 chars]
JWT_REFRESH_SECRET=[Auto-generated 32 chars]
CORS_ORIGIN=https://kinect-web.onrender.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=[SendGrid API Key]
FROM_EMAIL=noreply@kinect.app
FRONTEND_URL=https://kinect-web.onrender.com
```

#### Frontend Static Site

| Setting | Value |
|---------|-------|
| **Name** | kinect-web |
| **Type** | Static Site |
| **Build Command** | `cd shared && npm ci && npm run build && cd ../frontend-web && npm ci && npm run build` |
| **Publish Directory** | `frontend-web/dist` |
| **Auto-deploy** | Yes (from main) |

**Routes Configuration:**
```yaml
- type: rewrite
  source: /api/*
  destination: https://kinect-api.onrender.com/api/*
```

**Headers Configuration:**
```yaml
- path: /*
  name: X-Frame-Options
  value: SAMEORIGIN
- path: /*
  name: X-Content-Type-Options
  value: nosniff
- path: /*
  name: X-XSS-Protection
  value: 1; mode=block
```

#### Cron Job Service

| Setting | Value |
|---------|-------|
| **Name** | kinect-reminders |
| **Type** | Cron Job |
| **Runtime** | Node |
| **Schedule** | `0 9 * * 1` |
| **Command** | `node scripts/send-reminders.js` |
| **Working Directory** | backend |

**Cron Schedule Explained:**
- `0 9 * * 1` = Every Monday at 9:00 AM UTC
- Alternative schedules:
  - Daily: `0 9 * * *`
  - Weekly: `0 9 * * 1`
  - Monthly: `0 9 1 * *`

### GitHub Integration

#### Setup Steps:
1. **Install Render GitHub App:**
   - Go to GitHub → Settings → Applications
   - Install Render
   - Grant repository access

2. **Configure Auto-Deploy:**
   - Render Dashboard → Service → Settings
   - Auto-Deploy: ON
   - Branch: main
   - Auto-deploy on push

3. **Pull Request Previews:**
   - Enable PR Previews (optional)
   - Creates temporary environment per PR
   - Useful for testing changes

### Resource Scaling

#### When to Scale:
- **API Response Time** > 1 second consistently
- **Memory Usage** > 80% for extended periods
- **CPU Usage** > 70% sustained
- **Concurrent Users** > 100

#### Scaling Options:
1. **Vertical Scaling:**
   - Starter → Standard ($25/month)
   - Standard → Pro ($85/month)

2. **Horizontal Scaling:**
   - Add instances (load balanced)
   - Configure in Settings → Scaling

3. **Database Scaling:**
   - M0 → M2 ($9/month)
   - M2 → M10 ($57/month)

---

## Section 5: Testing & Validation Checklist

### Pre-deployment Testing (Local)

- [ ] **MongoDB Atlas Connection**
  ```bash
  MONGODB_URI="mongodb+srv://..." npm run dev
  # Check console for "MongoDB Connected"
  ```

- [ ] **Backend Without Docker**
  ```bash
  cd backend
  npm run build
  npm start
  # Visit http://localhost:3001/health
  ```

- [ ] **Frontend Build**
  ```bash
  cd frontend-web
  npm run build
  # Check dist/ folder created
  ```

- [ ] **API Endpoints**
  ```bash
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
  ```

- [ ] **Email Configuration**
  ```bash
  # Set SMTP variables in .env
  # Trigger password reset to test
  ```

### Backend Validation

- [ ] **Health Check**
  ```bash
  curl https://kinect-api.onrender.com/health
  # Expected: 200 OK with JSON response
  ```

- [ ] **Authentication Endpoints**
  ```bash
  # Register
  curl -X POST https://kinect-api.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
  
  # Login
  curl -X POST https://kinect-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!"}'
  ```

- [ ] **CORS Configuration**
  - Check browser console for CORS errors
  - Verify `Access-Control-Allow-Origin` header

- [ ] **Rate Limiting**
  ```bash
  # Send 100+ requests rapidly
  for i in {1..110}; do
    curl https://kinect-api.onrender.com/health &
  done
  # Should see 429 Too Many Requests after limit
  ```

- [ ] **Database Operations**
  - Create contact
  - Read contacts
  - Update contact
  - Delete contact
  - Check MongoDB Atlas metrics

### Frontend Validation

- [ ] **Static Site Loading**
  ```bash
  # Check response headers
  curl -I https://kinect-web.onrender.com
  # Should see 200 OK, correct Content-Type
  ```

- [ ] **Asset Loading**
  - Check Network tab in DevTools
  - All CSS/JS files should load (200 status)
  - No 404 errors for assets

- [ ] **API Routing**
  - Login attempt should hit backend
  - Check Network tab for `/api/*` requests
  - Verify requests go to correct backend URL

- [ ] **User Flows**
  - Registration flow
  - Login flow
  - Password reset flow
  - Contact management flow

- [ ] **Production Build Checks**
  - No console.log statements
  - No development warnings
  - Source maps disabled
  - Bundle size optimized

### Cron Job Validation

- [ ] **Manual Trigger**
  1. Render Dashboard → `kinect-reminders`
  2. Click **Run Now**
  3. Check Logs tab
  4. Should see:
     ```
     ✅ Connected to MongoDB Atlas
     ✅ Reminders sent successfully
     ✅ Disconnected from MongoDB
     ```

- [ ] **Database Connection**
  - Verify connects to same database
  - Check MongoDB Atlas connections graph

- [ ] **Email Delivery**
  - Create overdue contact
  - Run cron job
  - Check email inbox
  - Verify email content/formatting

- [ ] **Clean Exit**
  - Process should exit with code 0
  - No hanging connections
  - Memory properly released

- [ ] **Scheduled Execution**
  - Wait for scheduled time
  - Check logs for automatic execution
  - Verify runs only once

### Integration Testing

#### Test Scenario 1: New User Journey
1. Register new account
2. Verify welcome email
3. Login
4. Add 3 contacts
5. Create 2 lists
6. Assign contacts to lists
7. Logout and login again
8. Verify data persists

#### Test Scenario 2: Reminder Flow
1. Create contact with past date
2. Set reminder threshold
3. Trigger cron job manually
4. Verify reminder email
5. Update contact date
6. Re-run cron job
7. Verify no duplicate email

#### Test Scenario 3: Error Handling
1. Try invalid login
2. Submit form with missing fields
3. Test network interruption
4. Verify error messages
5. Check error boundaries

### Performance Validation

- [ ] **Backend Response Times**
  ```bash
  # Measure API latency
  curl -w "@curl-format.txt" -o /dev/null -s https://kinect-api.onrender.com/health
  # Should be < 500ms
  ```

- [ ] **Frontend Load Time**
  - Use Lighthouse in Chrome DevTools
  - Target metrics:
    - First Contentful Paint < 1.5s
    - Time to Interactive < 3.5s
    - Performance score > 80

- [ ] **Database Query Performance**
  - Check MongoDB Atlas Performance tab
  - Look for slow queries > 100ms
  - Verify indexes are used

- [ ] **Memory Usage**
  - Monitor Render metrics dashboard
  - Backend should stay under 256MB
  - No memory leaks over time

### Rollback Plan

If critical issues arise:

1. **Immediate Rollback:**
   ```bash
   # Revert to Railway
   git revert --no-commit HEAD~3..HEAD
   git commit -m "revert: rollback to Railway deployment"
   git push origin main
   ```

2. **DNS Rollback:**
   - Point domain back to Railway URL
   - Update CNAME record immediately
   - TTL typically 5-60 minutes

3. **Database Rollback:**
   ```bash
   # If data corrupted
   mongorestore --uri="mongodb+srv://..." ./backup --drop
   ```

4. **Communication:**
   - Notify users of temporary outage
   - Estimated restoration time
   - Status page update

### Post-Migration Monitoring

**Week 1:**
- [ ] Daily health checks
- [ ] Monitor error rates
- [ ] Check email delivery
- [ ] Review user feedback

**Week 2-4:**
- [ ] Weekly performance review
- [ ] Cost analysis
- [ ] Scale if needed
- [ ] Update documentation

**Ongoing:**
- [ ] Monthly security updates
- [ ] Quarterly performance audit
- [ ] Annual cost review
- [ ] Disaster recovery test

---

## Appendix: Troubleshooting

### Common Issues

#### MongoDB Connection Timeout
```bash
# Error: MongoServerSelectionError
# Solution: Whitelist all IPs in Atlas
Network Access → Add IP → 0.0.0.0/0
```

#### Build Failures
```bash
# Error: Module not found
# Solution: Check shared module built first
cd shared && npm ci && npm run build
```

#### CORS Errors
```javascript
// Verify backend CORS config
cors({
  origin: process.env.CORS_ORIGIN || 'https://kinect-web.onrender.com',
  credentials: true
})
```

#### Cron Job Not Running
```bash
# Check timezone (Render uses UTC)
# 9 AM UTC = 1 AM PST = 4 AM EST
# Adjust schedule accordingly
```

### Support Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Static Sites on Render](https://render.com/docs/static-sites)

---

## Conclusion

This migration plan provides a systematic approach to moving from Railway to Render with minimal downtime and risk. The key advantages of Render include:

- Simple, predictable pricing
- Native cron job support
- Excellent static site hosting
- Good developer experience
- Reliable service with auto-scaling options

Follow the checklist carefully, test thoroughly at each stage, and maintain backups throughout the migration process.