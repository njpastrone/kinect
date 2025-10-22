# Kinect Project Context for AI Assistants

## Project Overview

Kinect is a privacy-first relationship management application designed to help users maintain meaningful connections with friends and loved ones. It tracks communication patterns and sends timely reminders to encourage regular contact.

**🔒 Privacy-First**: Data stored in your own MongoDB instance  
**🛡️ Error-Resilient**: Enterprise-grade error handling with automatic retry mechanisms  
**☁️ Production Ready**: Fully deployed on Render with MongoDB Atlas  
**🏠 Self-Hosted Option**: Local development with Docker Compose available  

## Current State (Updated: January 21, 2025)

### ✅ Completed & Production Ready

**Core Application:**
- ✅ User authentication (register, login, logout, password reset)
- ✅ Contact management with CRUD operations
- ✅ Contact list creation and management with bidirectional references
- ✅ **VCF Contact Import**: Import contacts from phones via .vcf files (up to 1000 contacts)
- ✅ Dashboard with overdue contacts and statistics
- ✅ Modal-based UI for contact/list creation and editing
- ✅ Professional UI/UX with Tailwind CSS
- ✅ TypeScript implementation across frontend and backend
- ✅ MongoDB integration with Mongoose
- ✅ JWT-based authentication
- ✅ State management with Zustand
- ✅ Real-time contact-to-list synchronization

**Error Handling & Reliability:**
- ✅ Comprehensive error boundaries with retry mechanisms
- ✅ Form validation with FormError, FormField, and FormErrorSummary components
- ✅ Exponential backoff retry logic for failed operations
- ✅ Request deduplication to prevent duplicate API calls
- ✅ Circuit breaker pattern for network resilience
- ✅ Toast notifications for all user actions
- ✅ Optimistic UI updates with graceful rollback
- ✅ Development error reporting and debugging tools
- ✅ Global error handlers for unhandled errors and promise rejections

**Production Deployment (Render):**
- ✅ Frontend: https://kinect-web.onrender.com (Global CDN)
- ✅ Backend API: https://kinect-api.onrender.com (Virginia region)
- ✅ Database: MongoDB Atlas cluster (N. Virginia us-east-1)
- ✅ Automated Daily Reminders: Internal cron jobs running at 9 AM UTC daily
- ✅ Manual Trigger Controls: Dashboard UI for testing and immediate processing
- ✅ Automated deployments from GitHub main branch
- ✅ Health monitoring and error alerts
- ✅ SSL/TLS encryption and security headers

**Self-Hosted Deployment:**
- ✅ Docker Compose configuration with health checks
- ✅ Multi-stage Docker builds for optimized containers
- ✅ Nginx proxy configuration for API routing
- ✅ MongoDB with automatic backup capabilities
- ✅ Security headers and CORS configuration
- ✅ Non-root container execution for security

### 🔄 Recently Updated (October 2025)

**UX Fixes from Automated Review (Oct 22, 2025):**
- ✅ **Fixed Critical Bug**: Contact creation now works with optional `customReminderDays` and `listId` fields
- ✅ **Fixed Missing Asset**: Added vite.svg favicon (eliminates 404 errors)
- ✅ **Fixed SPA Routing**: Added `_redirects` file for direct URL navigation in production
- ✅ **Improved Session Management**: Extended JWT access token to 1 hour, refresh token to 30 days
- ✅ Validated all fixes with automated Playwright testing

**Contact Search Feature (Oct 22, 2025):**
- ✅ Real-time search functionality on Contacts page
- ✅ Reusable SearchBar component with debounced input (300ms)
- ✅ Multi-field search (name, email, phone, notes)
- ✅ Clear button for easy search reset
- ✅ Search works alongside existing filters (overdue, lists)
- ✅ Dynamic page subtitle shows search result count
- ✅ Optimized with useRef to prevent unnecessary re-renders

**VCF Contact Import Feature (Jan 21, 2025):**
- ✅ Full VCF (.vcf) file import functionality
- ✅ Drag-and-drop file upload with preview
- ✅ Automatic parsing of vCard 3.0 format
- ✅ Intelligent name splitting for single-field names
- ✅ **Single-name contact support** (e.g., "Madonna", "Prince")
- ✅ Duplicate detection (email, phone, exact name match)
- ✅ Bulk import optimization (up to 1000 contacts)
- ✅ Preview table with validation status indicators
- ✅ Selective import (checkbox selection)
- ✅ 60-second timeout for large imports
- ✅ Fallback to individual inserts if bulk fails
- ✅ **Fixed**: No longer duplicates single names (Alphonso → firstName: "Alphonso", lastName: "")
- ✅ **Fixed**: Pagination limit removed - all contacts now display (up to 1000)
- ✅ **Fixed**: Sorting now properly handles single-name contacts alphabetically

### 🔄 Previously Updated (September 2025)

**Reminder System Testing & Database Issues (Sept 20, 2025):**
- ✅ Created comprehensive reminder testing scripts
- ✅ Configured Gmail SMTP for production email delivery
- ✅ Fixed nodemailer integration issues (createTransport vs createTransporter)
- ⚠️ Discovered database split: users in 'test' DB vs 'kinect' DB
- ✅ Created user migration script to move accounts between databases
- ✅ Successfully tested email reminders with real SMTP

**Project Cleanup & Documentation:**
- ✅ Removed Welcome Demo system that was causing React hooks violations
- ✅ Cleaned up Railway deployment artifacts and references
- ✅ Restructured documentation for portfolio presentation
- ✅ Created professional README for external stakeholders
- ✅ Organized technical docs in `/docs` directory structure
- ✅ Updated CLAUDE.md with current project state

**Repository Structure:**
```
kinect/
├── README.md                 # Professional portfolio presentation
├── CLAUDE.md                 # AI assistant context (this file)
├── docs/
│   ├── README_DEVELOPERS.md  # Developer setup and contribution guide
│   ├── README_DEPLOYMENT.md  # Production deployment instructions
│   ├── development/          # Testing strategies and development docs
│   └── deployment/           # Deployment configurations and guides
├── backend/                  # Node.js/Express API
├── frontend-web/             # React/TypeScript web application
├── shared/                   # Shared TypeScript types and utilities
└── [other directories...]
```

## Architecture

### Production (Render + MongoDB Atlas)
- **Backend API**: Node.js/Express with TypeScript on Render Web Service (Virginia region)
- **Database**: MongoDB Atlas cluster (N. Virginia us-east-1) with ~5ms latency
- **Frontend**: React with Vite on Render Static Site (Global CDN)
- **Cron Jobs**: Render Cron Service for scheduled reminders (Virginia region)
- **Shared Module**: Common TypeScript types and utilities (built for both CommonJS and ESM)

### Local Development
- **Backend API**: Node.js/Express with TypeScript (port 3001)
- **Database**: Local MongoDB or MongoDB Atlas connection
- **Frontend**: Vite dev server with hot reload (port 5173)
- **Error Handling**: Comprehensive error boundaries, retry mechanisms, and monitoring

### Technology Stack
```typescript
// Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for development and building
- Zustand for state management
- React Router for navigation
- React Hook Form for forms
- React Hot Toast for notifications

// Backend
- Node.js/Express with TypeScript
- MongoDB with Mongoose ODM
- JWT authentication with refresh tokens
- bcryptjs for password hashing
- nodemailer for email notifications
- express-rate-limit for API protection

// Infrastructure
- Render for production hosting
- MongoDB Atlas for database
- Docker for self-hosted deployments
- GitHub for version control
- ESLint/Prettier for code quality
```

## API Design

### RESTful API Endpoints
```typescript
// Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

// Contacts
GET    /api/contacts           # with pagination, filtering
GET    /api/contacts/overdue
GET    /api/contacts/:id
POST   /api/contacts
PUT    /api/contacts/:id
DELETE /api/contacts/:id
POST   /api/contacts/:id/log-contact
PATCH  /api/contacts/:id/mark-contacted
POST   /api/contacts/import/parse      # Parse VCF file and preview
POST   /api/contacts/import/confirm    # Bulk import contacts

// Lists
GET    /api/lists             # with stats
GET    /api/lists/:id
GET    /api/lists/:id/contacts
POST   /api/lists
PUT    /api/lists/:id
DELETE /api/lists/:id
POST   /api/lists/:id/contacts/:contactId
DELETE /api/lists/:id/contacts/:contactId

// Health & Monitoring
GET    /health
```

### Database Schema
```typescript
// Core entities with optimized relationships
interface User {
  _id: ObjectId;
  email: string;
  password: string; // bcrypt hashed
  firstName: string;
  lastName: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  timestamps: true;
}

interface Contact {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  category: 'bestfriend' | 'friend' | 'acquaintance';
  reminderDays: number;
  lastContactDate?: Date;
  lists: ObjectId[]; // Bidirectional reference
  timestamps: true;
}

interface ContactList {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  color: string;
  description?: string;
  reminderDays: number;
  isDefault: boolean;
  timestamps: true;
}
```

## Development Patterns

### Code Organization
- **Backend**: Layered architecture (routes → controllers → services → models)
- **Frontend**: Feature-based structure with shared components
- **Shared**: Common TypeScript types and constants
- **Error Handling**: Centralized error boundaries and retry logic
- **State Management**: Zustand stores with TypeScript interfaces
- **API Integration**: Centralized API client with error handling

### Error Handling Architecture
```typescript
// Component-level error boundaries
<ErrorBoundary>
  <FeatureComponent />
</ErrorBoundary>

// Network resilience with retry logic
const retryConfigs = {
  query: { maxAttempts: 3, baseDelay: 1000 },
  mutation: { maxAttempts: 2, baseDelay: 1500 },
  critical: { maxAttempts: 5, baseDelay: 2000 }
};

// Form validation with user feedback
<FormField error={errors.name}>
  <input {...register('name')} />
</FormField>
```

### Security Patterns
```typescript
// Password hashing
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// JWT with refresh tokens
const tokens = {
  accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
};

// CORS and security headers
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

## Known Issues & Limitations

### Current Limitations
- No automated test coverage (unit/integration/e2e tests missing)
- ⚠️ Database inconsistency: Authentication may use 'test' DB while app uses 'kinect' DB
- iOS native app not yet implemented
- Phone log integration not implemented
- Social media integration not available
- Analytics dashboard not implemented

### Development Notes
- Welcome Demo system was removed due to React hooks violations
- All hooks must be called at top level (not in try-catch blocks)
- Context providers must be properly nested
- Error boundaries catch React errors, not async/promise errors
- MongoDB connection issues are automatically retried

## Development Commands

### Root Level
```bash
# Development
npm run dev:all          # Start both backend and frontend
npm run dev:backend      # Backend only (port 3001)
npm run dev:web          # Frontend only (port 5173)

# Building
npm run build:all        # Build all packages
npm run test             # Run all tests
npm run lint             # Lint all workspaces

# Database
npm run seed             # Add sample data
npm run reset-db         # Clear database
```

### Testing Reminders
```bash
# Complete demo with MailHog (local)
cd backend
npm run demo:reminders    # Full demo with test data and email viewer

# Test with specific user
TEST_USER_EMAIL=user@example.com node scripts/test-production-reminders.js
node scripts/send-test-reminder.js

# Manual trigger testing
node scripts/test-notification-service.js  # Test service methods directly
node scripts/test-manual-triggers.js       # Test API endpoints (requires auth)

# Database debugging
node scripts/debug-database.js       # Check all users and databases
node scripts/check-all-databases.js  # Search across multiple DBs
node scripts/migrate-user.js         # Move user between databases
```

### Environment Setup
```bash
# Required environment variables
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kinect
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
CORS_ORIGIN=http://localhost:5173

# Email configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password  # 16-char app password from Google
FROM_EMAIL=your-email@gmail.com

# Local testing with MailHog
# SMTP_HOST=localhost
# SMTP_PORT=1025
```

## Testing Strategy

### Manual Testing Scenarios
1. **User Registration & Login**: Create account, verify email validation, login/logout
2. **Contact Management**: Add, edit, delete contacts with form validation
3. **List Organization**: Create lists, add contacts to lists, manage relationships  
4. **Error Handling**: Test network failures, form errors, boundary errors
5. **Responsive Design**: Test on mobile devices and different screen sizes

### API Testing
- REST Client collection available at `tests/api/kinect.http`
- Postman collection at `tests/api/kinect.postman_collection.json`
- Health check endpoint: `/health`

### Error Testing
- Error boundary testing: `window.__debugErrors.testError("Test")`
- Network resilience: Disconnect internet during operations
- Form validation: Submit forms with invalid/empty data

## Deployment Status

### Production URLs
- **Frontend**: https://kinect-web.onrender.com
- **Backend**: https://kinect-api.onrender.com  
- **Health**: https://kinect-api.onrender.com/health

### Deployment Pipeline
- **Trigger**: Push to `main` branch
- **Build**: Automated via `render.yaml` blueprint
- **Services**: Backend API, Frontend static site, Cron jobs
- **Monitoring**: Health checks, error alerts, deployment notifications

## Important Development Notes

### React Hooks Rules (Critical)
- **NEVER** call hooks inside try-catch blocks
- **ALWAYS** call hooks at the top level of components
- **NEVER** call hooks conditionally
- Use context providers properly and ensure hooks are called within provider scope

### Error Handling Best Practices
- Use Error Boundaries for React component errors
- Implement retry logic for network requests
- Provide user-friendly error messages
- Log errors for debugging but don't expose sensitive information

### Database Best Practices
- Use proper indexing for query performance
- Validate data at both client and server level
- Handle connection failures gracefully
- Use transactions for related operations

### Security Considerations
- Hash passwords with bcrypt
- Use JWT with short expiration times
- Implement rate limiting on API endpoints
- Validate and sanitize all user input
- Use HTTPS in production
- Set proper CORS policies

## Known Database Issues

### User Database Split Problem
The application has a database consistency issue where:
- Some users exist in the `test` database
- Production operations use the `kinect` database  
- Authentication may check different database than other operations

**Symptoms:**
- "User already exists" error during registration but user not found in queries
- Reminder scripts process 0 users despite users existing
- Different user counts in different operations

**Solutions:**
1. Use `scripts/check-all-databases.js` to locate users
2. Use `scripts/migrate-user.js` to move users to correct database
3. Ensure MONGODB_URI points to `/kinect` database path

### Testing Email Reminders

**Production Testing:**
1. Create test contacts with old dates using `test-production-reminders.js`
2. Send reminders with `send-test-reminder.js` (bypasses Mongoose models)
3. Check email inbox for reminders from configured FROM_EMAIL

**Local Testing with MailHog:**
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
# View emails at http://localhost:8025
```

**Gmail SMTP Setup:**
1. Enable 2-Factor Authentication on Google Account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Use 16-character app password in SMTP_PASS

### Critical Database Schema Issues (September 21, 2025)

**UserId Type Mismatch Bug:**
- **Problem**: Contact model schema defines `userId` as String, but data was stored as ObjectId
- **Symptom**: API returns 0 contacts even though contacts exist in database
- **Root Cause**: Type mismatch between schema (String) and stored data (ObjectId)
- **Solution**: Run `scripts/fix-userid-type.js` to convert all userId fields to String

**Script Query Fix (Critical):**
- **Problem**: Scripts were querying with `userId: user._id` (ObjectId) but database stores as String
- **Symptom**: Scripts find 0 contacts even though they exist and show in UI
- **Solution**: All scripts must use `userId: user._id.toString()` when querying contacts
- **Affected Scripts Fixed**: 
  - `send-test-reminder.js`
  - `test-production-reminders.js`  
  - `check-user-contacts.js`

**Diagnostic Scripts Created:**
- `scripts/check-user-contacts.js` - View all contacts for a specific user (uses string userId)
- `scripts/debug-production-db.js` - Debug production database connections  
- `scripts/fix-userid-type.js` - Fix userId type mismatches (ObjectId → String)
- `scripts/cleanup-duplicate-contacts.js` - Remove duplicate contacts
- `scripts/test-production-api.js` - Test production API endpoints
- `scripts/send-test-reminder.js` - Send test reminder emails (uses string userId)

**Environment Variable Configuration:**
- Ensure MONGODB_URI includes database name: `/kinect` not just `/`
- Example: `mongodb+srv://user:pass@cluster.mongodb.net/kinect?retryWrites=true`

### Automated Reminder System (September 28, 2025)

**Fully Automated Email Reminders:**
- ✅ Internal cron jobs enabled in production API service
- ✅ Daily reminders run automatically (every day at 9 AM UTC)
- ✅ No manual intervention required - fully hands-off operation
- ✅ Uses `kinect.exec.team@gmail.com` as sender address

**Automation Schedule:**
- **Daily Reminders**: Every day at 9 AM UTC
- **Processing**: Scans all users for overdue contacts
- **Email Delivery**: Professional HTML emails with dashboard links
- **Rate Limiting**: 1-second delay between emails to avoid spam

**Technical Implementation:**
- Internal `NotificationService` with `node-cron` scheduling
- Render external cron job disabled (using internal crons instead)
- Automatic service initialization on app startup
- Production-ready error handling and logging

**Manual Trigger Controls (September 28, 2025):**
- ✅ Dashboard UI controls for manual email triggers
- ✅ API endpoints: `/notifications/test` and `/notifications/trigger-daily`
- ✅ Two trigger types:
  - **Test Personal Reminder**: Send test email to current user with their overdue contacts
  - **Trigger All Daily Reminders**: Process and send reminders to all users with overdue contacts
- ✅ Professional UI with loading states and toast notifications
- ✅ Rate limiting and error handling for manual triggers
- ✅ Fully tested with real Gmail SMTP delivery

**Testing Scripts:**
- `scripts/test-automation.js` - Test the full automation system
- `scripts/test-notification-service.js` - Test service methods directly (NEW)
- `scripts/test-manual-triggers.js` - Test API endpoints with authentication (NEW)
- `scripts/send-test-reminder.js` - Manual reminder testing
- Verified working with real Gmail SMTP delivery

### VCF Import Bug Fixes (October 21, 2025)

**Issue 1: Duplicate Name Assignment**
- **Problem**: Single-name contacts (e.g., "Alphonso") were imported with duplicated names ("Alphonso Alphonso")
- **Root Cause**: VCF parser duplicated firstName as lastName when lastName was empty
- **Fix**:
  - Updated `vcf-parser.service.ts` to set `lastName = ''` for single names
  - Modified Mongoose schema to make `lastName` optional (`required: false, default: ''`)
  - Updated validation to only require `firstName`
  - Fixed 7 frontend components to properly display empty lastName
- **Files Changed**:
  - `backend/src/services/vcf-parser.service.ts`
  - `backend/src/models/Contact.model.ts`
  - `backend/src/api/routes/contacts.routes.ts`
  - `frontend-web/src/components/contacts/ContactCard.tsx`
  - `frontend-web/src/components/contacts/DeleteConfirmationModal.tsx`
  - `frontend-web/src/components/contacts/ImportContactsModal.tsx`
  - `frontend-web/src/components/contacts/GroupedContactList.tsx`
  - `frontend-web/src/components/contacts/LogContactModal.tsx`
  - `frontend-web/src/components/contacts/StatusUpdateModal.tsx`
  - `frontend-web/src/pages/Dashboard.tsx`

**Issue 2: 20-Contact Display Limit**
- **Problem**: Contacts page only displayed first 20 contacts regardless of total imported
- **Root Cause**: Default pagination limit of 20 in API, frontend not requesting more
- **Fix**: Updated `useContacts` hook to request `limit: 1000` contacts
- **Files Changed**:
  - `frontend-web/src/hooks/useContacts.ts`

**Issue 3: Contact Sorting with Single Names**
- **Problem**: Contacts with empty lastName (single-name contacts) were not sorted alphabetically
- **Root Cause**: Sort function required both firstName AND lastName, causing empty lastName contacts to be skipped
- **Fix**: Updated sorting logic to handle empty lastName gracefully using ternary operator
- **Files Changed**:
  - `frontend-web/src/utils/grouping.ts` (lines 74-77, 123-126)

**Test File Created**:
- `tests/test-single-names.vcf` - Contains test cases for single-name contacts (Alphonso, Madonna, Cher, Prince) and regular contacts

This context document reflects the current state of the Kinect project including contact search functionality, VCF import fixes, reminder testing, critical database debugging, full automation implementation, and manual trigger controls (October 22, 2025).
- to memorize