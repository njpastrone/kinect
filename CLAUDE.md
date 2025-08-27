# Kinect Project Context for AI Assistants

## Project Overview

Kinect is a privacy-first, self-hosted relationship management application designed to help users maintain meaningful connections with friends and loved ones. It tracks communication patterns and sends timely reminders to encourage regular contact.

**🔒 Privacy-First**: 100% local deployment with no cloud dependencies
**🛡️ Error-Resilient**: Enterprise-grade error handling with automatic retry mechanisms
**🏠 Self-Hosted**: Complete Docker-based deployment for personal use

## Key Concepts

- **Relationship Categories**: Best Friends (30-day reminder), Friends (90-day reminder), Acquaintances (180-day reminder), Custom
- **Communication Tracking**: Manual logging with automated reminders based on last contact dates
- **Multi-platform**: Web application with PWA support, containerized backend
- **Error Handling**: Comprehensive error boundaries, retry logic, and user feedback systems
- **Self-Hosted**: Docker Compose deployment with MongoDB, Node.js backend, React frontend

## Architecture

The project follows a containerized multi-tier architecture:

- **Backend API**: Node.js/Express with TypeScript
- **Database**: MongoDB with health checks and backup capabilities
- **Frontend**: React with Vite, TypeScript, and Tailwind CSS
- **Proxy Layer**: Nginx for static serving and API proxying
- **Shared Module**: Common TypeScript types and utilities
- **Error Handling**: Comprehensive error boundaries, retry mechanisms, and monitoring

## Development Guidelines

### Code Organization

- Backend code goes in `/backend/` with subdirectories for api, models, services, and config
- Web frontend code goes in `/frontend-web/`
- Shared types and interfaces go in `/shared/` (built for both CommonJS and ESM)
- Error handling components in `/frontend-web/src/components/common/`
- Utility functions for retry logic and error reporting in `/frontend-web/src/utils/`
- Docker configurations for self-hosted deployment

### API Design

- RESTful API design patterns with comprehensive error responses
- JWT-based authentication with refresh token support
- Request deduplication to prevent duplicate operations
- Exponential backoff retry logic for network failures
- Circuit breaker patterns for fault tolerance
- Proper HTTP status codes and error message standardization

### Database Schema

Key entities to implement:

- Users (authentication, profile)
- Contacts (name, birthday, category, last_contact_date)
- Contact Lists (user's organized groups)
- Notification Settings (per-category intervals)
- Communication Logs (phone call records)

### Security Considerations

- Encrypt sensitive data at rest
- Implement proper authentication and authorization
- Request minimal permissions for phone log access
- Follow GDPR/CCPA compliance guidelines
- Never store raw phone numbers or call content

### Testing Requirements

- Unit tests for business logic
- Integration tests for API endpoints
- UI tests for critical user flows
- Error handling and boundary testing
- Retry mechanism validation
- Docker health check verification
- Manual testing scenarios documented in QUICKSTART.md

### Performance Considerations

- Optimize database queries for contact list retrieval
- Implement pagination for large contact lists
- Cache frequently accessed data
- Efficient notification scheduling (batch processing)

## Common Tasks

### Adding a New Feature

1. Update the database schema if needed
2. Implement backend API endpoints
3. Add frontend components and views
4. Update iOS app if applicable
5. Write tests for new functionality
6. Update documentation

### Working with Notifications

- Use Firebase Cloud Messaging or OneSignal
- Implement batch scheduling to avoid overwhelming users
- Allow users to customize notification preferences
- Include unsubscribe/snooze options

### Integrating Phone Logs

- Request appropriate permissions on iOS
- Use CallKit framework for iOS
- Implement privacy-preserving sync mechanism
- Only store necessary metadata (timestamp, contact identifier)

## Development Commands

```bash
# Self-Hosted Deployment (Recommended)
docker compose -f docker-compose.selfhosted.yml up -d      # Start all services
docker compose -f docker-compose.selfhosted.yml down       # Stop all services
docker compose -f docker-compose.selfhosted.yml ps         # Check service status
docker compose -f docker-compose.selfhosted.yml logs -f    # View logs

# Development (Local)
# Backend
npm run dev        # Start development server
npm run test       # Run tests (currently no tests configured)
npm run lint       # Lint code
npm run build      # TypeScript compilation and build
npm run seed       # Seed database with sample data
npm run reset      # Reset database

# Frontend
npm run dev        # Start development server (Vite)
npm run build      # TypeScript check and production build
npm run test       # Run tests (currently no tests configured)
npm run lint       # Lint code

# Shared Package
npm run build      # Build both CommonJS and ESM versions
```

## Important Notes

- Privacy is paramount - collect only necessary data
- User experience should be simple and intuitive
- Focus on helping users maintain meaningful connections
- Regular contact reminders should feel helpful, not intrusive
- Consider different cultural norms around communication frequency

## MVP Priorities

1. User authentication and account creation
2. Basic contact list CRUD operations
3. Phone log integration (read-only)
4. Simple notification system with default intervals
5. Clean, responsive UI for web
6. Basic iOS app with core functionality

## Current Implementation Status

### Completed Features ✅

**Core Application:**
- User authentication (register, login, logout, password reset)
- Contact management with CRUD operations
- Contact list creation and management with bidirectional references
- Dashboard with overdue contacts and statistics
- Modal-based UI for contact/list creation and editing
- Professional UI/UX with Tailwind CSS
- TypeScript implementation across frontend and backend
- MongoDB integration with Mongoose
- JWT-based authentication
- State management with Zustand
- Real-time contact-to-list synchronization

**Error Handling & Reliability:**
- Comprehensive error boundaries with retry mechanisms
- Form validation with FormError, FormField, and FormErrorSummary components
- Exponential backoff retry logic for failed operations
- Request deduplication to prevent duplicate API calls
- Circuit breaker pattern for network resilience
- Toast notifications for all user actions
- Optimistic UI updates with graceful rollback
- Development error reporting and debugging tools
- Global error handlers for unhandled errors and promise rejections

**Self-Hosted Deployment:**
- Docker Compose configuration with health checks
- Multi-stage Docker builds for optimized containers
- Nginx proxy configuration for API routing
- MongoDB with automatic backup capabilities
- Security headers and CORS configuration
- Non-root container execution for security

### Recent Major Improvements ✅

**Error Handling Overhaul:**
- Eliminated silent failures with comprehensive user feedback
- Added retry mechanisms with exponential backoff and jitter
- Implemented error boundaries for graceful failure recovery
- Created consistent form validation across all modals
- Added development debugging tools accessible via `window.__debugErrors`

**Docker & Deployment Fixes:**
- Fixed TypeScript compilation errors in containerized builds
- Resolved module resolution conflicts between CommonJS and ESM
- Fixed Docker container startup issues and missing directories
- Updated nginx configuration for proper API proxying
- Added comprehensive health checks for all services

**UI/UX Polish:**
- Professional loading states with spinners and progress indicators
- Consistent error messaging with icons and accessibility
- Enhanced form validation with clear, actionable feedback
- Optimistic updates for immediate user feedback
- Toast notifications for all operations

### Current Limitations ⚠️

- No automated test coverage (unit/integration/e2e tests missing)
- Email notifications require SMTP configuration
- iOS native app not yet implemented
- Phone log integration not implemented
- Social media integration not available
- Analytics dashboard not implemented

### API Endpoints

```
Authentication:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

Contacts:
- GET /api/contacts (with pagination, filtering)
- GET /api/contacts/overdue
- GET /api/contacts/:id
- POST /api/contacts
- PUT /api/contacts/:id
- DELETE /api/contacts/:id
- POST /api/contacts/:id/log-contact
- PATCH /api/contacts/:id/mark-contacted

Lists:
- GET /api/lists (with stats)
- GET /api/lists/:id
- GET /api/lists/:id/contacts
- POST /api/lists
- PUT /api/lists/:id
- DELETE /api/lists/:id
- POST /api/lists/:id/contacts/:contactId
- DELETE /api/lists/:id/contacts/:contactId
```

## Future Enhancements (Post-MVP)

**Communication Integration:**
- Email and text message tracking
- Phone log integration (iOS CallKit)
- Social media integration
- Calendar integration for birthdays and events
- Group messaging reminders

**Analytics & Intelligence:**
- Analytics dashboard for communication patterns
- AI-powered relationship insights
- Custom notification messages
- Relationship health scoring

**Development & Operations:**
- Comprehensive test suite (Jest, Vitest, Playwright)
- CI/CD pipeline setup
- API documentation with Swagger
- Performance monitoring and alerting
- Automated backup scheduling
- Multi-user support with organizations

**Mobile & Cross-Platform:**
- iOS native app with SwiftUI
- Android native app
- Desktop applications (Electron)
- Browser extensions for quick contact logging

## Error Handling Architecture

### Component-Level Error Handling

**FormError Components (`/frontend-web/src/components/common/FormError.tsx`):**
- `FormError`: Individual field error display with icons and accessibility
- `FormField`: Wrapper component for consistent field styling and error display
- `FormErrorSummary`: Aggregated error display for forms with multiple issues
- Supports ARIA live regions for screen reader compatibility

**Error Boundaries (`/frontend-web/src/components/common/ErrorBoundary.tsx`):**
- Feature-specific boundaries: `ContactsErrorBoundary`, `ListsErrorBoundary`, `DashboardErrorBoundary`
- Retry mechanisms with exponential backoff
- Development debugging information display
- Graceful fallback UI with user-friendly error messages

### Network Resilience

**Retry Logic (`/frontend-web/src/utils/retry.ts`):**
- Exponential backoff with jitter to prevent thundering herd
- Configurable retry strategies for different operation types
- Circuit breaker pattern to prevent cascading failures
- Request deduplication to avoid duplicate API calls

**Request Configurations:**
```typescript
export const retryConfigs = {
  query: { maxAttempts: 3, baseDelay: 1000, maxDelay: 8000 },
  mutation: { maxAttempts: 2, baseDelay: 1500, maxDelay: 6000 },
  critical: { maxAttempts: 5, baseDelay: 2000, maxDelay: 16000 }
};
```

### Development Tools

**Error Reporting (`/frontend-web/src/utils/errorReporting.ts`):**
- Global error handlers for unhandled errors and promise rejections
- Development-only error overlay with detailed stack traces
- Error history tracking with context preservation
- Debug tools accessible via `window.__debugErrors`:
  - `showErrors()`: Display error history
  - `downloadErrorReport()`: Export error data as JSON
  - `testError(message)`: Trigger test error for boundary testing

### State Management Integration

**Zustand Store Enhancement:**
- Optimistic updates with automatic rollback on failure
- Error state management integrated into all store actions
- Toast notifications for user feedback
- Loading state management with proper cleanup

## Self-Hosted Deployment Guide

### Quick Start
```bash
# Clone repository and start services
git clone <repository-url>
cd kinect
docker compose -f docker-compose.selfhosted.yml up -d

# Access application at http://localhost:3000
# API available at http://localhost:3000/api
```

### Service Architecture
- **Frontend** (`kinect-web`): Nginx serving React app with API proxy
- **Backend** (`kinect-api`): Node.js/Express API server
- **Database** (`kinect-db`): MongoDB with health checks
- **Networking**: Isolated bridge network with service discovery

### Health Monitoring
```bash
# Check all services
docker compose -f docker-compose.selfhosted.yml ps

# Health check endpoints
curl http://localhost:3000/health        # Frontend health
curl http://localhost:3000/api/health    # Backend health via proxy
```

### Backup & Maintenance
```bash
# Manual backup
docker compose -f docker-compose.selfhosted.yml exec mongodb mongodump --out /backups

# View logs
docker compose -f docker-compose.selfhosted.yml logs -f [service-name]

# Restart specific service
docker compose -f docker-compose.selfhosted.yml restart [service-name]
```

## Testing the Enhanced Application

### Form Validation Testing
1. Navigate to any form (Add Contact, Register, etc.)
2. Submit with empty required fields
3. **Expected**: Clear error messages with icons appear
4. **Expected**: Form submission is blocked until errors are resolved

### Network Resilience Testing
1. Create a contact successfully
2. Disconnect internet briefly
3. Attempt another operation (edit/create contact)
4. **Expected**: "Request failed. Retrying..." toast appears
5. **Expected**: Operation succeeds automatically when connection restored

### Error Boundary Testing
1. Open browser DevTools (F12) → Console
2. Execute: `window.__debugErrors.testError("Test boundary")`
3. **Expected**: Error boundary displays with retry option
4. **Expected**: Retry button restores normal functionality

### Debug Tools Testing
1. In Console: `window.__debugErrors.showErrors()`
2. **Expected**: Complete error history display
3. Execute: `window.__debugErrors.downloadErrorReport()`
4. **Expected**: Downloads comprehensive error report JSON

### Load Testing Scenarios
1. **Bulk Operations**: Create multiple contacts rapidly
2. **Network Interruption**: Test during various operations
3. **Invalid Data**: Submit malformed data to test validation
4. **Concurrent Actions**: Perform multiple actions simultaneously

All testing scenarios are documented and verified in `QUICKSTART.md` with step-by-step instructions.
