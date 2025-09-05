# Render Migration Implementation Checklist

## Step-by-Step Implementation Plan

### Stage 1: MongoDB Atlas Setup
**Timeline: Day 1, Morning**

- [ ] **1.1 Create MongoDB Atlas Account**
  - Go to mongodb.com/cloud/atlas
  - Sign up with Google/GitHub or email
  - Create organization name: "kinect-prod"
  - Create project: "kinect-application"

- [ ] **1.2 Create Database Cluster**
  - Click "Build a Database"
  - Choose M0 Free (or M2 for $9/month)
  - Provider: AWS
  - Region: Oregon (us-west-2) - same as Render
  - Cluster name: "kinect-production"

- [ ] **1.3 Configure Security**
  ```bash
  # Network Access
  Atlas Dashboard → Network Access → Add IP
  IP: 0.0.0.0/0 (Allow from anywhere)
  Comment: "Render deployment"
  
  # Database User
  Atlas Dashboard → Database Access → Add User
  Username: kinect-admin
  Password: [Generate secure 32-char password]
  Role: Atlas Admin
  ```

- [ ] **1.4 Export Railway Data**
  ```bash
  # Get Railway MongoDB URI from dashboard
  export RAILWAY_URI="mongodb://..."
  
  # Create backup directory
  mkdir -p ~/kinect-backup
  cd ~/kinect-backup
  
  # Export data
  mongodump --uri="$RAILWAY_URI" --out=./backup
  ```

- [ ] **1.5 Import to MongoDB Atlas**
  ```bash
  # Get Atlas URI from connection string
  export ATLAS_URI="mongodb+srv://kinect-admin:password@cluster.mongodb.net"
  
  # Import data
  mongorestore --uri="$ATLAS_URI/kinect" ./backup/railway --nsFrom="railway.*" --nsTo="kinect.*"
  
  # Verify import
  mongosh "$ATLAS_URI/kinect" --eval "db.contacts.countDocuments()"
  ```

- [ ] **1.6 Test Connection Locally**
  ```bash
  cd ~/Desktop/kinect/backend
  
  # Update .env
  echo "MONGODB_URI=$ATLAS_URI/kinect?retryWrites=true&w=majority" >> .env
  
  # Test connection
  npm run dev
  # Check for "✅ MongoDB Connected"
  ```

### Stage 2: Repository Preparation
**Timeline: Day 1, Afternoon**

- [ ] **2.1 Create Migration Branch**
  ```bash
  cd ~/Desktop/kinect
  git checkout -b render-migration
  git status
  ```

- [ ] **2.2 Remove Railway/Docker Files**
  ```bash
  # Remove Railway files
  rm -f railway.json railway.toml railway.env.example
  rm -f RAILWAY-DEPLOY.md railway-template.json
  rm -f nginx.railway.conf Dockerfile.railway
  rm -f scripts/railway-start.sh scripts/test-railway-config.sh
  
  # Remove Docker files
  rm -f docker-compose.yml docker-compose.selfhosted.yml
  rm -f Dockerfile
  rm -f backend/Dockerfile backend/Dockerfile.selfhosted
  rm -f frontend-web/Dockerfile.selfhosted
  rm -f init-mongo.js
  
  # Verify removal
  git status --porcelain | grep "^D"
  ```

- [ ] **2.3 Update Backend Code**

  **File: `backend/src/app.ts`**
  ```typescript
  // Line 18 - REMOVE this import:
  // import './services/notification.service.simple';
  ```

  **File: `backend/src/config/database.ts`**
  ```typescript
  import mongoose from 'mongoose';

  const connectDB = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI as string;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined');
      }

      const conn = await mongoose.connect(mongoUri, {
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
      });
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  };

  export default connectDB;
  ```

  **File: `backend/package.json`**
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

- [ ] **2.4 Update Frontend Code**

  **File: `frontend-web/src/config/api.ts`**
  ```typescript
  import axios from 'axios';

  const getApiUrl = () => {
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_API_URL || 'https://kinect-api.onrender.com/api';
    }
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

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  export default api;
  ```

  **File: `frontend-web/package.json`**
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

- [ ] **2.5 Create Environment Example**

  **File: `backend/.env.example`**
  ```bash
  # Server Configuration
  NODE_ENV=production
  PORT=3001

  # MongoDB Atlas
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kinect?retryWrites=true&w=majority

  # JWT Secrets
  JWT_SECRET=your-jwt-secret-here
  JWT_REFRESH_SECRET=your-refresh-secret-here

  # CORS Configuration
  CORS_ORIGIN=https://kinect-web.onrender.com

  # SMTP Configuration
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASS=your-api-key-here
  FROM_EMAIL=noreply@kinect.app

  # Frontend URL
  FRONTEND_URL=https://kinect-web.onrender.com
  ```

- [ ] **2.6 Commit Changes**
  ```bash
  git add .
  git commit -m "feat: migrate from Railway to Render deployment

  - Remove Railway and Docker configurations
  - Add Render blueprint (render.yaml)
  - Create standalone reminder script for cron jobs
  - Update database config for MongoDB Atlas
  - Configure frontend for production API URL"
  
  git push origin render-migration
  ```

### Stage 3: Render Deployment
**Timeline: Day 2, Morning**

- [ ] **3.1 Render Account Setup**
  - Go to render.com
  - Sign up with GitHub
  - Authorize Render GitHub app
  - Verify email

- [ ] **3.2 Create Services from Blueprint**
  - Click "New +" → "Blueprint"
  - Connect repository: kinect
  - Branch: render-migration
  - Name: "kinect-production"
  - Click "Apply"
  - Wait for services to be created

- [ ] **3.3 Configure Backend Environment**
  ```bash
  # Navigate to kinect-api service
  Dashboard → kinect-api → Environment
  
  # Add variables:
  MONGODB_URI=mongodb+srv://kinect-admin:PASSWORD@cluster.mongodb.net/kinect?retryWrites=true&w=majority
  SMTP_HOST=smtp.sendgrid.net
  SMTP_USER=apikey
  SMTP_PASS=SG.your-sendgrid-api-key
  
  # Save (triggers redeploy)
  ```

- [ ] **3.4 Configure Cron Job Environment**
  ```bash
  # Navigate to kinect-reminders service
  Dashboard → kinect-reminders → Environment
  
  # Add same variables as backend:
  MONGODB_URI=mongodb+srv://kinect-admin:PASSWORD@cluster.mongodb.net/kinect?retryWrites=true&w=majority
  SMTP_HOST=smtp.sendgrid.net
  SMTP_USER=apikey
  SMTP_PASS=SG.your-sendgrid-api-key
  
  # Save
  ```

- [ ] **3.5 Monitor Deployment**
  - Check build logs for each service
  - Wait for status: "Live"
  - Note service URLs

### Stage 4: Testing & Validation
**Timeline: Day 2, Afternoon**

- [ ] **4.1 Test Backend API**
  ```bash
  # Health check
  curl https://kinect-api.onrender.com/health
  # Expected: {"status":"OK","timestamp":"..."}
  
  # Test auth endpoint
  curl -X POST https://kinect-api.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
  ```

- [ ] **4.2 Test Frontend**
  ```bash
  # Open in browser
  open https://kinect-web.onrender.com
  
  # Check browser console
  # No errors should appear
  # API calls should succeed
  ```

- [ ] **4.3 Test End-to-End Flow**
  - Register new account
  - Login
  - Add contact
  - Create list
  - Edit contact
  - Delete contact
  - Logout

- [ ] **4.4 Test Cron Job**
  ```bash
  # Render Dashboard
  Navigate to kinect-reminders
  Click "Run Now" button
  Check Logs tab
  
  # Expected output:
  ✅ Connected to MongoDB Atlas
  ✅ Reminders sent successfully  
  ✅ Disconnected from MongoDB
  ```

- [ ] **4.5 Performance Check**
  ```bash
  # API latency
  time curl https://kinect-api.onrender.com/health
  # Should be < 500ms
  
  # Frontend load time
  # Use Chrome DevTools → Lighthouse
  # Performance score should be > 80
  ```

### Stage 5: DNS & Production Switch
**Timeline: Day 3**

- [ ] **5.1 Add Custom Domain (if applicable)**
  ```bash
  # Render Dashboard
  kinect-web → Settings → Custom Domains
  Add: kinect.app
  
  # Copy DNS records provided
  ```

- [ ] **5.2 Update DNS Provider**
  ```bash
  # Add CNAME record
  Type: CNAME
  Name: @ (or www)
  Value: kinect-web.onrender.com
  TTL: 3600
  ```

- [ ] **5.3 Update Production Environment Variables**
  ```bash
  # Update all services
  CORS_ORIGIN=https://kinect.app
  FRONTEND_URL=https://kinect.app
  VITE_API_URL=https://kinect.app/api
  ```

- [ ] **5.4 Final Production Test**
  - Test with custom domain
  - Verify SSL certificate
  - Test all features
  - Check email delivery

### Stage 6: Cleanup & Documentation
**Timeline: Day 3-4**

- [ ] **6.1 Merge to Main Branch**
  ```bash
  git checkout main
  git pull origin main
  git merge render-migration
  git push origin main
  ```

- [ ] **6.2 Delete Railway Services**
  - Export any remaining data
  - Download invoices
  - Delete all services
  - Cancel subscription

- [ ] **6.3 Update Documentation**
  ```bash
  # Update README
  # Replace Railway references with Render
  # Update deployment instructions
  # Add Render badges
  ```

- [ ] **6.4 Clean Up Branches**
  ```bash
  git branch -d render-migration
  git push origin --delete render-migration
  ```

## Testing Checkpoints

### After Stage 1 (MongoDB Atlas)
✓ Can connect to Atlas from local machine
✓ Data successfully migrated
✓ All collections present
✓ Document counts match

### After Stage 2 (Repository)
✓ All Railway files removed
✓ render.yaml validates
✓ Cron script exists
✓ Package.json scripts updated
✓ No TypeScript errors

### After Stage 3 (Render Deploy)
✓ All services show "Live"
✓ No build errors
✓ Environment variables set
✓ Health checks passing

### After Stage 4 (Testing)
✓ API responds correctly
✓ Frontend loads
✓ Authentication works
✓ CRUD operations work
✓ Cron job executes
✓ Emails send

### After Stage 5 (Production)
✓ Custom domain works
✓ SSL certificate valid
✓ All features functional
✓ Performance acceptable

### After Stage 6 (Cleanup)
✓ Code merged to main
✓ Railway cancelled
✓ Documentation updated
✓ Team notified

## Rollback Procedures

### If MongoDB Atlas fails:
```bash
# Keep Railway MongoDB running
# Don't delete until Atlas verified
# Can revert connection string
```

### If Render deployment fails:
```bash
# Railway still running
# Revert DNS if changed
# Debug with Render support
```

### If critical bug found:
```bash
git revert HEAD
git push origin main
# Render auto-deploys revert
```

## Success Criteria

- [ ] Zero downtime during migration
- [ ] All user data preserved
- [ ] No degradation in performance
- [ ] Cost within budget ($16/month)
- [ ] Successful week of operation

## Notes

- Keep Railway running until Render verified (1 week minimum)
- Take screenshots of Railway config before deletion
- Document all environment variables
- Save MongoDB Atlas connection string securely
- Monitor Render metrics dashboard daily for first week